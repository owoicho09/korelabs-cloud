import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { cancelScheduledEmail, sendUnderReviewEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'

// This route confirms a video upload that the client sent directly to Supabase Storage.
// It receives only lightweight JSON (no file), records the metadata, and updates the stage.
export async function POST(req: Request) {
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { quiz_token, question_index, duration_seconds } = await req.json()

    if (!quiz_token || question_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (question_index !== 0) {
      return NextResponse.json({ error: 'question_index must be 0' }, { status: 400 })
    }

    const { data: assessment } = await db
      .from('assessments')
      .select('applicant_id, completed_at, applicants(id, first_name, last_name, email, why_korelabs, phone, location, linkedin_url, github_url, portfolio_url, cv_path, stage, notes, nudge1_resend_id, nudge2_resend_id, video_reminder_resend_id, stage_updated_at, tracking_token, created_at, updated_at, job_id, jobs(title, department))')
      .eq('quiz_token', quiz_token)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (!assessment.completed_at) return NextResponse.json({ error: 'Assessment not completed' }, { status: 422 })

    const applicantId = assessment.applicant_id
    const applicantData = assessment.applicants as unknown as (Applicant & { jobs?: { title: string; department: string } | null })

    // Derive storage path server-side — never trust the client-sent value
    const storagePath = `${applicantId}/${question_index}.webm`

    const { error: dbError } = await db
      .from('videos')
      .upsert({
        applicant_id: applicantId,
        question_index,
        storage_path: storagePath,
        duration_seconds: typeof duration_seconds === 'number' && !isNaN(duration_seconds) ? duration_seconds : null,
      }, { onConflict: 'applicant_id,question_index' })

    if (dbError) {
      console.error('[video/upload] DB error:', dbError)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    const videoReminderId = applicantData?.video_reminder_resend_id
    if (videoReminderId) await cancelScheduledEmail(videoReminderId)

    await db.from('applicants').update({
      stage: 'assessment_video_done',
      stage_updated_at: new Date().toISOString(),
      video_reminder_resend_id: null,
    }).eq('id', applicantId)

    const roleTitle = (applicantData?.jobs as { title: string } | null)?.title ?? 'the role'
    try {
      await sendUnderReviewEmail(applicantData, roleTitle)
    } catch (e) {
      console.error('[video/upload] sendUnderReviewEmail failed:', e)
    }

    return NextResponse.json({ ok: true, complete: true })
  } catch (e) {
    console.error('[video/upload] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
