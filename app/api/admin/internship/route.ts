import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/auth'
import { getInternshipStatus, runInternshipBatch } from '@/lib/internship'

export const maxDuration = 300

// GET  → counts (waiting / offered / due for auto send)
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await getInternshipStatus())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const bodySchema = z.object({
  limit: z.number().int().min(1).max(100),
  dry_run: z.boolean().optional(),
})

// POST { limit: 50, dry_run?: true } → emails the oldest `limit` applicants
// waiting at assessment_video_done and moves them to internship_offered.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid body' }, { status: 400 })
  }
  try {
    const result = await runInternshipBatch({ mode: 'manual', limit: parsed.limit, dryRun: parsed.dry_run })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
