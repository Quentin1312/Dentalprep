/**
 * Cron rappels quotidiens — appelé toutes les 15 min par Supabase pg_cron.
 *
 * Logique SMART (pas d'heure choisie par l'utilisateur) :
 *   - Si pas de daily_session aujourd'hui (= pas étudié)
 *   - ET heure locale dans la fenêtre du soir (18h → 22h59)
 *   - ET pas déjà envoyé aujourd'hui
 *   → envoie un push perso
 *
 * Le ton du message s'adapte à l'heure :
 *   - 18-20h : invitation tranquille
 *   - 20-22h : un peu plus pressant
 *   - 22h+   : "dernier appel" pour préserver la streak
 *
 * Auth : header `Authorization: Bearer ${CRON_SECRET}` OU query ?secret=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient, sendPushTo, type NotificationPayload } from '@/lib/push-server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Profile = {
  id: string
  full_name: string | null
  streak: number
  reminders_enabled: boolean
  reminder_tz: string | null        // ex. 'Europe/Paris' — auto-détecté
  last_reminder_sent_at: string | null
  pet_type: string | null
}

const SEND_WINDOW_START_HOUR = 18    // 18:00
const SEND_WINDOW_END_HOUR   = 23    // 23:00 (envoi jusqu'à 22:59)

const PET_NAMES: Record<string, string> = { cat: 'Heidi', dog: 'Rex', bunny: 'Lune' }

/** Heure locale (0-23) dans le fuseau donné, à l'instant t. */
function localHour(tz: string, now: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', hour12: false, timeZone: tz,
    })
    return parseInt(fmt.format(now), 10)
  } catch {
    return -1
  }
}

/** Date 'YYYY-MM-DD' locale. */
function localDateKey(tz: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
    }).format(now)
  } catch {
    return ''
  }
}

