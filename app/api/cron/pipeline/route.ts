import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  sendAssessmentEmail,
  sendInterviewInviteEmail,
  sendReminderEmail,
} from '@/lib/email'
import type { Applicant, Interview } from '@/lib/types'
import { addHours } from 'date-fns'
import type { PipelineJobType } from '@/lib/types'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Claim pending jobs scheduled for now or before
  const { data: jobs } = await db
    .from('pipeline_jobs')
    .select('*')
    .is('processed_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  let errors = 0

  for (const job of jobs) {
    try {
      await processJob(db, job.id, job.applicant_id, job.type as PipelineJobType)
      await db.from('pipeline_jobs').update({ processed_at: new Date().toISOString() }).eq('id', job.id)
      processed++
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      await db.from('pipeline_jobs').update({ error: msg, processed_at: new Date().toISOString() }).eq('id', job.id)
      errors++
    }
  }

  return NextResponse.json({ processed, errors })
}

async function processJob(
  db: NonNullable<ReturnType<typeof getAdminClient>>,
  jobId: string,
  applicantId: string,
  type: PipelineJobType
): Promise<void> {
  const { data: applicant } = await db
    .from('applicants')
    .select('*, jobs(id, slug, title)')
    .eq('id', applicantId)
    .single()

  if (!applicant) throw new Error('Applicant not found')

  const jobTitle = (applicant.jobs as { title: string } | null)?.title ?? 'the role'
  const jobSlug = (applicant.jobs as { slug: string } | null)?.slug ?? ''

  if (type === 'send_assessment') {
    const expiresAt = addHours(new Date(), 48)
    const { data: assessment } = await db
      .from('assessments')
      .insert({
        applicant_id: applicantId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (!assessment) throw new Error('Failed to create assessment')

    await db.from('applicants').update({ stage: 'assessment_sent' }).eq('id', applicantId)
    await sendAssessmentEmail(applicant as unknown as Applicant, jobTitle, assessment.quiz_token, expiresAt)
  }

  else if (type === 'send_interview_invite') {
    const { data: interview } = await db
      .from('interviews')
      .insert({ applicant_id: applicantId })
      .select()
      .single()

    if (!interview) throw new Error('Failed to create interview')

    await sendInterviewInviteEmail(applicant as unknown as Applicant, jobTitle, interview.booking_token)
  }

  else if (type === 'send_reminder_24h' || type === 'send_reminder_1h') {
    const { data: interview } = await db
      .from('interviews')
      .select('*, interview_slots(*)')
      .eq('applicant_id', applicantId)
      .eq('status', 'booked')
      .single()

    if (!interview) return // Interview was cancelled or not booked — skip

    await sendReminderEmail(
      applicant as unknown as Applicant,
      interview as unknown as Interview,
      jobTitle,
      type === 'send_reminder_24h' ? '24h' : '1h'
    )
  }
}
