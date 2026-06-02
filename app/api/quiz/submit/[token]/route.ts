import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendInterviewInviteEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addHours } from 'date-fns'

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function POST(req: Request, { params }: RouteContext) {
  const { token } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const body = await req.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers must be an object' }, { status: 400 })
    }

    const { data: assessment } = await db
      .from('assessments')
      .select('*, applicants(id, first_name, last_name, email, why_korelabs, job_id, jobs(slug, title))')
      .eq('quiz_token', token)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    if (assessment.completed_at) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    if (new Date(assessment.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Assessment expired' }, { status: 410 })
    }

    const jobSlug = (assessment.applicants?.jobs as { slug: string } | null)?.slug
    if (!jobSlug) return NextResponse.json({ error: 'Job not found' }, { status: 400 })

    // Fetch questions with correct answers
    const { data: questions } = await db
      .from('quiz_questions')
      .select('id, tier, correct_index, points')
      .eq('job_slug', jobSlug)

    // Calculate scores
    let scoreFundamentals = 0
    let scoreApplied = 0
    let scoreKorelabs = 0

    for (const q of questions ?? []) {
      const given = answers[q.id]
      if (given === q.correct_index) {
        if (q.tier === 'fundamentals') scoreFundamentals += q.points
        else if (q.tier === 'applied') scoreApplied += q.points
        else if (q.tier === 'korelabs') scoreKorelabs += q.points
      }
    }

    const totalScore = scoreFundamentals + scoreApplied + scoreKorelabs

    // Update assessment
    await db.from('assessments').update({
      answers,
      score: totalScore,
      score_fundamentals: scoreFundamentals,
      score_applied: scoreApplied,
      score_korelabs: scoreKorelabs,
      completed_at: new Date().toISOString(),
    }).eq('id', assessment.id)

    // Update applicant stage
    const applicantId = assessment.applicants?.id
    if (applicantId) {
      await db.from('applicants').update({ stage: 'assessment_done' }).eq('id', applicantId)

      // Create the interview record now so the booking URL is ready, then schedule
      // the invite email to arrive 6 hours from now via Resend's native scheduledAt.
      const jobTitle = (assessment.applicants?.jobs as { title: string } | null)?.title ?? 'the role'

      const { data: existing } = await db
        .from('interviews')
        .select('id, booking_token')
        .eq('applicant_id', applicantId)
        .maybeSingle()

      let bookingToken: string

      if (existing) {
        bookingToken = existing.booking_token
      } else {
        const { data: interview, error: interviewError } = await db
          .from('interviews')
          .insert({ applicant_id: applicantId })
          .select('booking_token')
          .single()
        if (interviewError || !interview) {
          console.error('[quiz/submit] Failed to create interview:', interviewError)
          return NextResponse.json({ ok: true })
        }
        bookingToken = interview.booking_token
      }

      const scheduledAt = addHours(new Date(), 6).toISOString()
      await sendInterviewInviteEmail(
        assessment.applicants as unknown as Applicant,
        jobTitle,
        bookingToken,
        scheduledAt
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Quiz submit error:', e)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
