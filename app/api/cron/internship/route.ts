import { NextResponse } from 'next/server'
import { runInternshipBatch } from '@/lib/internship'

export const maxDuration = 60

// Daily (vercel.json). Emails applicants who finished their video at least
// INTERNSHIP_DELAY_DAYS ago (and on/after INTERNSHIP_AUTO_SINCE).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runInternshipBatch({ mode: 'auto', limit: 40 })
    return NextResponse.json({ sent: result.sent, selected: result.selected, failed: result.failed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
