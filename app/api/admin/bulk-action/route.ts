import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import {
  sendAssessmentEmail,
  sendVideoReminderEmail,
  sendOnboardingEmail,
  sendRejectionEmail,
} from '@/lib/email'
import type { Applicant } from '@/lib/types'
import { addDays } from 'date-fns'
import { z } from 'zod'

const bodySchema = z.object({
  applicant_ids: z.array(z.string().uuid()).min(1),
  action: z.enum([
    'mark_accepted',
    'reject_archive',
    'resend_assessment',
    'send_video_invite',
    'move_stage',
  ]),
  stage: z.string().optional(),
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

  const { applicant_ids, action } = parsed
  const results = { processed: 0, errors: [] as string[] }
  const now = new Date().toISOString()

  // ── Mark accepted ──────────────────────────────────────────────────────────

  if (action === 'mark_accepted') {
    const { data: applicants } = await db
      .from('applicants')
      .select('*, jobs(title)')
      .in('id', applicant_ids)

    if (!applicants?.length) {
      return NextResponse.json({ error: 'No applicants found' }, { status: 404 })
    }

    await db.from('applicants')
      .update({ stage: 'accepted', stage_updated_at: now })
      .in('id', applicant_ids)

    for (const a of applicants) {
      try {
        const job = a.jobs as { title: string } | null
        await sendOnboardingEmail(a as unknown as Applicant, job?.title ?? 'the role')
        results.processed++
      } catch (e) {
        results.errors.push(`${a.first_name} ${a.last_name}: ${e instanceof Error ? e.message : 'email failed'}`)
      }
    }

    return NextResponse.json({ ok: true, ...results })
  }

  // ── Reject & archive ───────────────────────────────────────────────────────

  if (action === 'reject_archive') {
    const { data: applicants } = await db
      .from('applicants')
      .select('*, jobs(title)')
      .in('id', applicant_ids)

    if (!applicants?.length) {
      return NextResponse.json({ error: 'No applicants found' }, { status: 404 })
    }

    await db.from('applicants')
      .update({ stage: 'archived', stage_updated_at: now })
      .in('id', applicant_ids)

    for (const a of applicants) {
      try {
        const job = a.jobs as { title: string } | null
        await sendRejectionEmail(a as unknown as Applicant, job?.title ?? 'the role')
        results.processed++
      } catch (e) {
        results.errors.push(`${a.first_name} ${a.last_name}: ${e instanceof Error ? e.message : 'email failed'}`)
      }
    }

    return NextResponse.json({ ok: true, ...results })
  }

  // ── Re-send assessment ─────────────────────────────────────────────────────

  if (action === 'resend_assessment') {
    const { data: applicants } = await db
      .from('applicants')
      .select('*, jobs(title, slug)')
      .in('id', applicant_ids)

    if (!applicants?.length) {
      return NextResponse.json({ error: 'No applicants found' }, { status: 404 })
    }

    for (const a of applicants) {
      try {
        const job = a.jobs as { title: string } | null
        const roleTitle = job?.title ?? 'the role'

        const { data: existing } = await db
          .from('assessments')
          .select('id, quiz_token')
          .eq('applicant_id', a.id)
          .is('completed_at', null)
          .maybeSingle()

        let token: string
        let expiresAt: Date

        if (existing) {
          token = existing.quiz_token
          expiresAt = addDays(new Date(), 7)
          await db.from('assessments').update({ expires_at: expiresAt.toISOString() }).eq('id', existing.id)
        } else {
          expiresAt = addDays(new Date(), 7)
          const { data: assessment, error } = await db
            .from('assessments')
            .insert({ applicant_id: a.id, expires_at: expiresAt.toISOString() })
            .select()
            .single()
          if (error || !assessment) throw new Error('Failed to create assessment')
          token = assessment.quiz_token
        }

        await db.from('applicants')
          .update({ stage: 'assessment_sent', stage_updated_at: now })
          .eq('id', a.id)

        await sendAssessmentEmail(a as unknown as Applicant, roleTitle, token, expiresAt)
        results.processed++
      } catch (e) {
        results.errors.push(`${a.first_name} ${a.last_name}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }

    return NextResponse.json({ ok: true, ...results })
  }

  // ── Send video invite ──────────────────────────────────────────────────────

  if (action === 'send_video_invite') {
    const { data: applicants } = await db
      .from('applicants')
      .select('*, jobs(title), assessments(quiz_token, completed_at)')
      .in('id', applicant_ids)

    if (!applicants?.length) {
      return NextResponse.json({ error: 'No applicants found' }, { status: 404 })
    }

    for (const a of applicants) {
      try {
        const assessments = a.assessments as { quiz_token: string; completed_at: string | null }[] | null
        const completed = assessments?.find((x) => x.completed_at)

        if (!completed) {
          results.errors.push(`${a.first_name} ${a.last_name}: no completed assessment`)
          continue
        }

        const job = a.jobs as { title: string } | null
        await sendVideoReminderEmail(a as unknown as Applicant, job?.title ?? 'the role', completed.quiz_token, now)
        results.processed++
      } catch (e) {
        results.errors.push(`${a.first_name} ${a.last_name}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }

    return NextResponse.json({ ok: true, ...results })
  }

  // ── Move stage ─────────────────────────────────────────────────────────────

  if (action === 'move_stage') {
    if (!parsed.stage) {
      return NextResponse.json({ error: 'stage is required for move_stage' }, { status: 400 })
    }

    const { error } = await db.from('applicants')
      .update({ stage: parsed.stage, stage_updated_at: now })
      .in('id', applicant_ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, processed: applicant_ids.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
