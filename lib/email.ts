import { Resend } from 'resend'
import { personaliseEmail } from './openai'
import { generateTrackingUrl, generateQuizUrl, generateBookingUrl, formatDateTime } from './utils'
import type { Applicant, Interview } from './types'
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
  p { font-size: 15px; line-height: 1.6; color: #4a5e52; margin: 0 0 16px; }
  .cta { display: inline-block; background: #4a9270; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-top: 8px; }
  .footer { text-align: center; font-size: 12px; color: #9fb5a9; margin-top: 32px; }
  hr { border: none; border-top: 1px solid #e2ebe6; margin: 24px 0; }
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

  const html = buildEmailHtml(
    `Hi ${applicant.first_name},`,
    body,
    'Track your application',
    trackingUrl
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
      })
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
  expiresAt: Date
): Promise<void> {
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

  const html = buildEmailHtml(
    `Hi ${applicant.first_name},`,
    fullBody,
    'Start assessment',
    quizUrl
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
      })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'assessment', resendId, error)
}

export async function sendInterviewInviteEmail(
  applicant: Applicant,
  roleTitle: string,
  bookingToken: string
): Promise<void> {
  const resend = getResend()
  const subject = `Interview invitation — ${roleTitle} at KoreLabs`
  const bookingUrl = generateBookingUrl(bookingToken)

  const body = await personaliseEmail({
    type: 'interview_invite',
    applicantName: applicant.first_name,
    roleTitle,
  })

  const html = buildEmailHtml(
    `Hi ${applicant.first_name},`,
    body,
    'Book your interview slot',
    bookingUrl
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
      })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(applicant.id, applicant.email, subject, 'interview_invite', resendId, error)
}

export async function sendInterviewConfirmationEmail(
  applicant: Applicant,
  interview: Interview,
  roleTitle: string
): Promise<void> {
  const resend = getResend()

  // Supabase returns joined slot data under the table name "interview_slots",
  // not the "slot" alias defined in the Interview type.
  const slotData =
    interview.slot ??
    (interview as unknown as { interview_slots?: { starts_at: string } | null }).interview_slots

  const slotTime = slotData?.starts_at ? formatDateTime(slotData.starts_at) : 'TBD'

  const subject = `Interview confirmed — ${roleTitle} at KoreLabs`
  const zoomLink = interview.zoom_link ?? process.env.ZOOM_INTERVIEW_LINK ?? APP_URL

  // Include the Zoom URL inline so it is visible even if the button does not render.
  const body = `Your interview for the ${roleTitle} role at KoreLabs is confirmed for ${slotTime}.\n\nJoin via Zoom: <a href="${zoomLink}" style="color:#4a9270;word-break:break-all;">${zoomLink}</a>\n\nIf anything changes, please reply to this email.`

  const html = buildEmailHtml(
    `See you then, ${applicant.first_name}`,
    body,
    'Join Zoom call',
    zoomLink
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
      })
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
  type: '24h' | '1h'
): Promise<void> {
  const resend = getResend()
  const subject = type === '24h'
    ? `Interview reminder — tomorrow, ${roleTitle} at KoreLabs`
    : `Your interview starts in 1 hour — ${roleTitle} at KoreLabs`

  const zoomLink = interview.zoom_link ?? process.env.ZOOM_INTERVIEW_LINK ?? APP_URL

  const body = await personaliseEmail({
    type: type === '24h' ? 'reminder_24h' : 'reminder_1h',
    applicantName: applicant.first_name,
    roleTitle,
  })

  const html = buildEmailHtml(
    `Hi ${applicant.first_name},`,
    body,
    'Join Zoom call',
    zoomLink
  )

  let resendId: string | undefined
  let error: string | undefined

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject,
        html,
      })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(
    applicant.id,
    applicant.email,
    subject,
    `reminder_${type}`,
    resendId,
    error
  )
}

export async function sendNewApplicantNotification(
  applicant: Applicant,
  roleTitle: string
): Promise<void> {
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
    generateTrackingUrl(applicant.tracking_token)
  )

  if (resend) {
    try {
      await resend.emails.send({ from: FROM, to: adminEmail, subject, html })
    } catch { /* best effort */ }
  }

  await logEmail(applicant.id, adminEmail, subject, 'admin_notification')
}

export async function sendTalentPoolAcknowledgment(
  email: string,
  firstName: string,
  roleInterest: string
): Promise<void> {
  const resend = getResend()
  const subject = `You are on the KoreLabs talent radar`

  const body = `Thanks for reaching out, ${firstName}. We have added you to our talent pool for ${roleInterest} roles. When something opens up that fits, you will hear from us directly — no automated blasts, no newsletter. Just a genuine note when the timing is right.`

  const html = buildEmailHtml(
    `On the radar, ${firstName}.`,
    body
  )

  if (resend) {
    try {
      await resend.emails.send({ from: FROM, to: email, subject, html })
    } catch { /* best effort */ }
  }

  await logEmail(null, email, subject, 'talent_pool_acknowledgment')
}
