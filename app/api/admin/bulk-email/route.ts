import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendBulkCustomEmail } from '@/lib/email'
import { z } from 'zod'

const bodySchema = z.object({
  applicant_ids: z.array(z.string().uuid()).min(1),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
})

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid body' }, { status: 400 })
  }

  try {
    const { data: applicants } = await db
      .from('applicants')
      .select('id, email, first_name, last_name')
      .in('id', parsed.applicant_ids)

    if (!applicants || applicants.length === 0) {
      return NextResponse.json({ error: 'No applicants found' }, { status: 404 })
    }

    const result = await sendBulkCustomEmail(
      applicants as Array<{ id: string; email: string; first_name: string; last_name: string }>,
      parsed.subject,
      parsed.body
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[bulk-email]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
