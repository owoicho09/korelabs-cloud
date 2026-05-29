import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { processJob } from '@/lib/pipeline'
import type { PipelineJobType } from '@/lib/types'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Always require the secret in production; allow unauthenticated calls only in development.
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { data: jobs, error: fetchError } = await db
    .from('pipeline_jobs')
    .select('*')
    .is('processed_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (fetchError) {
    console.error('Pipeline query error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch pipeline jobs' }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  let errors = 0

  for (const job of jobs) {
    try {
      await processJob(db, job.id, job.applicant_id, job.type as PipelineJobType)
      await db.from('pipeline_jobs').update({ processed_at: new Date().toISOString() }).eq('id', job.id)
      processed++
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      await db.from('pipeline_jobs').update({ error: msg, processed_at: new Date().toISOString() }).eq('id', job.id)
      errors++
    }
  }

  return NextResponse.json({ processed, errors })
}
