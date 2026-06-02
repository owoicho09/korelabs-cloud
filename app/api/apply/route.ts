import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendAcknowledgmentEmail, sendAssessmentEmail, sendNewApplicantNotification } from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addHours } from 'date-fns'
import { STATIC_JOBS } from '@/lib/jobs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const db = getAdminClient()

    const jobSlug = formData.get('job_slug') as string
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const email = formData.get('email') as string
    const whyKorelabs = formData.get('why_korelabs') as string

    const missing = []
    if (!jobSlug) missing.push('job_slug')
    if (!firstName) missing.push('first_name')
    if (!lastName) missing.push('last_name')
    if (!email || !email.includes('@')) missing.push('email')
    if (!whyKorelabs) missing.push('why_korelabs')
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing or invalid fields: ${missing.join(', ')}` }, { status: 400 })
    }

    const job = db
      ? await db.from('jobs').select('id, title').eq('slug', jobSlug).single().then((r) => r.data)
      : STATIC_JOBS.find((j) => j.slug === jobSlug)

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Upload CV
    let cvPath: string | null = null
    const cvFile = formData.get('cv') as File | null
    if (cvFile && db) {
      const buf = await cvFile.arrayBuffer()
      const ext = cvFile.name.split('.').pop() ?? 'pdf'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await db.storage
        .from('cvs')
        .upload(path, Buffer.from(buf), {
          contentType: cvFile.type,
          cacheControl: '3600',
        })
      if (!uploadError) cvPath = path
    }

    const applicantData = {
      job_id: (job as { id: string }).id ?? null,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: (formData.get('phone') as string) || null,
      location: (formData.get('location') as string) || null,
      linkedin_url: (formData.get('linkedin_url') as string) || null,
      github_url: (formData.get('github_url') as string) || null,
      portfolio_url: (formData.get('portfolio_url') as string) || null,
      why_korelabs: whyKorelabs,
      cv_path: cvPath,
    }

    if (!db) {
      return NextResponse.json({ tracking_token: 'demo-token', message: 'DB not configured — demo mode' })
    }

    const { data: applicant, error: insertError } = await db
      .from('applicants')
      .insert(applicantData)
      .select()
      .single()

    if (insertError) throw insertError

    const jobTitle = (job as { title: string }).title

    // Send acknowledgment immediately
    await sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle)
    await sendNewApplicantNotification(applicant as unknown as Applicant, jobTitle)

    // Create the assessment record now so the quiz URL is ready, then schedule
    // the email to arrive 32 hours from now via Resend's native scheduledAt.
    const expiresAt = addHours(new Date(), 48)
    const { data: assessment, error: assessmentError } = await db
      .from('assessments')
      .insert({ applicant_id: applicant.id, expires_at: expiresAt.toISOString() })
      .select('quiz_token')
      .single()

    if (assessmentError || !assessment) {
      console.error('[apply] Failed to create assessment:', assessmentError)
    } else {
      await db.from('applicants').update({ stage: 'assessment_sent' }).eq('id', applicant.id)
      const scheduledAt = addHours(new Date(), 32).toISOString()
      await sendAssessmentEmail(
        applicant as unknown as Applicant,
        jobTitle,
        assessment.quiz_token,
        expiresAt,
        scheduledAt
      )
    }

    return NextResponse.json({ tracking_token: applicant.tracking_token }, { status: 201 })
  } catch (e) {
    console.error('Apply error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Application failed' },
      { status: 500 }
    )
  }
}
