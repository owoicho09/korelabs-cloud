import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendOnboardingEmail, sendRejectionEmail, sendNewApplicantNotification } from '@/lib/email'
import { z } from 'zod'
import type { Applicant } from '@/lib/types'

const patchSchema = z.object({
  stage: z.enum([
    'received',
    'assessment_sent',
    'assessment_video_done',
    'under_review',
    'accepted',
    'on_hold',
    'archived',
  ]).optional(),
  notes: z.string().optional(),
  send_rejection_email: z.boolean().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const [{ data: applicant }, { data: assessment }, { data: emails }, { data: videos }] = await Promise.all([
    db.from('applicants')
      .select('id, first_name, last_name, email, phone, location, why_korelabs, stage, notes, linkedin_url, github_url, portfolio_url, created_at, jobs(title, department)')
      .eq('id', id)
      .single(),
    db.from('assessments')
      .select('score, score_fundamentals, score_applied, score_korelabs, completed_at, quiz_token')
      .eq('applicant_id', id)
      .maybeSingle(),
    db.from('email_log')
      .select('subject, type, sent_at')
      .eq('applicant_id', id)
      .order('sent_at', { ascending: false })
      .limit(5),
    db.from('videos')
      .select('id')
      .eq('applicant_id', id),
  ])

  if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...applicant, assessment, recent_emails: emails ?? [], video_count: (videos ?? []).length })
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const body = await req.json()
    const parsed = patchSchema.parse(body)

    const updates: Record<string, string | null> = {}
    if (parsed.stage !== undefined) {
      updates.stage = parsed.stage
      updates.stage_updated_at = new Date().toISOString()
    }
    if (parsed.notes !== undefined) updates.notes = parsed.notes

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await db
      .from('applicants')
      .update(updates)
      .eq('id', id)
      .select('*, jobs(title, slug, department)')
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

    // Rejection email when explicitly requested
    if (parsed.send_rejection_email) {
      const job = data.jobs as { title: string } | null
      const roleTitle = job?.title ?? 'the role'
      try {
        await sendRejectionEmail(data as unknown as Applicant, roleTitle)
      } catch (e) {
        console.error('[admin/applications/patch] rejection email failed:', e)
      }
    }

    // Trigger onboarding email when stage moves to accepted
    if (parsed.stage === 'accepted') {
      const job = data.jobs as { title: string } | null
      const roleTitle = job?.title ?? 'the role'
      try {
        await sendOnboardingEmail(data as unknown as Applicant, roleTitle)
        // Notify admin that this applicant was accepted
        const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
        if (adminEmail) {
          const { Resend } = await import('resend')
          const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
          if (resend) {
            await resend.emails.send({
              from: `KoreLabs Cloud <${process.env.EMAIL_FROM ?? 'careers@korelabs.cloud'}>`,
              to: adminEmail,
              subject: `Accepted — ${data.first_name} ${data.last_name} · ${roleTitle}`,
              html: `<p><strong>${data.first_name} ${data.last_name}</strong> has been marked as <strong>accepted</strong> for the <strong>${roleTitle}</strong> role. Onboarding email sent.</p>`,
            })
          }
        }
      } catch (e) {
        console.error('[admin/applications/patch] onboarding email failed:', e)
      }
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