async function handle(req: NextRequest) {
  // Auth : header Authorization OU query ?secret=... (pg_cron friendly)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    const url = new URL(req.url)
    const querySecret = url.searchParams.get('secret') ?? ''
    if (auth !== `Bearer ${secret}` && querySecret !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const supabase = getServiceRoleClient()
  const now = new Date()

  // Récupère tous les profils avec rappels activés
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, streak, reminders_enabled, reminder_tz, last_reminder_sent_at, pet_type')
    .eq('reminders_enabled', true)
    .not('reminder_tz', 'is', null)

  if (error) {
    console.error('cron error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const todoProfiles: { profile: Profile; localHour: number; todayKey: string }[] = []

  for (const p of (profiles ?? []) as Profile[]) {
    if (!p.reminder_tz) continue
    const h = localHour(p.reminder_tz, now)
    if (h < SEND_WINDOW_START_HOUR || h >= SEND_WINDOW_END_HOUR) continue

    const todayKey = localDateKey(p.reminder_tz, now)
    if (!todayKey) continue

    // Anti-doublon : déjà envoyé aujourd'hui ?
    if (p.last_reminder_sent_at) {
      const lastKey = localDateKey(p.reminder_tz, new Date(p.last_reminder_sent_at))
      if (lastKey === todayKey) continue
    }

    // A étudié aujourd'hui ? (table daily_sessions, key date locale)
    const { data: sess } = await supabase
      .from('daily_sessions')
      .select('minutes_studied')
      .eq('user_id', p.id)
      .eq('date', todayKey)
      .maybeSingle()
    if (sess && (sess as any).minutes_studied > 0) continue   // déjà actif → skip

    todoProfiles.push({ profile: p, localHour: h, todayKey })
  }

  let totalSent = 0
  for (const todo of todoProfiles) {
    const payload = await buildPayloadFor(todo.profile, todo.localHour, supabase)
    if (!payload) continue
    try {
      const { sent } = await sendPushTo(todo.profile.id, payload)
      totalSent += sent
      await supabase
        .from('profiles')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', todo.profile.id)
    } catch (e) {
      console.error('send fail', todo.profile.id, e)
    }
  }

  return NextResponse.json({
    checked: profiles?.length ?? 0,
    matched: todoProfiles.length,
    sent: totalSent,
    timestamp: now.toISOString(),
  })
}

// Supporte les 2 méthodes pour pg_cron (GET ou POST selon l'extension utilisée)
export async function GET(req: NextRequest)  { return handle(req) }
export async function POST(req: NextRequest) { return handle(req) }

// ─── Pool de messages ──────────────────────────────────────────────────────
// Chaque catégorie est un tableau de templates. Variables disponibles :
//   {pet}     → nom du compagnon (Heidi/Rex/Lune)
//   {name}    → prénom (ou '' si absent)
//   {cards}   → nb de flashcards dues
//   {quiz}    → nb de questions dues
//   {total}   → cards + quiz
//   {streak}  → série en cours
// Sélection : random parmi la catégorie.

// 3 niveaux de pression selon l'heure (chill / pressant / last call)
// Chaque niveau a des messages pour : streak en danger, both, cardsOnly, quizOnly, generic
const MESSAGES = {
  // ─── EARLY (18h-20h) — invitation tranquille ──────────────────────────────
  early: {
    streakOnly: [
      { title: '{pet} surveille ta série', body: '{streak} jours d\'affilée{name} — un petit quiz et la série tient.' },
      { title: 'Ta série de {streak} jours', body: '{pet} sait que tu peux la garder. Allez, 5 minutes.' },
      { title: 'Reste régulier·e', body: '{streak} jours d\'affilée — ne lâche pas maintenant.' },
    ],
    both: [
      { title: '{pet} a sorti tes cartes', body: '{cards} flashcards et {quiz} questions t\'attendent.' },
      { title: 'On s\'y met {name}?', body: '{total} cartes à revoir aujourd\'hui — répétition espacée oblige.' },
      { title: 'Petit créneau révisions ?', body: '{total} cartes prêtes — {pet} attend que tu commences.' },
    ],
    cardsOnly: [
      { title: '{cards} flashcards à revoir', body: '{pet} les a triées par ordre d\'urgence — 5-10 min suffisent.' },
      { title: 'Tes cartes du jour', body: '{cards} flashcards en attente. {pet} a hâte de réviser avec toi.' },
      { title: 'Petit échauffement ?', body: '{cards} flashcards à revoir{name}. On commence par les plus urgentes.' },
    ],
    quizOnly: [
      { title: '{quiz} questions à revoir', body: '{pet} a sorti les QCM — c\'est le moment.' },
      { title: 'On teste {name}?', body: '{quiz} questions t\'attendent. {pet} a hâte de voir le score.' },
      { title: '{pet} a une idée', body: '{quiz} questions à revoir. On prend 10 min ?' },
    ],
    generic: [
      { title: 'Petit créneau révisions ?', body: '{pet} t\'attend pour la session du jour{name}.' },
      { title: '{pet} a la pêche', body: 'Et toi {name} ? Allez, 5 min de révisions.' },
      { title: 'On s\'y met ?', body: '{pet} a préparé une petite session pour toi.' },
    ],
  },
  // ─── MID (20h-22h) — un peu plus pressant ─────────────────────────────────
  mid: {
    streakOnly: [
      { title: 'Ta série {name}', body: '{streak} jours d\'affilée et {pet} compte sur toi pour ce soir.' },
      { title: '{streak} jours, va pas tout perdre', body: 'Quelques questions et la série tient{name}.' },
      { title: '{pet} attend encore', body: 'Ne casse pas tes {streak} jours pour ce soir.' },
    ],
    both: [
      { title: '{total} cartes encore en attente', body: '{cards} flashcards + {quiz} questions à revoir — {pet} se demande où tu es.' },
      { title: 'Tu vas y arriver ?', body: '{total} cartes du jour pas encore vues{name}.' },
      { title: '{pet} a sorti tout son matériel', body: '{total} cartes prêtes — c\'est le moment ou jamais.' },
    ],
    cardsOnly: [
      { title: '{cards} flashcards en attente', body: '{pet} se demande où tu es passé·e — un petit créneau ?' },
      { title: 'Encore {cards} cartes{name}', body: 'C\'est court, ça pique pas — promis.' },
      { title: '{pet} a sorti les flashcards', body: '{cards} cartes à revoir avant la fin de journée.' },
    ],
    quizOnly: [
      { title: '{quiz} questions encore', body: '{pet} se demande où tu es{name}.' },
      { title: 'Allez, le quiz', body: '{quiz} questions à revoir — c\'est le moment.' },
      { title: 'Encore là {pet} ?', body: '{quiz} questions t\'attendent depuis ce matin.' },
    ],
    generic: [
      { title: '{pet} commence à s\'inquiéter', body: 'Tu reviens {name} ? Petit créneau de révisions.' },
      { title: 'Hey, t\'es où ?', body: '{pet} t\'attend pour la session du soir.' },
      { title: 'On y va ?', body: '{pet} a la patience mais bon… 10 min ?' },
    ],
  },
  // ─── LATE (22h+) — last call, sauve la streak ─────────────────────────────
  late: {
    streakOnly: [
      { title: 'Dernier appel pour ta série', body: '{streak} jours en jeu{name}. {pet} compte sur toi.' },
      { title: 'Sauve tes {streak} jours', body: 'Un quiz express et la série est sauvée.' },
      { title: '{pet} reste éveillé pour toi', body: '{streak} jours d\'affilée — go pour ce soir.' },
    ],
    both: [
      { title: 'Dernier créneau du jour', body: '{total} cartes en attente — sauve ta journée.' },
      { title: 'Allez {name}, vite fait', body: '{total} cartes prêtes — {pet} t\'attend pour finir.' },
      { title: '{pet} tient bon', body: '{total} cartes encore à voir avant minuit.' },
    ],
    cardsOnly: [
      { title: 'Avant minuit {name}', body: '{cards} flashcards à revoir — vite fait, bien fait.' },
      { title: 'Dernier appel', body: '{cards} cartes du jour — {pet} reste éveillé pour toi.' },
      { title: '{pet} t\'attend depuis ce matin', body: '{cards} flashcards — promis c\'est rapide.' },
    ],
    quizOnly: [
      { title: '{quiz} questions, dernier appel', body: '{pet} reste avec toi le temps qu\'il faut{name}.' },
      { title: 'Avant minuit', body: '{quiz} questions à revoir — 5 minutes top chrono.' },
      { title: 'On finit la journée bien ?', body: '{quiz} questions et c\'est plié.' },
    ],
    generic: [
      { title: '{pet} reste éveillé pour toi', body: 'Dernier créneau du jour{name}. On y va ?' },
      { title: 'Allez, un dernier effort', body: '{pet} t\'attend pour boucler la journée.' },
      { title: 'Avant minuit', body: '{pet} a tenu toute la journée — fais-lui plaisir.' },
    ],
  },
} as const

type Period = 'early' | 'mid' | 'late'
type Category = 'streakOnly' | 'both' | 'cardsOnly' | 'quizOnly' | 'generic'

function periodFromHour(h: number): Period {
  if (h >= 22) return 'late'
  if (h >= 20) return 'mid'
  return 'early'
}

function pickMessage(period: Period, category: Category): { title: string; body: string } {
  const pool = MESSAGES[period][category]
  return pool[Math.floor(Math.random() * pool.length)]
}

function fillTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')).replace(/\s+,/g, ',').replace(/\s+\./g, '.').trim()
}

async function buildPayloadFor(
  p: Profile,
  hourLocal: number,
  supabase: ReturnType<typeof getServiceRoleClient>,
): Promise<NotificationPayload | null> {
  const petName = PET_NAMES[p.pet_type ?? 'cat'] ?? 'Ton compagnon'
  const firstName = p.full_name?.split(' ')[0] ?? ''
  const nameWithComma = firstName ? `, ${firstName}` : ''

  // Récupère le nb de cartes / questions dues (info utile mais facultative —
  // on envoie le rappel même si rien n'est dû, pour ramener l'élève dans l'app)
  const nowIso = new Date().toISOString()
  const [{ count: dueCards }, { count: dueQuiz }] = await Promise.all([
    (supabase.from('flashcard_progress') as any)
      .select('flashcard_id', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .lte('next_review_at', nowIso),
    (supabase.from('quiz_question_progress') as any)
      .select('question_id', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .eq('is_suspended', false)
      .lte('next_review_at', nowIso),
  ])

  const cards = dueCards ?? 0
  const quiz = dueQuiz ?? 0
  const total = cards + quiz

  // Catégorie : prioritise les vraies cartes dues, sinon streak, sinon generic
  let category: Category
  if (cards > 0 && quiz > 0)      category = 'both'
  else if (cards > 0)             category = 'cardsOnly'
  else if (quiz > 0)              category = 'quizOnly'
  else if (p.streak >= 3)         category = 'streakOnly'
  else                            category = 'generic'

  const period = periodFromHour(hourLocal)
  const tpl = pickMessage(period, category)
  const vars = {
    pet: petName,
    name: nameWithComma,
    cards, quiz, total,
    streak: p.streak,
  }

  return {
    title: fillTemplate(tpl.title, vars),
    body: fillTemplate(tpl.body, vars),
    url: cards > 0 ? '/flashcards/due' : quiz > 0 ? '/quiz/due' : '/dashboard',
    tag: 'dentalprep-daily',
    renotify: true,
  }
}
