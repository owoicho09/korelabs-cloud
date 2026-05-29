import { getAdminClient } from './supabase/admin'
import {
  sendAssessmentEmail,
  sendInterviewInviteEmail,
  sendReminderEmail,
} from './email'
import type { Applicant, Interview, PipelineJobType } from './types'
import { addHours } from 'date-fns'

type DB = NonNullable<ReturnType<typeof getAdminClient>>

export async function processJob(
  db: DB,
  jobId: string,
  applicantId: string,
  type: PipelineJobType
): Promise<{ type: PipelineJobType; detail: string }> {
  const { data: applicant } = await db
    .from('applicants')
    .select('*, jobs(id, slug, title)')
    .eq('id', applicantId)
    .single()

  if (!applicant) throw new Error('Applicant not found')

  const jobTitle = (applicant.jobs as { title: string } | null)?.title ?? 'the role'

  if (type === 'send_assessment') {
    // Avoid creating a duplicate assessment if one already exists
    const { data: existing } = await db
      .from('assessments')
      .select('id, quiz_token')
      .eq('applicant_id', applicantId)
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
        .insert({ applicant_id: applicantId, expires_at: expiresAt.toISOString() })
        .select()
        .single()
      if (error || !assessment) throw new Error('Failed to create assessment')
      token = assessment.quiz_token
    }

    await db.from('applicants').update({ stage: 'assessment_sent' }).eq('id', applicantId)
    await sendAssessmentEmail(applicant as unknown as Applicant, jobTitle, token, expiresAt)
    return { type, detail: `Assessment email sent. Quiz token: ${token}` }
  }

  if (type === 'send_interview_invite') {
    // Avoid creating a duplicate interview record
    const { data: existing } = await db
      .from('interviews')
      .select('id, booking_token')
      .eq('applicant_id', applicantId)
      .maybeSingle()

    let bookingToken: string

    if (existing) {
      bookingToken = existing.booking_token
    } else {
      const { data: interview, error } = await db
        .from('interviews')
        .insert({ applicant_id: applicantId })
        .select()
        .single()
      if (error || !interview) throw new Error('Failed to create interview')
      bookingToken = interview.booking_token
    }

    await sendInterviewInviteEmail(applicant as unknown as Applicant, jobTitle, bookingToken)
    return { type, detail: `Interview invite sent. Booking token: ${bookingToken}` }
  }

  if (type === 'send_reminder_24h' || type === 'send_reminder_1h') {
    const { data: interview } = await db
      .from('interviews')
      .select('*, interview_slots(*)')
      .eq('applicant_id', applicantId)
      .eq('status', 'booked')
      .single()

    if (!interview) {
      return { type, detail: 'Skipped — no booked interview found for this applicant' }
    }

    await sendReminderEmail(
      applicant as unknown as Applicant,
      interview as unknown as Interview,
      jobTitle,
      type === 'send_reminder_24h' ? '24h' : '1h'
    )
    return { type, detail: `Reminder email sent (${type === 'send_reminder_24h' ? '24h' : '1h'})` }
  }

  throw new Error(`Unknown pipeline job type: ${type}`)
}
