'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readFlashXP } from '@/lib/flash-store'

type Profile = { full_name: string | null; exam_date: string | null; streak: number; daily_goal_minutes: number; pet_type: string | null }
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
    const [profRes, coursesRes, attemptsRes, todayRes, questionsRes] = await Promise.all([
      supabase.from('profiles').select('full_name,exam_date,streak,daily_goal_minutes,pet_type').eq('id', user.id).single(),
      supabase.from('courses').select('id,module_id,title,page_count').eq('user_id', user.id),
      supabase.from('quiz_attempts').select('module_id,is_correct,question_id').eq('user_id', user.id),
      supabase.from('daily_sessions').select('minutes_studied').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('quiz_questions').select('id,course_id,module_id').eq('user_id', user.id),
    ])

    if (!profRes.data?.full_name) { router.replace('/setup'); return }

    const questionCourseMap: Record<string, string> = {}
    for (const q of questionsRes.data ?? []) {
      questionCourseMap[q.id] = q.course_id
    }

    const fresh: AppData = {
      userId: user.id,
      profile: profRes.data,
      courses: coursesRes.data ?? [],
      attempts: attemptsRes.data ?? [],
      questions: questionsRes.data ?? [],
      questionCourseMap,
      todayMinutes: todayRes.data?.minutes_studied ?? 0,
      flashXpBonus: readFlashXP(),
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
