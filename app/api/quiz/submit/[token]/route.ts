import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { cancelScheduledEmail } from '@/lib/email'

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
      .select('*, applicants(id, first_name, last_name, email, why_korelabs, job_id, nudge1_resend_id, nudge2_resend_id, jobs(slug, title))')
      .eq('quiz_token', token)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    if (assessment.completed_at) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    if (new Date(assessment.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Assessment expired' }, { status: 410 })
    }

    const jobSlug = (assessment.applicants?.jobs as { slug: string } | null)?.slug
    if (!jobSlug) return NextResponse.json({ error: 'Job not found' }, { status: 400 })

    const { data: questions } = await db
      .from('quiz_questions')
      .select('id, tier, correct_index, points')
      .eq('job_slug', jobSlug)

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

    await db.from('assessments').update({
      answers,
      score: totalScore,
      score_fundamentals: scoreFundamentals,
      score_applied: scoreApplied,
      score_korelabs: scoreKorelabs,
      completed_at: new Date().toISOString(),
    }).eq('id', assessment.id)

    const applicantData = assessment.applicants
    const applicantId = applicantData?.id

    if (applicantId) {
      // Cancel nudge emails — applicant completed the quiz so nudges are no longer needed
      const nudge1Id = (applicantData as { nudge1_resend_id?: string | null }).nudge1_resend_id
      const nudge2Id = (applicantData as { nudge2_resend_id?: string | null }).nudge2_resend_id

      if (nudge1Id) await cancelScheduledEmail(nudge1Id)
      if (nudge2Id) await cancelScheduledEmail(nudge2Id)

      await db.from('applicants').update({
        nudge1_resend_id: null,
        nudge2_resend_id: null,
      }).eq('id', applicantId)
    }

    return NextResponse.json({ ok: true, quiz_token: token })
  } catch (e) {
    console.error('Quiz submit error:', e)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
