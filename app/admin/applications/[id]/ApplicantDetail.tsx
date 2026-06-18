'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Send, Archive, RefreshCw, CheckCircle, Video, Copy, XCircle, Mail, X, PauseCircle } from 'lucide-react'
import { StageBadge, ScoreBadge } from '@/components/ui/Badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { PIPELINE_STAGES, STAGE_LABELS, type ApplicantStage } from '@/lib/types'
import { Button } from '@/components/ui/Button'

type Tab = 'application' | 'cv' | 'assessment' | 'videos' | 'timeline' | 'notes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'application', label: 'Application' },
  { id: 'cv', label: 'CV' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'videos', label: 'Videos' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
]

interface Applicant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  why_korelabs: string
  cv_path: string | null
  stage: ApplicantStage
  notes: string | null
  created_at: string
  updated_at: string
  jobs: { title: string; slug: string; department: string } | null
}

interface Assessment {
  id: string
  quiz_token: string | null
  score: number | null
  score_fundamentals: number | null
  score_applied: number | null
  score_korelabs: number | null
  answers: Record<string, number> | null
  completed_at: string | null
  started_at: string | null
}

interface QuizQuestion {
  id: string
  tier: string
  question: string
  options: string[]
  correct_index: number
  points: number
  order_index: number
}

interface VideoEntry {
  id: string
  question_index: number
  storage_path: string
  duration_seconds: number | null
  signed_url: string | null
  question_text: string
  created_at: string
}

interface EmailLog {
  id: string
  subject: string
  type: string
  sent_at: string
}

interface Props {
  applicant: Applicant
  assessment: Assessment | null
  emails: EmailLog[]
  videoData: VideoEntry[]
  quizQuestions: QuizQuestion[]
  cvSignedUrl: string | null
}

