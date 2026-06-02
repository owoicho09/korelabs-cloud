import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import {
  sendAssessmentEmail,
  sendInterviewInviteEmail,
  sendReminderEmail,
} from '@/lib/email'
import type { Applicant, Interview, PipelineJobType } from '@/lib/types'
import { addHours } from 'date-fns'
import { z } from 'zod'

const bodySchema = z.object({
  applicant_id: z.string().uuid(),
  type: z.enum(['send_assessment', 'send_interview_invite', 'send_reminder_24h', 'send_reminder_1h']),
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
        expiresAt = addHours(new Date(), 48)
        await db.from('assessments').update({ expires_at: expiresAt.toISOString() }).eq('id', existing.id)
      } else {
        expiresAt = addHours(new Date(), 48)
        const { data: assessment, error } = await db
          .from('assessments')
          .insert({ applicant_id, expires_at: expiresAt.toISOString() })
          .select()
          .single()
        if (error || !assessment) throw new Error('Failed to create assessment')
        token = assessment.quiz_token
      }

      await db.from('applicants').update({ stage: 'assessment_sent' }).eq('id', applicant_id)
      // No scheduledAt — send immediately for testing
      await sendAssessmentEmail(applicant as unknown as Applicant, jobTitle, token, expiresAt)
      return NextResponse.json({ ok: true, detail: `Assessment email sent immediately. Quiz token: ${token}` })
    }

    if (type === 'send_interview_invite') {
      const { data: existing } = await db
        .from('interviews')
        .select('id, booking_token')
        .eq('applicant_id', applicant_id)
        .maybeSingle()

      let bookingToken: string

      if (existing) {
        bookingToken = existing.booking_token
      } else {
        const { data: interview, error } = await db
          .from('interviews')
          .insert({ applicant_id })
          .select()
          .single()
        if (error || !interview) throw new Error('Failed to create interview record')
        bookingToken = interview.booking_token
      }

      await sendInterviewInviteEmail(applicant as unknown as Applicant, jobTitle, bookingToken)
      return NextResponse.json({ ok: true, detail: `Interview invite sent immediately. Booking token: ${bookingToken}` })
    }

    if (type === 'send_reminder_24h' || type === 'send_reminder_1h') {
      const { data: interview } = await db
        .from('interviews')
        .select('*, interview_slots(*)')
        .eq('applicant_id', applicant_id)
        .eq('status', 'booked')
        .single()

      if (!interview) {
        return NextResponse.json({ error: 'No booked interview found for this applicant' }, { status: 422 })
      }

      const label = type === 'send_reminder_24h' ? '24h' : '1h'
      await sendReminderEmail(
        applicant as unknown as Applicant,
        interview as unknown as Interview,
        jobTitle,
        label
      )
      return NextResponse.json({ ok: true, detail: `${label} reminder sent immediately` })
    }
  } catch (e) {
    console.error('[trigger-email]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Send failed' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
