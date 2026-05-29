import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { starts_at, duration_minutes, zoom_link } = await req.json()
    if (!starts_at) return NextResponse.json({ error: 'starts_at required' }, { status: 400 })

    const { data, error } = await db
      .from('interview_slots')
      .insert({ starts_at, duration_minutes: duration_minutes ?? 45, zoom_link: zoom_link ?? null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
