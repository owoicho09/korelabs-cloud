import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import path from 'path'
import { z } from 'zod'

const CONTRACTS_DIR = path.join(process.cwd(), 'public', 'contracts')

// ─── Template reading ─────────────────────────────────────────────────────────
// Tries .docx first (mammoth extracts raw text), falls back to .txt.
// No placeholder substitution — raw document text is returned as-is.

async function readTemplate(
  jobSlug: string,
  name: 'offer-letter' | 'contractor-agreement',
): Promise<string | null> {
  if (!jobSlug) return null
  const base = path.join(CONTRACTS_DIR, jobSlug)

  // 1. Try DOCX via mammoth
  try {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ path: path.join(base, `${name}.docx`) })
    return value.trim() || null
  } catch { /* file not found or unreadable */ }

  // 2. Fall back to plain text
  try {
    const { readFile } = await import('fs/promises')
    return await readFile(path.join(base, `${name}.txt`), 'utf-8')
  } catch { /* not found */ }

  return null
}

// ─── DOCX generation ──────────────────────────────────────────────────────────

async function buildDocxBuffer(content: string, documentTitle: string): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, UnderlineType } = await import('docx')

  const header = [
    new Paragraph({
      children: [
        new TextRun({ text: 'KoreLabs Cloud', bold: true, size: 20, color: '4A9270', font: 'Calibri' }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: documentTitle, bold: true, size: 32, color: '1A2A1E', font: 'Calibri' }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: ' ',
          underline: { type: UnderlineType.SINGLE, color: 'D8E8E0' },
          size: 4,
        }),
      ],
      spacing: { after: 320 },
    }),
  ]

  const body = content.split('\n').map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ', // non-breaking space keeps empty lines
            size: 22,
            font: 'Calibri',
            color: '2D3D35',
          }),
        ],
        spacing: { after: line.trim() ? 100 : 60 },
      }),
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [...header, ...body],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ─── Route context ────────────────────────────────────────────────────────────

interface RouteContext {
  params: Promise<{ id: string }>
}

// ─── GET — load raw document text + static email defaults ────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { data: applicant } = await db
    .from('applicants')
    .select('id, stage, jobs(slug)')
    .eq('id', id)
    .single()

  if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const job = (Array.isArray(applicant.jobs) ? applicant.jobs[0] : applicant.jobs) as { slug: string } | null

  const [offerText, contractText, { count: offerCount }] = await Promise.all([
    readTemplate(job?.slug ?? '', 'offer-letter'),
    readTemplate(job?.slug ?? '', 'contractor-agreement'),
    db.from('email_log').select('id', { count: 'exact', head: true }).eq('applicant_id', id).eq('type', 'offer_sent'),
  ])

  return NextResponse.json({
    offer_letter: offerText,
    contractor_agreement: contractText,
    job_slug: job?.slug ?? '',
    already_sent: (offerCount ?? 0) > 0,
    default_subject: 'Your Application to KoreLabs Cloud has been accepted',
    default_body: [
      'Hi [first name],',
      '',
      "Congratulations. After reviewing your application, assessment, and video, we'd like to formally offer you the [role] position at KoreLabs Cloud.",
      '',
      "We were genuinely impressed by you and we think you'll do excellent work with us.",
      '',
      "I've attached two documents:",
      '- Your offer letter, with the full details of the role and compensation',
      '- Your contractor agreement',
      '',
      'Please review both. If everything looks good, sign the contractor agreement and reply to this email with the signed copy within 3 business days.',
      '',
      'If you have any questions before signing, just reply here — happy to walk you through anything.',
      '',
      'Welcome aboard,',
      'Michael',
      'Hiring Manager, KoreLabs Cloud',
      'hr@korelabs.cloud',
    ].join('\n'),
  })
}

// ─── POST — generate DOCX, send email, log, advance stage ────────────────────

