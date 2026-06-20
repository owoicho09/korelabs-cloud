'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StageBadge, ScoreBadge } from '@/components/ui/Badge'
import { formatRelative, daysAgo } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { STAGE_LABELS, PIPELINE_STAGES } from '@/lib/types'
import {
  Filter, Send, ChevronLeft, ChevronRight,
  CheckCircle, PauseCircle, RefreshCw, Video, Mail, X, Users,
  Download, XCircle, Eye, StickyNote, Search,
} from 'lucide-react'
import { ApplicantSlideOver } from './ApplicantSlideOver'

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
    body: `Hi {first_name},\n\nThank you for your application. We've reviewed your materials and had a couple of follow-up questions.\n\nCould you reply to this email with more details about [topic]?\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Assessment reminder',
    subject: 'Reminder: your KoreLabs assessment is still open',
    body: `Hi {first_name},\n\nJust a friendly reminder that your assessment link is still active. It takes about 30 minutes and will help us learn more about your technical background.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Video reminder',
    subject: 'One last step — your video introduction',
    body: `Hi {first_name},\n\nCongratulations on finishing the assessment! The final step is a short video introduction — your chance to show us the person behind the application.\n\nBest,\nThe KoreLabs Team`,
  },
  {
    label: 'Offer letter',
    subject: "We'd like to make you an offer, {first_name}",
    body: `Hi {first_name},\n\nWe're delighted to let you know that we'd like to extend a formal offer to join KoreLabs. We'll be sending over the full offer details separately.\n\nCongratulations!\n\nBest,\nThe KoreLabs Team`,
  },
]

interface Application {
  id: string
  first_name: string
  last_name: string
  email: string
  stage: ApplicantStage
  created_at: string
  updated_at: string
  location: string | null
  notes: string | null
  score: number | null
  assessment_completed: boolean
  video_count: number
  jobs: { title: string; department: string } | null
}

interface StageOption {
  value: string
  label: string
}

interface Props {
  applications: Application[]
  totalCount: number
  currentPage: number
  totalPages: number
  currentParams: Record<string, string | undefined>
  stageOptions: StageOption[]
}

