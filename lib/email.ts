import { Resend } from 'resend'
import { personaliseEmail } from './openai'
import { generateTrackingUrl, generateQuizUrl, generateVideoUrl, formatDateTime } from './utils'
import type { Applicant, Interview, Assessment } from './types'
import { getAdminClient } from './supabase/admin'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

const FROM = `KoreLabs Cloud <${process.env.EMAIL_FROM ?? 'careers@korelabs.cloud'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function logEmail(
  applicantId: string | null,
  toEmail: string,
  subject: string,
  type: string,
  resendId?: string,
  error?: string
) {
  const db = getAdminClient()
  if (!db) return
  await db.from('email_log').insert({
    applicant_id: applicantId,
    to_email: toEmail,
    subject,
    type,
    resend_id: resendId ?? null,
    error: error ?? null,
  })
}

function buildEmailHtml(heading: string, body: string, ctaText?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px; color: #1a2a1e; }
  .card { background: #ffffff; border-radius: 12px; max-width: 560px; margin: 0 auto; padding: 40px; border: 1px solid #e2ebe6; }
  .logo { font-size: 14px; font-weight: 600; color: #4a9270; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 32px; }
  h2 { font-size: 22px; font-weight: 600; margin: 0 0 16px; color: #1a2a1e; }
  h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; color: #1a2a1e; }
  p { font-size: 15px; line-height: 1.6; color: #4a5e52; margin: 0 0 16px; }
  .cta { display: inline-block; background: #4a9270; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-top: 8px; }
  .footer { text-align: center; font-size: 12px; color: #9fb5a9; margin-top: 32px; }
  hr { border: none; border-top: 1px solid #e2ebe6; margin: 24px 0; }
  .section { background: #f4f7f5; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .label { font-size: 11px; font-weight: 600; color: #9fb5a9; text-transform: uppercase; letter-spacing: 0.06em; }
  .value { font-size: 14px; color: #1a2a1e; margin-top: 4px; }
  .score-row { display: flex; gap: 12px; margin: 8px 0; }
  .score-box { flex: 1; background: #fff; border: 1px solid #e2ebe6; border-radius: 8px; padding: 12px; text-align: center; }
  .score-num { font-size: 20px; font-weight: 700; color: #4a9270; }
  .score-label { font-size: 11px; color: #9fb5a9; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 10px 0; border-bottom: 1px solid #f0f7f3; vertical-align: top; }
  .applicant-block { margin: 16px 0; padding: 20px; background: #f4f7f5; border-radius: 10px; border-left: 3px solid #4a9270; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">KoreLabs Cloud</div>
  <h2>${heading}</h2>
  <p>${body.replace(/\n/g, '</p><p>')}</p>
  ${ctaText && ctaUrl ? `<hr><a href="${ctaUrl}" class="cta">${ctaText}</a>` : ''}
  <div class="footer">KoreLabs Cloud · Amsterdam, Netherlands<br>This email was sent regarding your application.</div>
</div>
</body>
</html>`
}

// ─── Applicant-facing emails ──────────────────────────────────────────────────

export async function sendAcknowledgmentEmail(applicant: Applicant, roleTitle: string): Promise<void> {
  const resend = getResend()
  const subject = `Application received — ${roleTitle} at KoreLabs`
  const trackingUrl = generateTrackingUrl(applicant.tracking_token)

  const body = await personaliseEmail({
    type: 'acknowledgment',
    applicantName: applicant.first_name,
    roleTitle,
    whyKorelabs: applicant.why_korelabs,
  })

  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body, 'Track your application', trackingUrl)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'acknowledgment', resendId, error)
}

export async function sendAssessmentEmail(
  applicant: Applicant,
  roleTitle: string,
  quizToken: string,
  expiresAt: Date,
  scheduledAt?: string
): Promise<string | undefined> {
  const resend = getResend()
  const subject = `Your KoreLabs assessment — ${roleTitle}`
  const quizUrl = generateQuizUrl(quizToken)
  const expiryStr = formatDateTime(expiresAt)

  const body = await personaliseEmail({
    type: 'assessment',
    applicantName: applicant.first_name,
    roleTitle,
    whyKorelabs: applicant.why_korelabs,
  })

  const fullBody = `${body}\n\nThe assessment consists of 20 multiple-choice questions and takes around 30 minutes to complete. Your unique link expires on ${expiryStr}.`
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, fullBody, 'Start assessment', quizUrl)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
        ...(scheduledAt ? { scheduledAt } : {}),
      })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'assessment', resendId, error)
  return resendId
}

