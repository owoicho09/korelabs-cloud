import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendAssessmentEmail, sendNudge1Email, sendNudge2Email, cancelScheduledEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addHours, addDays } from 'date-fns'

export async function POST(req: Request) {
  void req
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    // Find all applicants stuck at assessment_sent with no completed assessment
    const { data: stuck } = await db
      .from('applicants')
      .select(`
        id, first_name, last_name, email, why_korelabs, phone, location,
        linkedin_url, github_url, portfolio_url, cv_path, stage, notes,
        nudge1_resend_id, nudge2_resend_id, video_reminder_resend_id,
        stage_updated_at, tracking_token, created_at, updated_at, job_id,
        jobs(title, slug),
        assessments(quiz_token, completed_at, expires_at)
      `)
      .eq('stage', 'assessment_sent')

    if (!stuck || stuck.length === 0) {
      return NextResponse.json({ ok: true, reengaged: 0, message: 'No stuck applicants found' })
    }

    // Filter to those with no completed assessment
    const noAssessment = stuck.filter((a) => {
      const assessment = (a.assessments as { completed_at: string | null }[] | null)?.[0]
      return !assessment?.completed_at
    })

    let reengaged = 0

    for (const a of noAssessment) {
      try {
        const job = a.jobs as unknown as { title: string; slug: string } | null
        if (!job) continue

        const roleTitle = job.title

        // Get or create a fresh assessment token
        let quizToken: string
        const existingAssessment = (a.assessments as { quiz_token: string; expires_at: string }[] | null)?.[0]

        if (existingAssessment) {
          // Extend expiry and reuse token
          const newExpiry = addDays(new Date(), 7)
          await db.from('assessments')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('quiz_token', existingAssessment.quiz_token)
          quizToken = existingAssessment.quiz_token
        } else {
          const newExpiry = addDays(new Date(), 7)
          const { data: newAssessment } = await db
            .from('assessments')
            .insert({ applicant_id: a.id, expires_at: newExpiry.toISOString() })
            .select('quiz_token')
            .single()
          if (!newAssessment) continue
          quizToken = newAssessment.quiz_token
        }

        const expiresAt = addDays(new Date(), 7)

        // Send assessment email immediately (no schedule delay for re-engagement)
        await sendAssessmentEmail(a as unknown as Applicant, roleTitle, quizToken, expiresAt)

        // Schedule fresh nudge emails
        const nudge1At = addHours(new Date(), 48).toISOString()
        const nudge2At = addDays(new Date(), 5).toISOString()

        // Cancel stale scheduled nudges before issuing fresh ones to avoid duplicates
        const prev = a as { nudge1_resend_id?: string | null; nudge2_resend_id?: string | null }
        if (prev.nudge1_resend_id) await cancelScheduledEmail(prev.nudge1_resend_id)
        if (prev.nudge2_resend_id) await cancelScheduledEmail(prev.nudge2_resend_id)

        const nudge1Id = await sendNudge1Email(a as unknown as Applicant, roleTitle, quizToken, nudge1At)
        const nudge2Id = await sendNudge2Email(a as unknown as Applicant, roleTitle, quizToken, nudge2At)

        await db.from('applicants').update({
          nudge1_resend_id: nudge1Id ?? null,
          nudge2_resend_id: nudge2Id ?? null,
        }).eq('id', a.id)

        reengaged++
      } catch (e) {
        console.error(`[reengage-all] Failed for applicant ${a.id}:`, e)
      }
    }

    return NextResponse.json({ ok: true, reengaged, total_stuck: noAssessment.length })
  } catch (e) {
    console.error('[reengage-all] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
