import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { addHours } from 'date-fns'

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function POST(req: Request, { params }: RouteContext) {
  const { token } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { answers } = await req.json()

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

      // Schedule interview invite 6-7 hours later
      const scheduledFor = addHours(new Date(), 6)
      await db.from('pipeline_jobs').insert({
        applicant_id: applicantId,
        type: 'send_interview_invite',
        scheduled_for: scheduledFor.toISOString(),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Quiz submit error:', e)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