export async function sendNudge1Email(
  applicant: Applicant,
  roleTitle: string,
  quizToken: string,
  scheduledAt: string
): Promise<string | undefined> {
  const resend = getResend()
  const subject = `Your assessment link is still open — ${roleTitle} at KoreLabs`
  const quizUrl = generateQuizUrl(quizToken)

  const body = await personaliseEmail({ type: 'nudge_1', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body, 'Open my assessment', quizUrl)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html, scheduledAt })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'nudge_1', resendId, error)
  return resendId
}

export async function sendNudge2Email(
  applicant: Applicant,
  roleTitle: string,
  quizToken: string,
  scheduledAt: string
): Promise<string | undefined> {
  const resend = getResend()
  const subject = `Last reminder — your KoreLabs assessment link expires soon`
  const quizUrl = generateQuizUrl(quizToken)

  const body = await personaliseEmail({ type: 'nudge_2', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body, 'Complete my assessment', quizUrl)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html, scheduledAt })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'nudge_2', resendId, error)
  return resendId
}

export async function sendVideoReminderEmail(
  applicant: Applicant,
  roleTitle: string,
  quizToken: string,
  scheduledAt: string
): Promise<string | undefined> {
  const resend = getResend()
  const subject = `You are almost done — one short video left`
  const videoUrl = generateVideoUrl(quizToken)

  const body = await personaliseEmail({ type: 'video_reminder', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body, 'Record my video', videoUrl)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html, scheduledAt })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'video_reminder', resendId, error)
  return resendId
}

