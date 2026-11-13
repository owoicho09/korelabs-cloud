import { getAdminClient } from './supabase/admin'
import { sendInternshipEmail } from './email'

// Applicants who reached assessment_video_done on/after this moment are handled
// automatically by the cron (3 days after finishing). Everyone before it is the
// backlog, released manually in batches from the admin endpoint.
export const INTERNSHIP_AUTO_SINCE = '2026-11-13T00:00:00Z'
export const INTERNSHIP_DELAY_DAYS = 3

// Resend's default rate limit is 2 requests/second.
const SEND_GAP_MS = 600

export type InternshipBatchResult = {
  dry_run: boolean
  selected: number
  sent: number
  failed: Array<{ email: string; error: string }>
  recipients: Array<{ name: string; email: string; role: string }>
}

type Mode = 'manual' | 'auto'

export async function getInternshipStatus() {
  const db = getAdminClient()
  if (!db) throw new Error('DB unavailable')
  const [waiting, offered, dueAuto] = await Promise.all([
    db.from('applicants').select('id', { count: 'exact', head: true }).eq('stage', 'assessment_video_done'),
    db.from('applicants').select('id', { count: 'exact', head: true }).eq('stage', 'internship_offered'),
    autoQuery(db).select('id', { count: 'exact', head: true }),
  ])
  return {
    waiting_video_done: waiting.count ?? 0,
    internship_offered: offered.count ?? 0,
    due_for_auto_send: dueAuto.count ?? 0,
  }
}

function autoCutoff() {
  return new Date(Date.now() - INTERNSHIP_DELAY_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

// Base filter for the automatic flow — kept as a function so the count and the
// select use identical conditions.
function autoQuery(db: NonNullable<ReturnType<typeof getAdminClient>>) {
  return {
    select: (cols: string, opts?: { count: 'exact'; head: boolean }) =>
      db
        .from('applicants')
        .select(cols, opts)
        .eq('stage', 'assessment_video_done')
        .gte('stage_updated_at', INTERNSHIP_AUTO_SINCE)
        .lte('stage_updated_at', autoCutoff()),
  }
}

export async function runInternshipBatch(opts: {
  mode: Mode
  limit: number
  dryRun?: boolean
}): Promise<InternshipBatchResult> {
  const db = getAdminClient()
  if (!db) throw new Error('DB unavailable')
  const dryRun = !!opts.dryRun
  const cols = 'id, first_name, last_name, email, stage_updated_at, jobs(title)'

  const base =
    opts.mode === 'auto'
      ? autoQuery(db).select(cols)
      : db.from('applicants').select(cols).eq('stage', 'assessment_video_done')

  const { data, error } = await base
    .order('stage_updated_at', { ascending: true, nullsFirst: true })
    .limit(opts.limit)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    stage_updated_at: string | null
    jobs: { title: string } | null
  }>

  const result: InternshipBatchResult = {
    dry_run: dryRun,
    selected: rows.length,
    sent: 0,
    failed: [],
    recipients: rows.map((r) => ({
      name: `${r.first_name} ${r.last_name}`.trim(),
      email: r.email,
      role: r.jobs?.title ?? 'the role',
    })),
  }
  if (dryRun) return result

  for (const [i, r] of rows.entries()) {
    // Claim the applicant first so overlapping runs (cron + manual) can never
    // email the same person twice. Only succeeds if they are still waiting.
    const now = new Date().toISOString()
    const { data: claimed } = await db
      .from('applicants')
      .update({ stage: 'internship_offered', stage_updated_at: now })
      .eq('id', r.id)
      .eq('stage', 'assessment_video_done')
      .select('id')
    if (!claimed?.length) continue

    // Same person applied for more than one role: one internship email is enough.
    const { count: alreadyEmailed } = await db
      .from('applicants')
      .select('id', { count: 'exact', head: true })
      .ilike('email', r.email)
      .not('internship_email_sent_at', 'is', null)
    if (alreadyEmailed) continue

    const roleTitle = r.jobs?.title ?? 'the role'
    const { resendId, error: sendError } = await sendInternshipEmail(r, roleTitle)

    if (sendError || !resendId) {
      // Put them back so the next batch retries them.
      await db
        .from('applicants')
        .update({ stage: 'assessment_video_done', stage_updated_at: r.stage_updated_at })
        .eq('id', r.id)
        .eq('stage', 'internship_offered')
      result.failed.push({ email: r.email, error: sendError ?? 'No message id returned' })
    } else {
      await db
        .from('applicants')
        .update({ internship_email_sent_at: now, internship_resend_id: resendId })
        .eq('id', r.id)
      result.sent++
    }

    if (i < rows.length - 1) await new Promise((res) => setTimeout(res, SEND_GAP_MS))
  }

  return result
}