export function ApplicationsTable({
  applications,
  totalCount,
  currentPage,
  totalPages,
  currentParams,
  stageOptions,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchValue, setSearchValue] = useState(currentParams.search ?? '')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(value: string) {
    setSearchValue(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      navigate({ search: value.trim() || undefined })
    }, 400)
  }

  // Slide-over preview
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Email composer modal
  const [emailModal, setEmailModal] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(message: string, ok = true) {
    setToast({ message, ok })
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...currentParams, ...overrides, page: overrides.page ?? '1' }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v)
    }
    return `/admin/applications?${sp.toString()}`
  }

  function navigate(overrides: Record<string, string | undefined>) {
    startTransition(() => router.push(buildUrl(overrides)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === applications.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(applications.map((a) => a.id)))
    }
  }

  async function sendToHiringManager() {
    if (!selected.size) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/notify-hiring-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: Array.from(selected) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      showToast(`Sent ${selected.size} to hiring manager`)
      setSelected(new Set())
      router.refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', false)
    } finally {
      setBulkLoading(false)
    }
  }

  async function bulkAction(action: string, stage?: string) {
    if (!selected.size) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: Array.from(selected), action, ...(stage ? { stage } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      const count = data.processed ?? selected.size
      showToast(`Done — ${count} processed${data.errors?.length ? `, ${data.errors.length} skipped` : ''}`)
      setSelected(new Set())
      router.refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', false)
    } finally {
      setBulkLoading(false)
    }
  }

  async function quickAction(applicantId: string, action: string, stage?: string) {
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: [applicantId], action, ...(stage ? { stage } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      showToast('Done')
      router.refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', false)
    }
  }

  function applyTemplate(label: string) {
    const tpl = EMAIL_TEMPLATES.find((t) => t.label === label)
    if (!tpl) return
    setEmailSubject(tpl.subject)
    setEmailBody(tpl.body)
    setEmailTemplate(label)
  }

  async function sendBulkEmail() {
    if (!emailSubject.trim() || !emailBody.trim()) return
    setEmailSending(true)
    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: Array.from(selected), subject: emailSubject, body: emailBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      showToast(`Email sent to ${data.sent} applicant${data.sent !== 1 ? 's' : ''}`)
      setEmailModal(false)
      setEmailSubject('')
      setEmailBody('')
      setEmailTemplate('')
      setSelected(new Set())
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', false)
    } finally {
      setEmailSending(false)
    }
  }

  function exportCsv() {
    const headers = ['Name', 'Email', 'Role', 'Stage', 'Score', 'Applied', 'Location']
    const rows = applications.map((a) => [
      `${a.first_name} ${a.last_name}`,
      a.email,
      a.jobs?.title ?? '',
      a.stage,
      a.score?.toString() ?? '',
      new Date(a.created_at).toLocaleDateString(),
      a.location ?? '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const hasBulkSelection = selected.size > 0
  const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors disabled:opacity-40 whitespace-nowrap'

  return (
    <div>
      {/* Slide-over preview */}
      <ApplicantSlideOver
        applicantId={previewId}
        onClose={() => setPreviewId(null)}
        onRefresh={() => router.refresh()}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${toast.ok ? 'bg-brand' : 'bg-red-500'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Email composer modal */}
      {emailModal && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEmailModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-[#1A2A1E]">Send email</h2>
                <p className="text-xs text-[#9FB5A9] mt-0.5">{selected.size} recipient{selected.size !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setEmailModal(false)} className="p-1.5 rounded-lg text-[#9FB5A9] hover:text-[#1A2A1E] hover:bg-[#F4F7F5] transition-colors">
                <X size={16} />
              </button>
            </div>

            <select
              value={emailTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#D8E8E0] text-[#637A6F] focus:outline-none focus:border-brand bg-white"
            >
              <option value="">— Use a template (optional) —</option>
              {EMAIL_TEMPLATES.map((t) => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>

            <div className="px-3 py-2 bg-[#F4F7F5] rounded-lg text-xs text-[#637A6F]">
              Use <code className="font-mono text-brand bg-white px-1 py-0.5 rounded border border-[#D8E8E0]">{'{first_name}'}</code> and{' '}
              <code className="font-mono text-brand bg-white px-1 py-0.5 rounded border border-[#D8E8E0]">{'{last_name}'}</code> to personalize.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#637A6F] mb-1">Subject</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Update on your KoreLabs application"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#D8E8E0] text-[#1A2A1E] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[#C5D9CE]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#637A6F] mb-1">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={'Hi {first_name},\n\n...'}
                  rows={9}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#D8E8E0] text-[#1A2A1E] resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[#C5D9CE]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={sendBulkEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                {emailSending ? 'Sending…' : `Send to ${selected.size}`}
              </button>
              <button
                onClick={() => setEmailModal(false)}
                className="px-4 py-2.5 rounded-lg border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        {/* Always-visible search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9FB5A9] pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#1A2A1E] placeholder:text-[#C5D9CE] focus:outline-none focus:border-brand"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors"
        >
          <Filter size={14} />
          Filters
          {(currentParams.stage || currentParams.score_min || currentParams.score_max) && (
            <span className="w-2 h-2 rounded-full bg-brand" />
          )}
        </button>

        <select
          value={currentParams.stage ?? ''}
          onChange={(e) => navigate({ stage: e.target.value || undefined })}
          className="px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] focus:outline-none focus:border-brand"
        >
          <option value="">All stages</option>
          {stageOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={currentParams.sort ?? 'date_desc'}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] focus:outline-none focus:border-brand"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="name_asc">Name (A–Z)</option>
          <option value="score_desc">Score (high–low)</option>
          <option value="score_asc">Score (low–high)</option>
          <option value="stage">Stage</option>
        </select>

        {(currentParams.stage || currentParams.score_min || currentParams.score_max || currentParams.search) && (
          <button
            onClick={() => {
              setSearchValue('')
              navigate({ stage: undefined, score_min: undefined, score_max: undefined, search: undefined })
            }}
            className="text-xs text-[#9FB5A9] hover:text-red-500 transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
          <span className="text-xs text-[#9FB5A9]">{totalCount} total</span>
        </div>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white rounded-xl border border-[#D8E8E0] flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-xs text-[#9FB5A9] block mb-1">Score range</label>
            <div className="flex items-center gap-2">
              <input
                type="number" placeholder="Min" min={0} max={36}
                defaultValue={currentParams.score_min}
                onBlur={(e) => navigate({ score_min: e.target.value || undefined })}
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand"
              />
              <span className="text-[#9FB5A9] text-xs">–</span>
              <input
                type="number" placeholder="Max" min={0} max={36}
                defaultValue={currentParams.score_max}
                onBlur={(e) => navigate({ score_max: e.target.value || undefined })}
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {hasBulkSelection && (
        <div className="mb-4 px-4 py-3 bg-[#1A2A1E] text-white rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm font-medium mr-1 shrink-0">
              <Users size={14} />
              {selected.size} selected
            </span>

            <div className="w-px h-5 bg-white/20 shrink-0" />

            <button onClick={sendToHiringManager} disabled={bulkLoading} className={btnBase}>
              <Send size={12} /> Hiring manager
            </button>
            <button onClick={() => bulkAction('mark_accepted')} disabled={bulkLoading} className={btnBase}>
              <CheckCircle size={12} /> Accept
            </button>
            <button onClick={() => bulkAction('resend_assessment')} disabled={bulkLoading} className={btnBase}>
              <RefreshCw size={12} /> Re-send assessment
            </button>
            <button onClick={() => bulkAction('send_video_invite')} disabled={bulkLoading} className={btnBase}>
              <Video size={12} /> Video invite
            </button>

            {/* Move to any stage */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  bulkAction('move_stage', e.target.value)
                  e.target.value = ''
                }
              }}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white border border-white/20 disabled:opacity-40 cursor-pointer"
            >
              <option value="" disabled className="text-[#1A2A1E] bg-white">Move to stage…</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s} className="text-[#1A2A1E] bg-white">{STAGE_LABELS[s]}</option>
              ))}
            </select>

            <button onClick={() => bulkAction('reject_archive')} disabled={bulkLoading} className={`${btnBase} text-red-300 hover:bg-red-900/30`}>
              <XCircle size={12} /> Reject &amp; archive
            </button>

            <div className="w-px h-5 bg-white/20 shrink-0" />

            <button
              onClick={() => setEmailModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#1A2A1E] text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 shrink-0"
            >
              <Mail size={12} /> Send email…
            </button>

            <button onClick={() => setSelected(new Set())} className="text-xs text-white/40 hover:text-white transition-colors ml-auto shrink-0">
              Clear
            </button>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-8 text-center">
          <p className="text-[#9FB5A9]">No applications match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-[#D8E8E0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F7F5] border-b border-[#D8E8E0]">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === applications.length && applications.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#C5D9CE] accent-brand"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Days</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden xl:table-cell">Applied</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F7F3]">
                {applications.map((a) => {
                  const days = daysAgo(a.updated_at)
                  const isStuck = a.stage === 'assessment_sent' && days > 5
                  return (
                    <tr
                      key={a.id}
                      className={`group hover:bg-[#F8FBF9] transition-colors ${selected.has(a.id) ? 'bg-[#EEF6F1]' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggleSelect(a.id)}
                          className="rounded border-[#C5D9CE] accent-brand"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <Link href={`/admin/applications/${a.id}`} className="hover:text-brand transition-colors">
                              <span className="font-medium text-[#1A2A1E]">{a.first_name} {a.last_name}</span>
                            </Link>
                            <br />
                            <span className="text-xs text-[#9FB5A9]">{a.email}</span>
                          </div>
                          {a.notes && (
                            <span title="Has notes" className="text-[#C5D9CE] shrink-0">
                              <StickyNote size={12} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-[#637A6F]">
                        {(a.jobs as { title: string } | null)?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StageBadge stage={a.stage} />
                        {a.stage === 'assessment_video_done' && (
                          <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-0.5 ${a.video_count > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            <Video size={9} />
                            {a.video_count > 0 ? `${a.video_count} video${a.video_count !== 1 ? 's' : ''}` : 'no videos ⚠'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <ScoreBadge score={a.score} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className={`text-xs ${isStuck ? 'text-amber-600 font-medium' : 'text-[#9FB5A9]'}`}>
                          {days}d {isStuck && '⚠'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-[#9FB5A9] text-xs">
                        {formatRelative(a.created_at)}
                      </td>
                      {/* Row hover quick-actions */}
                      <td className="px-2 py-3.5">
                        <div className="hidden group-hover:flex items-center gap-0.5 justify-end">
                          <button
                            title="Quick preview"
                            onClick={() => setPreviewId(a.id)}
                            className="p-1.5 rounded-md text-[#9FB5A9] hover:text-brand hover:bg-[#EEF6F1] transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            title="Re-send assessment"
                            onClick={() => quickAction(a.id, 'resend_assessment')}
                            className="p-1.5 rounded-md text-[#9FB5A9] hover:text-brand hover:bg-[#EEF6F1] transition-colors"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            title="Send video invite"
                            onClick={() => quickAction(a.id, 'send_video_invite')}
                            className="p-1.5 rounded-md text-[#9FB5A9] hover:text-brand hover:bg-[#EEF6F1] transition-colors"
                          >
                            <Video size={13} />
                          </button>
                          <button
                            title="Put on hold"
                            onClick={() => quickAction(a.id, 'move_stage', 'on_hold')}
                            className="p-1.5 rounded-md text-[#9FB5A9] hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <PauseCircle size={13} />
                          </button>
                          <button
                            title="Archive"
                            onClick={() => quickAction(a.id, 'move_stage', 'archived')}
                            className="p-1.5 rounded-md text-[#9FB5A9] hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[#637A6F]">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => navigate({ page: String(currentPage - 1) })}
                  className="p-2 rounded-lg border border-[#D8E8E0] bg-white text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => navigate({ page: String(currentPage + 1) })}
                  className="p-2 rounded-lg border border-[#D8E8E0] bg-white text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
