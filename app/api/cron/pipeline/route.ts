import { NextResponse } from 'next/server'

// This cron endpoint is decommissioned. All follow-up emails are now scheduled
// directly via Resend's scheduledAt field at the moment each action occurs.
// The pipeline_jobs table is no longer used for email delivery.
export async function GET() {
  return NextResponse.json({ message: 'Pipeline cron decommissioned — emails scheduled via Resend scheduledAt' })
}
