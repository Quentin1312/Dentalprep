'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readFlashXP } from '@/lib/flash-store'
import type { EquippedAccessories } from '@/lib/accessories'

type Profile = { full_name: string | null; exam_date: string | null; streak: number; daily_goal_minutes: number; pet_type: string | null; equipped_accessories: EquippedAccessories }
type Course = { id: string; module_id: string; title: string; page_count: number | null }
type Attempt = { module_id: string; is_correct: boolean; question_id: string }
type QuestionRef = { id: string; course_id: string; module_id: string }

interface AppData {
  userId: string
  profile: Profile
  courses: Course[]
  attempts: Attempt[]
  questions: QuestionRef[]
  questionCourseMap: Record<string, string>
  todayMinutes: number
  flashXpBonus: number
  flashcardsDueCount: number
  quizDueCount: number                  // questions de quiz dont next_review_at <= now (SM-2)
  recentWrongQuestionCount: number     // questions dont la dernière tentative = fausse
  practiceTodoCount: number             // cas pratiques pas validés à 100%
}

interface AppContextValue {
  data: AppData | null
  loading: boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextValue>({ data: null, loading: true, refresh: async () => {} })

const CACHE_KEY = 'dentalprep_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function readCache(): AppData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return { ...data, flashXpBonus: readFlashXP() } as AppData
  } catch { return null }
}

function writeCache(data: AppData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [data, setData] = useState<AppData | null>(() => {
    if (typeof window === 'undefined') return null
    return readCache()
  })
  const [loading, setLoading] = useState(!readCache())
  const fetchedRef = useRef(false)

  const fetchAll = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const today = new Date().toISOString().split('T')[0]
    const supaAny = supabase as any
    const [profRes, coursesRes, attemptsRes, todayRes, questionsRes, dueCardsRes, practicalExosRes, practicalAttemptsRes, attemptsTimedRes, dueQuizRes] = await Promise.all([
      supaAny.from('profiles').select('full_name,exam_date,streak,daily_goal_minutes,pet_type,equipped_accessories').eq('id', user.id).single(),
      supabase.from('courses').select('id,module_id,title,page_count').eq('user_id', user.id),
      supabase.from('quiz_attempts').select('module_id,is_correct,question_id').eq('user_id', user.id),
      supabase.from('daily_sessions').select('minutes_studied').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('quiz_questions').select('id,course_id,module_id').eq('user_id', user.id),
      supaAny.from('flashcard_progress')
        .select('flashcard_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString()),
      supaAny.from('practical_exercises').select('id').eq('user_id', user.id),
      supaAny.from('practical_attempts').select('exercise_id,score,created_at').eq('user_id', user.id),
      supabase.from('quiz_attempts').select('question_id,is_correct,created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
      supaAny.from('quiz_question_progress')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_suspended', false)
        .lte('next_review_at', new Date().toISOString()),
    ])

    // last-wrong : pour chaque question, on garde la dernière tentative
    const lastWrong = new Map<string, boolean>()
    for (const a of (attemptsTimedRes.data ?? []) as { question_id: string; is_correct: boolean }[]) {
      lastWrong.set(a.question_id, a.is_correct)
    }
    const recentWrongQuestionCount = Array.from(lastWrong.values()).filter(c => c === false).length

    // practice todo : exos jamais validés à 100%
    const bestScore = new Map<string, number>()
    for (const a of (practicalAttemptsRes.data ?? []) as { exercise_id: string; score: number }[]) {
      bestScore.set(a.exercise_id, Math.max(bestScore.get(a.exercise_id) ?? 0, a.score))
    }
    const practiceExoIds: string[] = ((practicalExosRes.data ?? []) as { id: string }[]).map(e => e.id)
    const practiceTodoCount = practiceExoIds.filter(id => (bestScore.get(id) ?? 0) < 1).length

    if (!profRes.data?.full_name) { router.replace('/setup'); return }

    const questionCourseMap: Record<string, string> = {}
    for (const q of questionsRes.data ?? []) {
      questionCourseMap[q.id] = q.course_id
    }

    const fresh: AppData = {
      userId: user.id,
      profile: { ...(profRes.data as Profile), equipped_accessories: (profRes.data as any).equipped_accessories ?? {} },
      courses: coursesRes.data ?? [],
      attempts: attemptsRes.data ?? [],
      questions: questionsRes.data ?? [],
      questionCourseMap,
      todayMinutes: todayRes.data?.minutes_studied ?? 0,
      flashXpBonus: readFlashXP(),
      flashcardsDueCount: (dueCardsRes as any).count ?? 0,
      quizDueCount: (dueQuizRes as any).count ?? 0,
      recentWrongQuestionCount,
      practiceTodoCount,
    }
    writeCache(fresh)
    setData(fresh)
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    queueMicrotask(() => { void fetchAll() })
  }, [fetchAll])

  const refresh = useCallback(async () => {
    try { localStorage.removeItem(CACHE_KEY) } catch {}
    await fetchAll()
  }, [fetchAll])

  return (
    <AppContext.Provider value={{ data, loading, refresh }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppContext)
}