export function ApplicantDetail({ applicant, assessment, emails, videoData, quizQuestions, cvSignedUrl }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('application')
  const [stage, setStage] = useState<ApplicantStage>(applicant.stage)
  const [notes, setNotes] = useState(applicant.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Custom email composer
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  const job = applicant.jobs

  function setResult(ok: boolean, message: string) {
    setActionResult({ ok, message })
  }

  async function updateStage(newStage: ApplicantStage) {
    setStage(newStage)
    setSaving(true)
    await fetch(`/api/admin/applications/${applicant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    setSaving(false)
    router.refresh()
  }

  async function saveNotes() {
    setSaving(true)
    await fetch(`/api/admin/applications/${applicant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaving(false)
  }

  async function sendToHiringManager() {
    setActionLoading('hm')
    setActionResult(null)
    try {
      const res = await fetch('/api/admin/notify-hiring-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: applicant.id }),
      })
      const json = await res.json()
      if (res.ok) {
        setResult(true, 'Sent to hiring manager')
        setStage('under_review')
        router.refresh()
      } else {
        setResult(false, json.error ?? 'Failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function resendAssessment() {
    setActionLoading('assessment')
    setActionResult(null)
    try {
      const res = await fetch('/api/admin/trigger-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: applicant.id, type: 'send_assessment' }),
      })
      const json = await res.json()
      setResult(res.ok, res.ok ? 'Assessment email sent' : json.error ?? 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function sendVideoInvite() {
    setActionLoading('video')
    setActionResult(null)
    try {
      const res = await fetch('/api/admin/trigger-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: applicant.id, type: 'video_reminder' }),
      })
      const json = await res.json()
      setResult(res.ok, res.ok ? 'Video invite sent' : json.error ?? 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function archiveApplicant() {
    setActionLoading('archive')
    setActionResult(null)
    try {
      await fetch(`/api/admin/applications/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'archived' }),
      })
      setStage('archived')
      setResult(true, 'Applicant archived')
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  async function rejectApplicant() {
    setActionLoading('reject')
    setActionResult(null)
    try {
      await fetch(`/api/admin/applications/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'archived', send_rejection_email: true }),
      })
      setStage('archived')
      setResult(true, 'Rejected and email sent')
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  async function sendCustomEmail() {
    if (!emailSubject.trim() || !emailBody.trim()) return
    setEmailSending(true)
    setActionResult(null)
    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: [applicant.id], subject: emailSubject, body: emailBody }),
      })
      const json = await res.json()
      if (res.ok) {
        setResult(true, 'Email sent')
        setEmailOpen(false)
        setEmailSubject('')
        setEmailBody('')
        router.refresh()
      } else {
        setResult(false, json.error ?? 'Failed')
      }
    } finally {
      setEmailSending(false)
    }
  }

  function copyLink(type: 'quiz' | 'video') {
    const token = assessment?.quiz_token
    if (!token) return
    const base = window.location.origin
    const url = type === 'quiz' ? `${base}/quiz/${token}` : `${base}/video/${token}`
    navigator.clipboard.writeText(url)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const timelineEvents = [
    { time: applicant.created_at, label: 'Applied', color: 'brand' },
    assessment?.started_at ? { time: assessment.started_at, label: 'Started assessment', color: 'default' } : null,
    assessment?.completed_at ? { time: assessment.completed_at, label: 'Completed assessment', color: 'success' } : null,
    ...videoData.map((v) => ({ time: v.created_at, label: `Uploaded video — Q${v.question_index + 1}`, color: 'success' })),
    ...emails.map((e) => ({ time: e.sent_at, label: `Email sent: ${e.type.replace(/_/g, ' ')}`, color: 'muted', subject: e.subject })),
  ].filter(Boolean).sort((a, b) => new Date(b!.time).getTime() - new Date(a!.time).getTime()) as Array<{ time: string; label: string; color: string; subject?: string }>

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="font-display text-2xl text-[#1A2A1E]">
                {applicant.first_name} {applicant.last_name}
              </h1>
              <p className="text-[#637A6F] text-sm mt-0.5">
                {job?.title} · Applied {formatDate(applicant.created_at)}
              </p>
            </div>
            <StageBadge stage={stage} />
          </div>
          {assessment?.score !== null && assessment?.score !== undefined && (
            <div className="mt-2">
              <ScoreBadge score={assessment.score} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-[#D8E8E0] overflow-hidden">
          <div className="flex border-b border-[#D8E8E0] overflow-x-auto">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === id ? 'border-brand text-brand bg-[#F8FBF9]' : 'border-transparent text-[#637A6F] hover:text-[#1A2A1E]'
                }`}
              >
                {label}
                {id === 'videos' && videoData.length > 0 && (
                  <span className="ml-1.5 text-xs bg-brand text-white rounded-full px-1.5 py-0.5">{videoData.length}</span>
                )}
                {id === 'timeline' && emails.length > 0 && (
                  <span className="ml-1.5 text-xs bg-[#D8E8E0] text-[#637A6F] rounded-full px-1.5 py-0.5">{timelineEvents.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'application' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Email', value: applicant.email },
                    { label: 'Phone', value: applicant.phone ?? '—' },
                    { label: 'Location', value: applicant.location ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-[#9FB5A9] text-xs block mb-0.5">{label}</span>
                      <p className="text-[#1A2A1E]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2 border-t border-[#D8E8E0]">
                  {applicant.linkedin_url && (
                    <a href={applicant.linkedin_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      LinkedIn <ExternalLink size={10} />
                    </a>
                  )}
                  {applicant.github_url && (
                    <a href={applicant.github_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      GitHub <ExternalLink size={10} />
                    </a>
                  )}
                  {applicant.portfolio_url && (
                    <a href={applicant.portfolio_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                      Portfolio <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-[#9FB5A9] text-xs mb-2">Why KoreLabs</p>
                  <p className="text-[15px] text-[#637A6F] leading-relaxed whitespace-pre-wrap">{applicant.why_korelabs}</p>
                </div>
              </div>
            )}

            {tab === 'cv' && (
              <div>
                {cvSignedUrl ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-[#637A6F]">CV document</p>
                      <a href={cvSignedUrl} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                        Download <ExternalLink size={10} />
                      </a>
                    </div>
                    <iframe src={cvSignedUrl} className="w-full h-[600px] rounded-xl border border-[#D8E8E0]" title="CV" />
                  </>
                ) : (
                  <p className="text-[#9FB5A9] text-sm">No CV uploaded.</p>
                )}
              </div>
            )}

            {tab === 'assessment' && (
              <div>
                {!assessment ? (
                  <p className="text-[#9FB5A9] text-sm">No assessment submitted yet.</p>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total', value: assessment.score, max: 36 },
                        { label: 'Fundamentals', value: assessment.score_fundamentals, max: 8 },
                        { label: 'Applied', value: assessment.score_applied, max: 16 },
                        { label: 'KoreLabs', value: assessment.score_korelabs, max: 12 },
                      ].map(({ label, value, max }) => (
                        <div key={label} className="p-4 rounded-xl bg-[#F4F7F5] text-center">
                          <div className="font-display text-xl text-brand font-semibold">
                            {value !== null ? `${value}/${max}` : '—'}
                          </div>
                          <div className="text-xs text-[#637A6F] mt-1">{label}</div>
                          {value !== null && (
                            <div className="mt-2 h-1 rounded-full bg-[#D8E8E0] overflow-hidden">
                              <div className="h-full rounded-full bg-brand" style={{ width: `${(value / max) * 100}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {assessment.completed_at && (
                      <p className="text-xs text-[#9FB5A9]">
                        Completed {formatDateTime(assessment.completed_at)}
                        {assessment.started_at && ` · Started ${formatDateTime(assessment.started_at)}`}
                      </p>
                    )}

                    {quizQuestions.length > 0 && assessment.answers && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-medium text-[#1A2A1E]">Question breakdown</h3>
                        {quizQuestions.map((q) => {
                          const given = assessment.answers?.[q.id]
                          const isCorrect = given === q.correct_index
                          return (
                            <div key={q.id} className={`p-3 rounded-xl border text-sm ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                              <p className="text-[#1A2A1E] mb-2">{q.question}</p>
                              <div className="space-y-1">
                                {q.options.map((opt, oi) => (
                                  <p key={oi} className={`text-xs px-2 py-1 rounded ${
                                    oi === q.correct_index ? 'text-emerald-700 font-medium' :
                                    oi === given ? 'text-red-700' : 'text-[#9FB5A9]'
                                  }`}>
                                    {oi === q.correct_index ? '✓' : oi === given ? '✗' : '·'} {opt}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'videos' && (
              <div>
                {videoData.length === 0 ? (
                  <p className="text-[#9FB5A9] text-sm">No videos recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {videoData.map((v) => (
                      <div key={v.id}>
                        <p className="text-xs text-[#9FB5A9] mb-1">Question {v.question_index + 1}</p>
                        <p className="text-sm text-[#1A2A1E] mb-3">{v.question_text}</p>
                        {v.signed_url ? (
                          <video src={v.signed_url} controls className="w-full rounded-xl border border-[#D8E8E0] max-h-64" />
                        ) : (
                          <p className="text-xs text-red-500">Signed URL expired. Refresh the page.</p>
                        )}
                        {v.duration_seconds && <p className="text-xs text-[#9FB5A9] mt-1">{v.duration_seconds}s</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'timeline' && (
              <div>
                {timelineEvents.length === 0 ? (
                  <p className="text-[#9FB5A9] text-sm">No events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {timelineEvents.map((event, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          event.color === 'success' ? 'bg-emerald-500' :
                          event.color === 'muted' ? 'bg-[#D8E8E0]' : 'bg-brand'
                        }`} />
                        <div>
                          <p className="text-sm text-[#1A2A1E]">{event.label}</p>
                          {event.subject && <p className="text-xs text-[#9FB5A9] italic">{event.subject}</p>}
                          <p className="text-xs text-[#9FB5A9]">{formatDateTime(event.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Add notes about this applicant…"
                  rows={10}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#D8E8E0] text-[#1A2A1E] resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[#9FB5A9]"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#9FB5A9]">Auto-saves on blur</p>
                  <Button size="sm" onClick={saveNotes} loading={saving}>Save</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stage selector */}
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-5">
          <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Stage</h3>
          <div className="space-y-1 mb-3">
            {PIPELINE_STAGES.map((s) => (
              <label
                key={s}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  stage === s ? 'bg-brand-50 text-brand' : 'text-[#637A6F] hover:bg-[#F4F7F5]'
                }`}
              >
                <input type="radio" name="stage" value={s} checked={stage === s} onChange={() => updateStage(s)} className="sr-only" />
                <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${stage === s ? 'bg-brand border-brand' : 'border-[#C5D9CE]'}`} />
                {STAGE_LABELS[s]}
              </label>
            ))}
          </div>
          {saving && <p className="text-xs text-[#9FB5A9]">Saving…</p>}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-5 space-y-2">
          <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Actions</h3>

          <button onClick={sendToHiringManager} disabled={actionLoading === 'hm'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#1A2A1E] hover:border-brand hover:text-brand transition-colors disabled:opacity-50">
            <Send size={14} /> Send to hiring manager
          </button>

          <button onClick={() => updateStage('accepted')} disabled={stage === 'accepted'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#1A2A1E] hover:border-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50">
            <CheckCircle size={14} /> Mark as accepted
          </button>

          <button onClick={() => updateStage('on_hold')} disabled={stage === 'on_hold'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-50">
            <PauseCircle size={14} /> Put on hold
          </button>

          <button onClick={resendAssessment} disabled={actionLoading === 'assessment'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-50">
            <RefreshCw size={14} /> Re-send assessment
          </button>

          <button onClick={sendVideoInvite} disabled={actionLoading === 'video'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-50">
            <Video size={14} /> Send video invite
          </button>

          <button onClick={() => setEmailOpen((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors">
            <Mail size={14} /> {emailOpen ? 'Close email' : 'Send custom email'}
          </button>

          {/* Inline email composer */}
          {emailOpen && (
            <div className="pt-2 space-y-3 border-t border-[#F0F7F3]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#637A6F]">Custom email</p>
                <button onClick={() => setEmailOpen(false)} className="text-[#9FB5A9] hover:text-[#1A2A1E]"><X size={13} /></button>
              </div>
              <p className="text-xs text-[#9FB5A9]">
                Use <code className="font-mono text-brand bg-[#F4F7F5] px-1 rounded">{'{first_name}'}</code> to personalize.
              </p>
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
                rows={6}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8E8E0] resize-none focus:outline-none focus:border-brand placeholder:text-[#C5D9CE]"
              />
              <button
                onClick={sendCustomEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                <Send size={12} />
                {emailSending ? 'Sending…' : 'Send email'}
              </button>
            </div>
          )}

          <div className="border-t border-[#F0F7F3] pt-2 space-y-2">
            <button onClick={archiveApplicant} disabled={actionLoading === 'archive' || stage === 'archived'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
              <Archive size={14} /> Archive (silent)
            </button>

            <button onClick={rejectApplicant} disabled={actionLoading === 'reject' || stage === 'archived'} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
              <XCircle size={14} /> Reject (send email)
            </button>
          </div>

          {assessment?.quiz_token && (
            <div className="border-t border-[#F0F7F3] pt-2 space-y-1.5">
              <p className="text-xs text-[#9FB5A9] font-medium">Copy links</p>
              <button onClick={() => copyLink('quiz')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D8E8E0] text-xs text-[#637A6F] hover:border-brand hover:text-brand transition-colors">
                <Copy size={12} /> {copied === 'quiz' ? 'Copied!' : 'Copy quiz link'}
              </button>
              {assessment.completed_at && (
                <button onClick={() => copyLink('video')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D8E8E0] text-xs text-[#637A6F] hover:border-brand hover:text-brand transition-colors">
                  <Copy size={12} /> {copied === 'video' ? 'Copied!' : 'Copy video link'}
                </button>
              )}
            </div>
          )}

          {actionResult && (
            <p className={`text-xs px-3 py-2 rounded-lg ${actionResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {actionResult.message}
            </p>
          )}
        </div>

        {/* Score summary */}
        {assessment?.score !== null && assessment?.score !== undefined && (
          <div className="bg-white rounded-xl border border-[#D8E8E0] p-5">
            <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Score summary</h3>
            <div className="space-y-2">
              {[
                { label: 'Total', value: assessment.score, max: 36 },
                { label: 'Fundamentals', value: assessment.score_fundamentals, max: 8 },
                { label: 'Applied', value: assessment.score_applied, max: 16 },
                { label: 'KoreLabs', value: assessment.score_korelabs, max: 12 },
              ].map(({ label, value, max }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#637A6F]">{label}</span>
                    <span className="font-medium text-[#1A2A1E]">{value ?? '—'}/{max}</span>
                  </div>
                  {value !== null && (
                    <div className="h-1 rounded-full bg-[#D8E8E0] overflow-hidden">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent email log */}
        {emails.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D8E8E0] p-5">
            <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Email history</h3>
            <div className="space-y-2.5">
              {emails.slice(0, 8).map((e) => (
                <div key={e.id}>
                  <p className="text-xs font-medium text-[#1A2A1E] leading-snug">{e.subject}</p>
                  <p className="text-xs text-[#9FB5A9]">{e.type.replace(/_/g, ' ')} · {formatDate(e.sent_at)}</p>
                </div>
              ))}
              {emails.length > 8 && (
                <p className="text-xs text-[#9FB5A9]">+{emails.length - 8} more (see Timeline tab)</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
