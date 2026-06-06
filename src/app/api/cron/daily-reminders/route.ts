/**
 * Cron rappels quotidiens — appelé toutes les 15 min par Supabase pg_cron.
 *
 * À chaque tick :
 *   1. Récupère tous les profils avec reminders_enabled=true
 *   2. Pour chacun, calcule l'heure locale dans son fuseau horaire
 *   3. Si l'heure courante locale est dans [reminder_time, reminder_time + 15 min)
 *      et qu'on n'a pas déjà envoyé aujourd'hui → envoie le push
 *
 * Auth : header `Authorization: Bearer ${CRON_SECRET}` OU query ?secret=...
 * (pg_cron passe le secret en query string, Vercel passait par header).
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
  reminder_time: string | null      // 'HH:MM'
  reminder_tz: string | null        // ex. 'Europe/Paris'
  last_reminder_sent_at: string | null
  pet_type: string | null
}

const PET_NAMES: Record<string, string> = { cat: 'Heidi', dog: 'Rex', bunny: 'Lune' }

/** Heure locale (HH:MM) dans le fuseau donné, à l'instant t. */
function localHHMM(tz: string, now: Date): string {
  try {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    })
    return fmt.format(now)
  } catch {
    return ''
  }
}

/** Date 'YYYY-MM-DD' locale. */
function localDateKey(tz: string, now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
    }).format(now)
    return parts
  } catch {
    return ''
  }
}

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(':').map(n => parseInt(n, 10))
  return h * 60 + m
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
    .select('id, full_name, streak, reminders_enabled, reminder_time, reminder_tz, last_reminder_sent_at, pet_type')
    .eq('reminders_enabled', true)
    .not('reminder_time', 'is', null)
    .not('reminder_tz', 'is', null)

  if (error) {
    console.error('cron error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const todoProfiles: Profile[] = []
  for (const p of (profiles ?? []) as Profile[]) {
    if (!p.reminder_time || !p.reminder_tz) continue
    const localNow = localHHMM(p.reminder_tz, now)
    if (!localNow) continue
    const target = hhmmToMinutes(p.reminder_time)
    const current = hhmmToMinutes(localNow)
    // On envoie si on est dans la fenêtre [target, target + 15 min)
    if (current < target || current >= target + 15) continue

    // Anti-doublon : si on a déjà envoyé aujourd'hui (date locale), on skippe
    const todayKey = localDateKey(p.reminder_tz, now)
    if (p.last_reminder_sent_at) {
      const lastKey = localDateKey(p.reminder_tz, new Date(p.last_reminder_sent_at))
      if (lastKey === todayKey) continue
    }
    todoProfiles.push(p)
  }

  let totalSent = 0
  for (const p of todoProfiles) {
    const payload = await buildPayloadFor(p, supabase)
    if (!payload) continue
    try {
      const { sent } = await sendPushTo(p.id, payload)
      totalSent += sent
      await supabase
        .from('profiles')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', p.id)
    } catch (e) {
      console.error('send fail', p.id, e)
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

async function buildPayloadFor(p: Profile, supabase: ReturnType<typeof getServiceRoleClient>): Promise<NotificationPayload | null> {
  const petName = PET_NAMES[p.pet_type ?? 'cat'] ?? 'Ton compagnon'
  const firstName = p.full_name?.split(' ')[0] ?? ''

  // Récupère le nb de cartes / questions dues
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

  // Streak en danger : si streak >= 3 et pas d'activité aujourd'hui
  // (cron tourne plutôt le soir donc on imagine qu'il a la journée pour réviser)
  const isStreakAtRisk = p.streak >= 3

  let title = 'DentalPrep'
  let body: string

  if (total === 0 && isStreakAtRisk) {
    title = `${petName} t'attend`
    body = `Ne casse pas ta série de ${p.streak} jours${firstName ? `, ${firstName}` : ''} — fais quelques questions.`
  } else if (total === 0) {
    // Rien à réviser et pas de streak : skip le rappel (sinon spam inutile)
    return null
  } else if (cards > 0 && quiz > 0) {
    title = `${petName} t'attend`
    body = `${cards} flashcard${cards > 1 ? 's' : ''} et ${quiz} question${quiz > 1 ? 's' : ''} à revoir aujourd'hui.`
  } else if (cards > 0) {
    title = `${cards} flashcard${cards > 1 ? 's' : ''} à revoir`
    body = `${petName} t'attend pour la révision du jour${firstName ? `, ${firstName}` : ''}.`
  } else {
    title = `${quiz} question${quiz > 1 ? 's' : ''} à revoir`
    body = `${petName} a hâte de réviser avec toi${firstName ? `, ${firstName}` : ''}.`
  }

  return {
    title, body,
    url: cards > 0 ? '/flashcards/due' : quiz > 0 ? '/quiz/due' : '/dashboard',
    tag: 'dentalprep-daily',
    renotify: true,
  }
}
