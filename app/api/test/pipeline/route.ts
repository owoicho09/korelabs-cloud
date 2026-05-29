import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { processJob } from '@/lib/pipeline'
import type { PipelineJobType } from '@/lib/types'

// Only available outside production
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required in request body' }, { status: 400 })

  // Find applicant by email
  const { data: applicant } = await db
    .from('applicants')
    .select('id, first_name, last_name, stage')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!applicant) {
    return NextResponse.json({ error: `No applicant found with email: ${email}` }, { status: 404 })
  }

  // Fetch ALL unprocessed pipeline jobs for this applicant, ignoring scheduled_for
  const { data: jobs } = await db
    .from('pipeline_jobs')
    .select('*')
    .eq('applicant_id', applicant.id)
    .is('processed_at', null)
    .order('scheduled_for', { ascending: true })

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({
      applicant: { id: applicant.id, name: `${applicant.first_name} ${applicant.last_name}`, stage: applicant.stage },
      message: 'No pending pipeline jobs found for this applicant',
      processed: [],
    })
  }

  const results: Array<{ job_id: string; type: string; status: 'ok' | 'error'; detail: string }> = []

  for (const job of jobs) {
    try {
      const result = await processJob(db, job.id, applicant.id, job.type as PipelineJobType)
      await db.from('pipeline_jobs').update({ processed_at: new Date().toISOString() }).eq('id', job.id)
      results.push({ job_id: job.id, type: job.type, status: 'ok', detail: result.detail })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      await db.from('pipeline_jobs').update({ error: msg, processed_at: new Date().toISOString() }).eq('id', job.id)
      results.push({ job_id: job.id, type: job.type, status: 'error', detail: msg })
    }
  }

  // Fetch updated applicant stage after processing
  const { data: updated } = await db
    .from('applicants')
    .select('stage')
    .eq('id', applicant.id)
    .single()

  return NextResponse.json({
    applicant: {
      id: applicant.id,
      name: `${applicant.first_name} ${applicant.last_name}`,
      stage_before: applicant.stage,
      stage_after: updated?.stage ?? applicant.stage,
    },
    processed: results,
  })
}
