import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendAcknowledgmentEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addHours } from 'date-fns'
import { STATIC_JOBS } from '@/lib/jobs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const db = getAdminClient()

    const jobSlug = formData.get('job_slug') as string
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
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      location: (formData.get('location') as string) || null,
      linkedin_url: (formData.get('linkedin_url') as string) || null,
      github_url: (formData.get('github_url') as string) || null,
      portfolio_url: (formData.get('portfolio_url') as string) || null,
      why_korelabs: formData.get('why_korelabs') as string,
      cv_path: cvPath,
    }

    if (!db) {
      // Graceful degradation: return a mock token
      return NextResponse.json({ tracking_token: 'demo-token', message: 'DB not configured — demo mode' })
    }

    const { data: applicant, error: insertError } = await db
      .from('applicants')
      .insert(applicantData)
      .select()
      .single()

    if (insertError) throw insertError

    // Schedule assessment email at T+32 hours
    const scheduledFor = addHours(new Date(), 32)
    await db.from('pipeline_jobs').insert({
      applicant_id: applicant.id,
      type: 'send_assessment',
      scheduled_for: scheduledFor.toISOString(),
    })

    // Send acknowledgment email (fire-and-forget)
    const jobTitle = (job as { title: string }).title
    sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle).catch(console.error)

    return NextResponse.json({ tracking_token: applicant.tracking_token }, { status: 201 })
  } catch (e) {
    console.error('Apply error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Application failed' },
      { status: 500 }
    )
  }
}