export async function sendUnderReviewEmail(applicant: Applicant, roleTitle: string): Promise<void> {
  const resend = getResend()
  const subject = `Application under review — ${roleTitle} at KoreLabs`

  const body = await personaliseEmail({ type: 'under_review', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Thank you, ${applicant.first_name}.`, body)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'under_review', resendId, error)
}

export async function sendRejectionEmail(applicant: Applicant, roleTitle: string): Promise<void> {
  const resend = getResend()
  const subject = `Your KoreLabs application — ${roleTitle}`

  const body = await personaliseEmail({ type: 'rejection', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'rejection', resendId, error)
}

export async function sendOnboardingEmail(applicant: Applicant, roleTitle: string): Promise<void> {
  const resend = getResend()
  const subject = `Welcome to KoreLabs, ${applicant.first_name}`

  const body = await personaliseEmail({
    type: 'onboarding',
    applicantName: applicant.first_name,
    roleTitle,
    whyKorelabs: applicant.why_korelabs,
  })

  const html = buildEmailHtml(`Welcome to the team, ${applicant.first_name}.`, body)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'onboarding', resendId, error)
}

// ─── Admin-facing emails ──────────────────────────────────────────────────────

interface HiringManagerApplicantData {
  applicant: Applicant
  roleTitle: string
  assessment: Assessment | null
  cvSignedUrl: string | null
  videoSignedUrls: Array<{ question: string; url: string; duration: number | null }>
  adminProfileUrl: string
}

function buildApplicantBlock(data: HiringManagerApplicantData): string {
  const { applicant, roleTitle, assessment, cvSignedUrl, videoSignedUrls, adminProfileUrl } = data

  const links = [
    applicant.linkedin_url && `<a href="${applicant.linkedin_url}" style="color:#4a9270">LinkedIn</a>`,
    applicant.github_url && `<a href="${applicant.github_url}" style="color:#4a9270">GitHub</a>`,
    applicant.portfolio_url && `<a href="${applicant.portfolio_url}" style="color:#4a9270">Portfolio</a>`,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ')

  const scoreSection = assessment?.score !== null && assessment?.score !== undefined
    ? `<div class="score-row">
        <div class="score-box"><div class="score-num">${assessment.score}/36</div><div class="score-label">Total</div></div>
        <div class="score-box"><div class="score-num">${assessment.score_fundamentals ?? '—'}/8</div><div class="score-label">Fundamentals</div></div>
        <div class="score-box"><div class="score-num">${assessment.score_applied ?? '—'}/16</div><div class="score-label">Applied</div></div>
        <div class="score-box"><div class="score-num">${assessment.score_korelabs ?? '—'}/12</div><div class="score-label">KoreLabs</div></div>
      </div>`
    : '<p style="color:#9fb5a9;font-size:13px">Assessment pending</p>'

  const videoSection = videoSignedUrls.length > 0
    ? videoSignedUrls.map((v, i) => `
        <p style="font-size:13px;color:#637a6f;margin:8px 0 2px"><strong>Q${i + 1}:</strong> ${v.question}</p>
        <p style="margin:0"><a href="${v.url}" style="color:#4a9270;font-size:13px">▶ Watch video${v.duration ? ` (${v.duration}s)` : ''}</a></p>
      `).join('')
    : '<p style="color:#9fb5a9;font-size:13px">No videos recorded yet</p>'

  return `
    <div class="applicant-block">
      <h3 style="margin:0 0 4px;font-size:18px">${applicant.first_name} ${applicant.last_name}</h3>
      <p style="margin:0 0 12px;color:#637a6f;font-size:13px">${roleTitle}${applicant.location ? ` &nbsp;·&nbsp; ${applicant.location}` : ''}</p>
      <p style="font-size:13px;margin:0 0 4px"><a href="mailto:${applicant.email}" style="color:#4a9270">${applicant.email}</a>${applicant.phone ? ` &nbsp;·&nbsp; ${applicant.phone}` : ''}</p>
      ${links ? `<p style="font-size:13px;margin:4px 0 12px">${links}</p>` : ''}
      <hr style="border:none;border-top:1px solid #e2ebe6;margin:12px 0">
      <p class="label">Why KoreLabs</p>
      <p style="font-size:13px;color:#1a2a1e;font-style:italic">"${applicant.why_korelabs.slice(0, 400)}${applicant.why_korelabs.length > 400 ? '…' : ''}"</p>
      <hr style="border:none;border-top:1px solid #e2ebe6;margin:12px 0">
      <p class="label">Assessment Scores</p>
      ${scoreSection}
      <hr style="border:none;border-top:1px solid #e2ebe6;margin:12px 0">
      <p class="label">Video Introductions</p>
      ${videoSection}
      <hr style="border:none;border-top:1px solid #e2ebe6;margin:12px 0">
      <p style="margin:0">
        ${cvSignedUrl ? `<a href="${cvSignedUrl}" class="cta" style="margin-right:8px;font-size:12px;padding:8px 16px">Download CV</a>` : ''}
        <a href="${adminProfileUrl}" style="font-size:12px;color:#4a9270">View in admin →</a>
      </p>
    </div>`
}

export async function sendHiringManagerSingle(data: HiringManagerApplicantData): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (!adminEmail) return

  const resend = getResend()
  const subject = `Applicant ready for review — ${data.applicant.first_name} ${data.applicant.last_name} · ${data.roleTitle}`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px; color: #1a2a1e; }
  .card { background: #ffffff; border-radius: 12px; max-width: 620px; margin: 0 auto; padding: 40px; border: 1px solid #e2ebe6; }
  .logo { font-size: 14px; font-weight: 600; color: #4a9270; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px; }
  h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #1a2a1e; }
  p { font-size: 15px; line-height: 1.6; color: #4a5e52; margin: 0 0 12px; }
  .label { font-size: 11px; font-weight: 600; color: #9fb5a9; text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
  .cta { display: inline-block; background: #4a9270; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; }
  hr { border: none; border-top: 1px solid #e2ebe6; margin: 20px 0; }
  .applicant-block { margin: 16px 0; padding: 20px; background: #f4f7f5; border-radius: 10px; border-left: 3px solid #4a9270; }
  .score-row { display: flex; gap: 10px; margin: 8px 0; }
  .score-box { flex: 1; background: #fff; border: 1px solid #e2ebe6; border-radius: 8px; padding: 10px; text-align: center; }
  .score-num { font-size: 18px; font-weight: 700; color: #4a9270; }
  .score-label { font-size: 10px; color: #9fb5a9; margin-top: 2px; }
  .footer { text-align: center; font-size: 12px; color: #9fb5a9; margin-top: 24px; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">KoreLabs Hiring</div>
  <h2>Applicant ready for review</h2>
  <p style="color:#637a6f;font-size:13px">This applicant has been marked as ready for review by the hiring team.</p>
  ${buildApplicantBlock(data)}
  <div class="footer">KoreLabs Cloud · Internal hiring notification</div>
</div>
</body>
</html>`

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: adminEmail, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
      console.error('[hiring_manager_single] Resend error:', error)
    }
  }

  await logEmail(data.applicant.id, adminEmail, subject, 'hiring_manager_single', resendId, error)
}

