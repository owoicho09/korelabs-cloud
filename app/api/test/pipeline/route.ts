import { NextResponse } from 'next/server'

// Decommissioned along with the pipeline_jobs cron system.
// Emails are now scheduled directly via Resend's scheduledAt field.
export async function POST() {
  return NextResponse.json({ error: 'Pipeline test endpoint decommissioned' }, { status: 410 })
}
