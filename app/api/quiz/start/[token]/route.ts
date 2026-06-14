import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function PATCH(_req: Request, { params }: RouteContext) {
  const { token } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { data: assessment } = await db
    .from('assessments')
    .select('id, started_at, completed_at')
    .eq('quiz_token', token)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (assessment.completed_at) return NextResponse.json({ ok: true }) // already done
  if (assessment.started_at) return NextResponse.json({ ok: true }) // already started

  await db
    .from('assessments')
    .update({ started_at: new Date().toISOString() })
    .eq('id', assessment.id)

  return NextResponse.json({ ok: true })
}
