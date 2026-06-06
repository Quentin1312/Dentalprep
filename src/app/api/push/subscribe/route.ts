import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Body = {
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as Body
    if (!body.endpoint || !body.p256dh || !body.auth) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supaAny = supabase as any
    const { error } = await supaAny.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      user_agent: body.user_agent ?? null,
      last_seen_at: new Date().toISOString(),
      failure_count: 0,
      last_error: null,
    }, { onConflict: 'endpoint' })

    if (error) {
      console.error('subscribe error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
