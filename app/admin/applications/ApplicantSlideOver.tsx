'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, ExternalLink, Send, RefreshCw, Video, Archive, CheckCircle,
  PauseCircle, XCircle, Mail, Clapperboard,
} from 'lucide-react'
import { StageBadge, ScoreBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'

interface SlideOverData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  location: string | null
  why_korelabs: string
  stage: ApplicantStage
  notes: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  created_at: string
  jobs: { title: string; department: string } | null
  assessment: {
    score: number | null
    score_fundamentals: number | null
    score_applied: number | null
    score_korelabs: number | null
    completed_at: string | null
    quiz_token: string | null
  } | null
  recent_emails: Array<{ subject: string; type: string; sent_at: string }>
  video_count: number
}

interface Props {
  applicantId: string | null
  onClose: () => void
  onRefresh?: () => void
}

const EMAIL_TEMPLATES = [
  {
    label: 'Interview invitation',
    subject: "We'd love to meet you, {first_name}",
    body: `Hi {first_name},\n\nThank you for completing the assessment — we were really impressed. We'd love to schedule a call to learn more about you.\n\nWe'll be in touch shortly with available time slots.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Application under review',
    subject: 'Your KoreLabs application is under review',
    body: `Hi {first_name},\n\nWe wanted to let you know that your application is currently being reviewed by our hiring team. We appreciate your patience and will be in touch shortly.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Need more information',
    subject: 'A quick follow-up on your KoreLabs application',
    body: `Hi {first_name},\n\nThank you for your application. We've reviewed your materials and had a couple of follow-up questions for you.\n\nCould you reply to this email with more details about [topic]?\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Assessment reminder',
    subject: 'Reminder: your KoreLabs assessment is still open',
    body: `Hi {first_name},\n\nJust a quick reminder that your assessment link is still active. The quiz takes around 30 minutes and will help us understand your technical background better.\n\nLooking forward to seeing your results.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Video reminder',
    subject: 'One last step — your video introduction',
    body: `Hi {first_name},\n\nCongratulations on finishing the assessment! The final step is a short video introduction — it typically takes 5 minutes and is your chance to show us the person behind the application.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Offer letter',
    subject: "We'd like to make you an offer, {first_name}",
    body: `Hi {first_name},\n\nWe're thrilled to let you know that after reviewing your application and getting to know you through the process, we'd like to extend a formal offer to join the KoreLabs team.\n\nWe'll be reaching out separately with the full offer details. Congratulations!\n\nBest,\nThe KoreLabs Team`,
  },
]