export async function sendHiringManagerBatch(dataList: HiringManagerApplicantData[]): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (!adminEmail || dataList.length === 0) return

  const resend = getResend()
  const subject = `Batch review — ${dataList.length} applicants ready · KoreLabs`

  const applicantBlocks = dataList.map((d) => buildApplicantBlock(d)).join('<hr style="border:none;border-top:2px solid #e2ebe6;margin:24px 0">')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px; color: #1a2a1e; }
  .card { background: #ffffff; border-radius: 12px; max-width: 660px; margin: 0 auto; padding: 40px; border: 1px solid #e2ebe6; }
  .logo { font-size: 14px; font-weight: 600; color: #4a9270; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px; }
  h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #1a2a1e; }
  p { font-size: 15px; line-height: 1.6; color: #4a5e52; margin: 0 0 12px; }
  .label { font-size: 11px; font-weight: 600; color: #9fb5a9; text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
  .cta { display: inline-block; background: #4a9270; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; }
  hr { border: none; border-top: 1px solid #e2ebe6; margin: 20px 0; }
  .applicant-block { margin: 16px 0; padding: 20px; background: #f4f7f5; border-radius: 10px; border-left: 3px solid #4a9270; }
  .score-row { display: flex; gap: 10px; margin: 8px 0; }
  .score-box { flex: 1; background: #fff; border: 1px solid #e2ebe6; border-radius: 8px; padding: 10px; text-align: center; }
  .score-num { font-size: 18px; font-weight: 700; color: #4a9270; }
  .score-label { font-size: 10px; color: #9fb5a9; margin-top: 2px; }
  .footer { text-align: center; font-size: 12px; color: #9fb5a9; margin-top: 24px; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">KoreLabs Hiring</div>
  <h2>Batch review — ${dataList.length} applicants</h2>
  <p style="color:#637a6f;font-size:13px">The following applicants have been selected for review.</p>
  ${applicantBlocks}
  <div class="footer">KoreLabs Cloud · Internal hiring notification</div>
</div>
</body>
</html>`

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: adminEmail, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
      console.error('[hiring_manager_batch] Resend error:', error)
    }
  }

  for (const d of dataList) {
    await logEmail(d.applicant.id, adminEmail, subject, 'hiring_manager_batch', resendId, error)
  }
}

export async function sendNewApplicantNotification(applicant: Applicant, roleTitle: string): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (!adminEmail) return

  const resend = getResend()
  const subject = `New application — ${applicant.first_name} ${applicant.last_name} · ${roleTitle}`

  const links = [
    applicant.linkedin_url && `<a href="${applicant.linkedin_url}" style="color:#4a9270">LinkedIn</a>`,
    applicant.github_url && `<a href="${applicant.github_url}" style="color:#4a9270">GitHub</a>`,
    applicant.portfolio_url && `<a href="${applicant.portfolio_url}" style="color:#4a9270">Portfolio</a>`,
  ].filter(Boolean).join(' · ')

  const snippet = applicant.why_korelabs.length > 220
    ? applicant.why_korelabs.slice(0, 220) + '…'
    : applicant.why_korelabs

  const body = [
    `<strong>${applicant.first_name} ${applicant.last_name}</strong> just applied for the <strong>${roleTitle}</strong> role.`,
    `<strong>Email:</strong> <a href="mailto:${applicant.email}" style="color:#4a9270">${applicant.email}</a>` +
      (applicant.phone ? ` &nbsp;·&nbsp; <strong>Phone:</strong> ${applicant.phone}` : '') +
      (applicant.location ? ` &nbsp;·&nbsp; <strong>Location:</strong> ${applicant.location}` : ''),
    links ? `<strong>Links:</strong> ${links}` : '',
    `<strong>Why KoreLabs:</strong> ${snippet}`,
  ].filter(Boolean).join('\n')

  const html = buildEmailHtml(
    'New applicant',
    body,
    'View application',
    `${APP_URL}/admin/applications`
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: adminEmail, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
      console.error('[admin_notification] Resend error:', error)
    }
  } else {
    console.warn('[admin_notification] Resend not configured — skipping send')
  }

  await logEmail(applicant.id, adminEmail, subject, 'admin_notification', resendId, error)
}

export async function sendTalentPoolAcknowledgment(
  email: string,
  firstName: string,
  roleInterest: string
): Promise<void> {
  const resend = getResend()
  const subject = `You are on the KoreLabs talent radar`
  const body = `Thanks for reaching out, ${firstName}. We have added you to our talent pool for ${roleInterest} roles. When something opens up that fits, you will hear from us directly — no automated blasts, no newsletter. Just a genuine note when the timing is right.`
  const html = buildEmailHtml(`On the radar, ${firstName}.`, body)

  if (resend) {
    try {
      await resend.emails.send({ from: FROM, to: email, subject, html })
    } catch { /* best effort */ }
  }

  await logEmail(null, email, subject, 'talent_pool_acknowledgment')
}

// ─── Legacy interview emails (kept for backward compat with existing bookings) ─

export async function sendInterviewConfirmationEmail(
  applicant: Applicant,
  interview: Interview,
  roleTitle: string
): Promise<void> {
  const resend = getResend()
  const slotData =
    interview.slot ??
    (interview as unknown as { interview_slots?: { starts_at: string } | null }).interview_slots
  const slotTime = slotData?.starts_at ? formatDateTime(slotData.starts_at) : 'TBD'
  const subject = `Interview confirmed — ${roleTitle} at KoreLabs`
  const zoomLink = interview.zoom_link ?? process.env.ZOOM_INTERVIEW_LINK ?? APP_URL
  const body = `Your interview for the ${roleTitle} role at KoreLabs is confirmed for ${slotTime}.\n\nJoin via Zoom: <a href="${zoomLink}" style="color:#4a9270;word-break:break-all;">${zoomLink}</a>`
  const html = buildEmailHtml(`See you then, ${applicant.first_name}`, body, 'Join Zoom call', zoomLink)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'interview_confirmation', resendId, error)
}

export async function sendReminderEmail(
  applicant: Applicant,
  interview: Interview,
  roleTitle: string,
  type: '24h' | '1h',
  scheduledAt?: string
): Promise<void> {
  const resend = getResend()
  const subject = type === '24h'
    ? `Interview reminder — tomorrow, ${roleTitle} at KoreLabs`
    : `Your interview starts in 1 hour — ${roleTitle} at KoreLabs`
  const zoomLink = interview.zoom_link ?? process.env.ZOOM_INTERVIEW_LINK ?? APP_URL
  const body = await personaliseEmail({ type: type === '24h' ? 'reminder_24h' : 'reminder_1h', applicantName: applicant.first_name, roleTitle })
  const html = buildEmailHtml(`Hi ${applicant.first_name},`, body, 'Join Zoom call', zoomLink)

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to: applicant.email, subject, html, ...(scheduledAt ? { scheduledAt } : {}) })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, `reminder_${type}`, resendId, error)
}

// ─── Bulk custom email ────────────────────────────────────────────────────────

export async function sendBulkCustomEmail(
  applicants: Array<{ id: string; email: string; first_name: string; last_name: string }>,
  subject: string,
  bodyText: string
): Promise<{ sent: number; errors: string[] }> {
  const resend = getResend()
  let sent = 0
  const errors: string[] = []

  for (const applicant of applicants) {
    const personalizedSubject = subject
      .replace(/\{first_name\}/g, applicant.first_name)
      .replace(/\{last_name\}/g, applicant.last_name)
    const personalizedBody = bodyText
      .replace(/\{first_name\}/g, applicant.first_name)
      .replace(/\{last_name\}/g, applicant.last_name)
    const html = buildEmailHtml(`Hi ${applicant.first_name},`, personalizedBody)

    let resendId: string | undefined
    let error: string | undefined

    if (resend) {
      try {
        const result = await resend.emails.send({
          from: FROM,
          to: applicant.email,
          subject: personalizedSubject,
          html,
        })
        resendId = result.data?.id
        sent++
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error'
        errors.push(`${applicant.email}: ${error}`)
      }
    }

    await logEmail(applicant.id, applicant.email, personalizedSubject, 'bulk_custom', resendId, error)
  }

  return { sent, errors }
}

// ─── Resend cancellation helper ───────────────────────────────────────────────

export async function cancelScheduledEmail(resendId: string): Promise<void> {
  const resend = getResend()
  if (!resend || !resendId) return
  try {
    await resend.emails.cancel(resendId)
  } catch (e) {
    console.warn('[cancelScheduledEmail] Failed to cancel:', resendId, e instanceof Error ? e.message : e)
  }
}
