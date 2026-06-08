import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { cancelScheduledEmail, sendUnderReviewEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'

export async function POST(req: Request) {
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const formData = await req.formData()
    const quizToken = formData.get('quiz_token') as string
    const questionIndexStr = formData.get('question_index') as string
    const videoFile = formData.get('video') as File | null
    const durationStr = formData.get('duration_seconds') as string | null

    if (!quizToken || questionIndexStr === null || !videoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const questionIndex = parseInt(questionIndexStr, 10)
    if (isNaN(questionIndex) || questionIndex < 0 || questionIndex > 2) {
      return NextResponse.json({ error: 'question_index must be 0, 1, or 2' }, { status: 400 })
    }

    // Look up applicant via quiz token
    const { data: assessment } = await db
      .from('assessments')
      .select('applicant_id, applicants(id, first_name, last_name, email, why_korelabs, phone, location, linkedin_url, github_url, portfolio_url, cv_path, stage, notes, nudge1_resend_id, nudge2_resend_id, video_reminder_resend_id, stage_updated_at, tracking_token, created_at, updated_at, job_id, jobs(title, department))')
      .eq('quiz_token', quizToken)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

    const applicantId = assessment.applicant_id
    const applicantData = assessment.applicants as unknown as (Applicant & { jobs?: { title: string; department: string } | null })

    // Upload video to Supabase Storage
    const buf = await videoFile.arrayBuffer()
    const ext = videoFile.type.includes('mp4') ? 'mp4' : 'webm'
    const storagePath = `${applicantId}/${questionIndex}.${ext}`

    const { error: uploadError } = await db.storage
      .from('videos')
      .upload(storagePath, Buffer.from(buf), {
        contentType: videoFile.type,
        upsert: true, // overwrite if retaking
      })

    if (uploadError) {
      console.error('[video/upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const durationSeconds = durationStr ? parseInt(durationStr, 10) : null

    // Upsert video record (upsert in case of retake)
    const { error: dbError } = await db
      .from('videos')
      .upsert({
        applicant_id: applicantId,
        question_index: questionIndex,
        storage_path: storagePath,
        duration_seconds: isNaN(durationSeconds ?? NaN) ? null : durationSeconds,
      }, { onConflict: 'applicant_id,question_index' })

    if (dbError) {
      console.error('[video/upload] DB error:', dbError)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    // Check total videos submitted
    const { count } = await db
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', applicantId)

    const totalVideos = count ?? 0
    const isComplete = totalVideos >= 3

    if (isComplete) {
      // Cancel video reminder if still pending
      const videoReminderId = applicantData?.video_reminder_resend_id
      if (videoReminderId) {
        await cancelScheduledEmail(videoReminderId)
      }

      // Move to assessment_video_done
      await db.from('applicants').update({
        stage: 'assessment_video_done',
        stage_updated_at: new Date().toISOString(),
        video_reminder_resend_id: null,
      }).eq('id', applicantId)

      // Send under_review email to applicant
      const job = applicantData?.jobs
      const roleTitle = job?.title ?? 'the role'
      try {
        await sendUnderReviewEmail(applicantData, roleTitle)
      } catch (e) {
        console.error('[video/upload] sendUnderReviewEmail failed:', e)
      }
    }

    return NextResponse.json({ ok: true, complete: isComplete, videos_submitted: totalVideos })
  } catch (e) {
    console.error('[video/upload] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 })
  }
}
