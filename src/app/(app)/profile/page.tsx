import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id),
  ])

  const totalAttempts = attempts?.length ?? 0
  const correct = attempts?.filter(a => a.is_correct).length ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0

  return <ProfileClient profile={profile} email={user.email ?? ''} stats={{ totalAttempts, accuracy }} />
}
