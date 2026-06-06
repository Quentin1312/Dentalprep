import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushTo } from '@/lib/push-server'

export const maxDuration = 30

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await sendPushTo(user.id, {
      title: 'Notification de test',
      body: 'Les rappels fonctionnent — on te préviendra en soirée si tu as zappé ta session.',
      url: '/dashboard',
      tag: 'dentalprep-test',
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('push test error', e)
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
