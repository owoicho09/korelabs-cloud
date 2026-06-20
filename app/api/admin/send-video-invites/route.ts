import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendVideoReminderEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    // Find applicants with a completed assessment but zero uploaded videos
    const { data: candidates } = await db
      .from('applicants')
      .select(`
        id, first_name, last_name, email, why_korelabs, phone, location,
        linkedin_url, github_url, portfolio_url, cv_path, stage, notes,
        nudge1_resend_id, nudge2_resend_id, video_reminder_resend_id,
        stage_updated_at, tracking_token, created_at, updated_at, job_id,
        jobs(title),
        assessments!inner(quiz_token, completed_at),
        videos(id)
      `)
      .not('stage', 'in', '("accepted","archived")')

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No eligible applicants found' })
    }

    // Find applicants who already received a video reminder in the last 14 days
    const { data: recentReminders } = await db
      .from('email_log')
      .select('applicant_id')
      .eq('type', 'video_reminder')
      .gte('sent_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .not('applicant_id', 'is', null)

    const recentlySentIds = new Set((recentReminders ?? []).map((r) => r.applicant_id as string))

    // Keep only those with a completed assessment, no videos, and no recent reminder
    const eligible = candidates.filter((a) => {
      const assessments = a.assessments as { quiz_token: string; completed_at: string | null }[] | null
      const completed = assessments?.some((ass) => ass.completed_at)
      const hasVideos = (a.videos as { id: string }[] | null)?.length ?? 0
      return completed && hasVideos === 0 && !recentlySentIds.has(a.id)
    })

    if (eligible.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'Everyone eligible already has videos' })
    }

    let sent = 0
    const errors: string[] = []

    for (const a of eligible) {
      try {
        const assessments = a.assessments as { quiz_token: string; completed_at: string | null }[]
        const quizToken = assessments.find((ass) => ass.completed_at)?.quiz_token
        if (!quizToken) continue

        const jobsData = a.jobs as { title: string } | { title: string }[] | null
        const roleTitle = (Array.isArray(jobsData) ? jobsData[0]?.title : jobsData?.title) ?? 'the role'
        const nowIso = new Date().toISOString()

        await sendVideoReminderEmail(a as unknown as Applicant, roleTitle, quizToken, nowIso)
        sent++
      } catch (e) {
        errors.push(`${a.id}: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    }

    return NextResponse.json({ ok: true, sent, total_eligible: eligible.length, errors })
  } catch (e) {
    console.error('[send-video-invites] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
