import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { z } from 'zod'
import type { ApplicantStage } from '@/lib/types'

const patchSchema = z.object({
  stage: z.enum(['received', 'assessment_sent', 'assessment_done', 'interview_scheduled', 'interviewed', 'hired', 'on_hold']).optional(),
  notes: z.string().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const body = await req.json()
    const parsed = patchSchema.parse(body)

    const updates: Record<string, string> = {}
    if (parsed.stage) updates.stage = parsed.stage
    if (parsed.notes) updates.notes = parsed.notes

    const { data, error } = await db
      .from('applicants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
