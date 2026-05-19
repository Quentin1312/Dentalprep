import { createClient } from '@/lib/supabase/client'

export async function recordSession(userId: string, minutes: number) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_sessions')
    .select('minutes_studied')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  await supabase.from('daily_sessions').upsert(
    { user_id: userId, date: today, minutes_studied: (existing?.minutes_studied ?? 0) + minutes },
    { onConflict: 'user_id,date' }
  )

  const { data: sessions } = await supabase
    .from('daily_sessions')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const msPerDay = 86400000
  const todayMs = new Date(today).getTime()
  let streak = 0
  for (const s of sessions ?? []) {
    if (new Date(s.date as string).getTime() === todayMs - streak * msPerDay) streak++
    else break
  }

  await supabase.from('profiles').update({ streak }).eq('id', userId)
}