const sendSchema = z.object({
  offer_letter: z.string().min(1, 'Offer letter is required'),
  contractor_agreement: z.string().min(1, 'Contractor agreement is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
})

export async function POST(req: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  let parsed: z.infer<typeof sendSchema>
  try {
    parsed = sendSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 })
  }

  const { data: applicant } = await db
    .from('applicants')
    .select('id, first_name, last_name, email, stage, jobs(title, slug)')
    .eq('id', id)
    .single()

  if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

  // Stage guard — only allow offer when applicant is ready for it
  const OFFER_ALLOWED_STAGES = ['assessment_video_done', 'under_review', 'on_hold']
  if (!OFFER_ALLOWED_STAGES.includes(applicant.stage as string)) {
    return NextResponse.json(
      { error: `Offer cannot be sent at stage "${applicant.stage}". Applicant must be at Video Done, Under Review, or On Hold.` },
      { status: 422 }
    )
  }

  // Duplicate guard
  const { count: existingOffer } = await db
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('applicant_id', id)
    .eq('type', 'offer_sent')

  if ((existingOffer ?? 0) > 0) {
    return NextResponse.json(
      { error: 'An offer has already been sent to this applicant. Refresh the page to see the current state.' },
      { status: 409 }
    )
  }

  // Sanitise name for filename
  const safeName = `${applicant.first_name}-${applicant.last_name}`.replace(/[^a-zA-Z0-9-]/g, '-')

  // Generate both DOCX buffers in parallel
  let offerBuffer: Buffer
  let contractBuffer: Buffer
  try {
    ;[offerBuffer, contractBuffer] = await Promise.all([
      buildDocxBuffer(parsed.offer_letter, 'Offer Letter'),
      buildDocxBuffer(parsed.contractor_agreement, 'Contractor Agreement'),
    ])
  } catch (e) {
    return NextResponse.json(
      { error: `Document generation failed: ${e instanceof Error ? e.message : 'Unknown error'}` },
      { status: 500 },
    )
  }

  // Build HTML email from the plain-text body
  const escapedBody = parsed.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => (line.trim() ? `<p style="margin:0 0 10px">${line}</p>` : '<br>'))
    .join('')

  const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px}
.card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:40px;border:1px solid #e2ebe6}
.logo{font-size:13px;font-weight:600;color:#4a9270;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px}
.body{font-size:15px;line-height:1.7;color:#374840}
.footer{text-align:center;font-size:12px;color:#9fb5a9;margin-top:32px}
</style></head>
<body><div class="card">
<div class="logo">KoreLabs Cloud</div>
<div class="body">${escapedBody}</div>
<hr style="border:none;border-top:1px solid #e2ebe6;margin:28px 0">
<div class="footer">KoreLabs Cloud · Amsterdam, Netherlands<br>hr@korelabs.cloud</div>
</div></body></html>`

  // Send via Resend
  const { Resend } = await import('resend')
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  if (!resend) {
    return NextResponse.json({ error: 'Email service not configured — RESEND_API_KEY missing' }, { status: 503 })
  }

  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: emailData, error: emailError } = await (resend.emails.send as any)({
    from: 'KoreLabs Cloud HR <hr@korelabs.cloud>',
    to: applicant.email,
    reply_to: 'hr@korelabs.cloud',
    subject: parsed.subject,
    html: emailHtml,
    attachments: [
      {
        filename: `KoreLabs-Offer-Letter-${safeName}.docx`,
        content: offerBuffer,
        content_type: DOCX_MIME,
      },
      {
        filename: `KoreLabs-Contractor-Agreement-${safeName}.docx`,
        content: contractBuffer,
        content_type: DOCX_MIME,
      },
    ],
  })

  if (emailError) {
    const msg = (emailError as { message?: string }).message ?? 'Email sending failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Log to email_log
  await db.from('email_log').insert({
    applicant_id: id,
    to_email: applicant.email,
    subject: parsed.subject,
    type: 'offer_sent',
    resend_id: (emailData as { id?: string } | null)?.id ?? null,
  })

  // Advance stage to accepted
  await db
    .from('applicants')
    .update({ stage: 'accepted', stage_updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, email_id: (emailData as { id?: string } | null)?.id })
}