export function ApplicantSlideOver({ applicantId, onClose, onRefresh }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SlideOverData | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [stage, setStage] = useState<ApplicantStage | null>(null)

  // Email composer inside slide-over
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    if (!applicantId) { setData(null); return }
    setLoading(true)
    setActionMsg(null)
    setEmailOpen(false)
    fetch(`/api/admin/applications/${applicantId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setStage(d.stage) })
      .finally(() => setLoading(false))
  }, [applicantId])

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!applicantId) return null

  function applyTemplate(label: string) {
    const tpl = EMAIL_TEMPLATES.find((t) => t.label === label)
    if (!tpl) return
    setEmailSubject(tpl.subject)
    setEmailBody(tpl.body)
    setEmailTemplate(label)
  }

  async function doAction(action: string, stageOverride?: string) {
    if (!data) return
    setActionLoading(action)
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: [data.id], action, ...(stageOverride ? { stage: stageOverride } : {}) }),
      })
      const json = await res.json()
      if (res.ok) {
        setActionMsg({ ok: true, text: 'Done' })
        if (stageOverride) setStage(stageOverride as ApplicantStage)
        if (action === 'mark_accepted') setStage('accepted')
        onRefresh?.()
        router.refresh()
      } else {
        setActionMsg({ ok: false, text: json.error ?? 'Failed' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function sendToHM() {
    if (!data) return
    setActionLoading('hm')
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/notify-hiring-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: data.id }),
      })
      const json = await res.json()
      if (res.ok) {
        setActionMsg({ ok: true, text: 'Sent to hiring manager' })
        setStage('under_review')
        onRefresh?.()
        router.refresh()
      } else {
        setActionMsg({ ok: false, text: json.error ?? 'Failed' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function sendEmail() {
    if (!data || !emailSubject.trim() || !emailBody.trim()) return
    setEmailSending(true)
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: [data.id], subject: emailSubject, body: emailBody }),
      })
      const json = await res.json()
      setActionMsg(res.ok
        ? { ok: true, text: 'Email sent' }
        : { ok: false, text: json.error ?? 'Failed' }
      )
      if (res.ok) {
        setEmailOpen(false)
        setEmailSubject('')
        setEmailBody('')
        setEmailTemplate('')
        router.refresh()
      }
    } finally {
      setEmailSending(false)
    }
  }

  const isDisabled = !!actionLoading
  const btn = (variant: 'default' | 'green' | 'amber' | 'red' = 'default') =>
    `flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === 'green' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' :
      variant === 'red' ? 'border-red-200 text-red-600 hover:bg-red-50' :
      variant === 'amber' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' :
      'border-[#D8E8E0] text-[#637A6F] hover:border-brand hover:text-brand'
    }`

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-[420px] bg-white shadow-2xl flex flex-col border-l border-[#D8E8E0]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8E8E0] shrink-0">
          <p className="text-xs font-semibold text-[#9FB5A9] uppercase tracking-wider">Quick preview</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9FB5A9] hover:text-[#1A2A1E] hover:bg-[#F4F7F5] transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0F7F3]">

            {/* Identity */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0 pr-3">
                  <h2 className="font-display text-xl text-[#1A2A1E] leading-tight">
                    {data.first_name} {data.last_name}
                  </h2>
                  <p className="text-xs text-[#9FB5A9] mt-0.5">
                    {data.jobs?.title} · Applied {formatDate(data.created_at)}
                  </p>
                </div>
                {stage && <StageBadge stage={stage} />}
              </div>

              {data.assessment?.score !== null && data.assessment?.score !== undefined && (
                <div className="mb-2"><ScoreBadge score={data.assessment.score} /></div>
              )}

              {(stage === 'assessment_video_done' || data.video_count > 0) && (
                <div className={`mb-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  data.video_count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  <Clapperboard size={10} />
                  {data.video_count > 0
                    ? `${data.video_count} video${data.video_count !== 1 ? 's' : ''} recorded`
                    : 'No videos — mislabelled'}
                </div>
              )}

              <a href={`mailto:${data.email}`} className="text-xs text-brand hover:underline block">{data.email}</a>
              {data.phone && <p className="text-xs text-[#9FB5A9]">{data.phone}</p>}
              {data.location && <p className="text-xs text-[#9FB5A9]">{data.location}</p>}

              {(data.linkedin_url || data.github_url || data.portfolio_url) && (
                <div className="flex gap-3 mt-2">
                  {data.linkedin_url && (
                    <a href={data.linkedin_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      LinkedIn <ExternalLink size={9} />
                    </a>
                  )}
                  {data.github_url && (
                    <a href={data.github_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      GitHub <ExternalLink size={9} />
                    </a>
                  )}
                  {data.portfolio_url && (
                    <a href={data.portfolio_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      Portfolio <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Why KoreLabs */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-[#9FB5A9] mb-2">Why KoreLabs</p>
              <p className="text-xs text-[#637A6F] leading-relaxed line-clamp-6">{data.why_korelabs}</p>
            </div>

            {/* Assessment scores */}
            {data.assessment && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-[#9FB5A9] mb-3">Assessment</p>
                {data.assessment.completed_at ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Total', val: data.assessment.score, max: 36 },
                      { label: 'Fund.', val: data.assessment.score_fundamentals, max: 8 },
                      { label: 'Applied', val: data.assessment.score_applied, max: 16 },
                      { label: 'KoreLabs', val: data.assessment.score_korelabs, max: 12 },
                    ].map(({ label, val, max }) => (
                      <div key={label} className="text-center p-2 bg-[#F4F7F5] rounded-lg">
                        <div className="text-sm font-semibold text-brand">
                          {val ?? '—'}<span className="text-[10px] text-[#9FB5A9]">/{max}</span>
                        </div>
                        <div className="text-[10px] text-[#9FB5A9] mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#9FB5A9]">Not completed yet</p>
                )}
              </div>
            )}

            {/* Notes */}
            {data.notes && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-[#9FB5A9] mb-2">Notes</p>
                <p className="text-xs text-[#637A6F] leading-relaxed line-clamp-5 whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}

            {/* Recent emails */}
            {data.recent_emails.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-[#9FB5A9] mb-2">Recent emails</p>
                <div className="space-y-2">
                  {data.recent_emails.map((e, i) => (
                    <div key={i}>
                      <p className="text-xs text-[#1A2A1E] font-medium leading-snug">{e.subject}</p>
                      <p className="text-[10px] text-[#9FB5A9]">{e.type.replace(/_/g, ' ')} · {formatDate(e.sent_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-[#9FB5A9] mb-3">Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={sendToHM} disabled={isDisabled} className={btn()}>
                  <Send size={12} /> Hiring manager
                </button>
                <button onClick={() => doAction('mark_accepted')} disabled={isDisabled || stage === 'accepted'} className={btn('green')}>
                  <CheckCircle size={12} /> Accept
                </button>
                <button onClick={() => doAction('resend_assessment')} disabled={isDisabled} className={btn()}>
                  <RefreshCw size={12} /> Re-send assessment
                </button>
                <button onClick={() => doAction('send_video_invite')} disabled={isDisabled} className={btn()}>
                  <Video size={12} /> Send video invite
                </button>
                <button onClick={() => doAction('move_stage', 'on_hold')} disabled={isDisabled} className={btn('amber')}>
                  <PauseCircle size={12} /> On hold
                </button>
                <button onClick={() => doAction('move_stage', 'archived')} disabled={isDisabled} className={btn('red')}>
                  <Archive size={12} /> Archive
                </button>
                <button onClick={() => doAction('reject_archive')} disabled={isDisabled} className={`col-span-2 ${btn('red')}`}>
                  <XCircle size={12} /> Reject &amp; archive (sends rejection email)
                </button>
              </div>

              {/* Inline email composer */}
              <button
                onClick={() => setEmailOpen((v) => !v)}
                className={`w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  emailOpen ? 'border-brand text-brand bg-[#F4F7F5]' : 'border-[#D8E8E0] text-[#637A6F] hover:border-brand hover:text-brand'
                }`}
              >
                <Mail size={12} /> {emailOpen ? 'Close email composer' : 'Send custom email'}
              </button>

              {emailOpen && (
                <div className="mt-3 space-y-3 pt-3 border-t border-[#F0F7F3]">
                  <select
                    value={emailTemplate}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8E8E0] text-[#637A6F] focus:outline-none focus:border-brand bg-white"
                  >
                    <option value="">— Use a template —</option>
                    {EMAIL_TEMPLATES.map((t) => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand placeholder:text-[#C5D9CE]"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder={`Hi {first_name},\n\n`}
                    rows={7}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8E8E0] resize-none focus:outline-none focus:border-brand placeholder:text-[#C5D9CE]"
                  />
                  <p className="text-[10px] text-[#9FB5A9]">
                    Use <code className="font-mono text-brand bg-[#F4F7F5] px-1 rounded">{'{first_name}'}</code> to personalize.
                  </p>
                  <button
                    onClick={sendEmail}
                    disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    <Send size={12} />
                    {emailSending ? 'Sending…' : 'Send email'}
                  </button>
                </div>
              )}

              {actionMsg && (
                <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${actionMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {actionMsg.text}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {data && (
          <div className="px-5 py-3 border-t border-[#D8E8E0] shrink-0 bg-[#FAFAF8]">
            <Link href={`/admin/applications/${data.id}`} className="flex items-center gap-1.5 text-xs text-brand hover:underline font-medium">
              <ExternalLink size={12} /> View full profile
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
