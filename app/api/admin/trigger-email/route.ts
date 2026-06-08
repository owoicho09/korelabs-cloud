import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import {
  sendAssessmentEmail,
  sendNudge1Email,
  sendNudge2Email,
  sendVideoReminderEmail,
} from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addDays } from 'date-fns'
import { z } from 'zod'

const bodySchema = z.object({
  applicant_id: z.string().uuid(),
  type: z.enum(['send_assessment', 'nudge_1', 'nudge_2', 'video_reminder']),
})

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid body' }, { status: 400 })
  }

  const { applicant_id, type } = parsed

  const { data: applicant } = await db
    .from('applicants')
    .select('*, jobs(id, slug, title)')
    .eq('id', applicant_id)
    .single()

  if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

  const jobTitle = (applicant.jobs as { title: string } | null)?.title ?? 'the role'

  try {
    if (type === 'send_assessment') {
      const { data: existing } = await db
        .from('assessments')
        .select('id, quiz_token')
        .eq('applicant_id', applicant_id)
        .is('completed_at', null)
        .maybeSingle()

      let token: string
      let expiresAt: Date

      if (existing) {
        token = existing.quiz_token
        expiresAt = addDays(new Date(), 7)
        await db.from('assessments').update({ expires_at: expiresAt.toISOString() }).eq('id', existing.id)
      } else {
        expiresAt = addDays(new Date(), 7)
        const { data: assessment, error } = await db
          .from('assessments')
          .insert({ applicant_id, expires_at: expiresAt.toISOString() })
          .select()
          .single()
        if (error || !assessment) throw new Error('Failed to create assessment')
        token = assessment.quiz_token
      }

      await db.from('applicants').update({ stage: 'assessment_sent', stage_updated_at: new Date().toISOString() }).eq('id', applicant_id)
      await sendAssessmentEmail(applicant as unknown as Applicant, jobTitle, token, expiresAt)
      return NextResponse.json({ ok: true, detail: `Assessment email sent immediately. Quiz token: ${token}` })
    }

    if (type === 'nudge_1' || type === 'nudge_2') {
      const { data: assessment } = await db
        .from('assessments')
        .select('quiz_token')
        .eq('applicant_id', applicant_id)
        .is('completed_at', null)
        .maybeSingle()

      if (!assessment) {
        return NextResponse.json({ error: 'No pending assessment found' }, { status: 422 })
      }

      const nowIso = new Date().toISOString()
      if (type === 'nudge_1') {
        await sendNudge1Email(applicant as unknown as Applicant, jobTitle, assessment.quiz_token, nowIso)
      } else {
        await sendNudge2Email(applicant as unknown as Applicant, jobTitle, assessment.quiz_token, nowIso)
      }
      return NextResponse.json({ ok: true, detail: `${type} sent immediately` })
    }

    if (type === 'video_reminder') {
      const { data: assessment } = await db
        .from('assessments')
        .select('quiz_token')
        .eq('applicant_id', applicant_id)
        .not('completed_at', 'is', null)
        .maybeSingle()

      if (!assessment) {
        return NextResponse.json({ error: 'No completed assessment found' }, { status: 422 })
      }

      const nowIso = new Date().toISOString()
      await sendVideoReminderEmail(applicant as unknown as Applicant, jobTitle, assessment.quiz_token, nowIso)
      return NextResponse.json({ ok: true, detail: 'Video reminder sent immediately' })
    }
  } catch (e) {
    console.error('[trigger-email]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Send failed' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
