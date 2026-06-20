'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface OfferPayload {
  offer_letter: string | null
  contractor_agreement: string | null
  job_slug: string
  already_sent: boolean
  default_subject: string
  default_body: string
}

interface Props {
  applicantId: string
  onSent: () => void
}

type DocKey = 'offer' | 'contract'

const DOC_TABS: { key: DocKey; label: string; filename: string }[] = [
  { key: 'offer', label: 'Offer Letter', filename: 'offer-letter' },
  { key: 'contract', label: 'Contractor Agreement', filename: 'contractor-agreement' },
]

export function OfferTab({ applicantId, onSent }: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [offerLetter, setOfferLetter] = useState('')
  const [contractorAgreement, setContractorAgreement] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [missingOffer, setMissingOffer] = useState(false)
  const [missingContract, setMissingContract] = useState(false)
  const [jobSlug, setJobSlug] = useState('')

  const [activeDoc, setActiveDoc] = useState<DocKey>('offer')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/offer/${applicantId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: OfferPayload) => {
        if (d.already_sent) {
          setSent(true)
          return
        }
        setOfferLetter(d.offer_letter ?? '')
        setMissingOffer(!d.offer_letter)
        setContractorAgreement(d.contractor_agreement ?? '')
        setMissingContract(!d.contractor_agreement)
        setSubject(d.default_subject)
        setBody(d.default_body)
        setJobSlug(d.job_slug)
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Failed to load templates'))
      .finally(() => setLoading(false))
  }, [applicantId])

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/admin/offer/${applicantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_letter: offerLetter, contractor_agreement: contractorAgreement, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setSent(true)
      onSent()
      router.refresh()
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const canSend =
    offerLetter.trim().length > 0 &&
    contractorAgreement.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#9FB5A9]">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading templates…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={14} className="shrink-0" />
        {loadError}
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────────────

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="font-medium text-[#1A2A1E]">Offer sent</p>
          <p className="mt-1 text-sm text-[#9FB5A9]">Both documents delivered · Stage set to Accepted</p>
        </div>
      </div>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────────────────────

  const missingFiles = [missingOffer && 'offer-letter', missingContract && 'contractor-agreement'].filter(Boolean) as string[]

  return (
    <div className="space-y-5">
      {/* Missing template notice */}
      {missingFiles.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>
            No template found for{' '}
            {missingFiles.map((f, i) => (
              <span key={f}>
                {i > 0 && ', '}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">{f}</code>
              </span>
            ))}
            {' '}in{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">public/contracts/{jobSlug}/</code>.
            {' '}Add a{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">.txt</code>
            {' '}or{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">.docx</code>
            {' '}file there, or type the content below.
          </span>
        </div>
      )}

      {/* ── Document tabs ─────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex gap-1.5">
          {DOC_TABS.map(({ key, label }) => {
            const isPopulated = key === 'offer' ? offerLetter.trim().length > 0 : contractorAgreement.trim().length > 0
            return (
              <button
                key={key}
                onClick={() => setActiveDoc(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeDoc === key
                    ? 'bg-[#1A2A1E] text-white'
                    : 'bg-[#F4F7F5] text-[#637A6F] hover:bg-[#EEF6F1] hover:text-[#1A2A1E]'
                }`}
              >
                <FileText size={11} />
                {label}
                {isPopulated && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}
        </div>

        {/* Offer letter — kept mounted to preserve edits when switching tabs */}
        <div className={activeDoc === 'offer' ? 'block' : 'hidden'}>
          <textarea
            value={offerLetter}
            onChange={(e) => setOfferLetter(e.target.value)}
            placeholder="Paste or type the offer letter content here…"
            className="w-full resize-y rounded-xl border border-[#D8E8E0] bg-white px-4 py-3 font-mono text-sm leading-relaxed text-[#1A2A1E] placeholder:text-[#C5D9CE] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            style={{ minHeight: '360px' }}
          />
          <p className="mt-1.5 text-[11px] text-[#B0CBBC]">
            Attached as <span className="font-mono">KoreLabs-Offer-Letter-[name].docx</span>
          </p>
        </div>

        {/* Contractor agreement */}
        <div className={activeDoc === 'contract' ? 'block' : 'hidden'}>
          <textarea
            value={contractorAgreement}
            onChange={(e) => setContractorAgreement(e.target.value)}
            placeholder="Paste or type the contractor agreement content here…"
            className="w-full resize-y rounded-xl border border-[#D8E8E0] bg-white px-4 py-3 font-mono text-sm leading-relaxed text-[#1A2A1E] placeholder:text-[#C5D9CE] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            style={{ minHeight: '360px' }}
          />
          <p className="mt-1.5 text-[11px] text-[#B0CBBC]">
            Attached as <span className="font-mono">KoreLabs-Contractor-Agreement-[name].docx</span>
          </p>
        </div>
      </div>

      {/* ── Email composer ────────────────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-[#F0F7F3] pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9FB5A9]">Email to candidate</p>

        <div>
          <label className="mb-1 block text-xs text-[#9FB5A9]">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-[#D8E8E0] px-3 py-2.5 text-sm text-[#1A2A1E] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#9FB5A9]">Message body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-lg border border-[#D8E8E0] px-3 py-2.5 text-sm leading-relaxed text-[#1A2A1E] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <p className="text-[11px] text-[#B0CBBC]">
          From: KoreLabs Cloud HR &lt;hr@korelabs.cloud&gt; · Reply-to: hr@korelabs.cloud
        </p>
      </div>

      {/* ── Send ─────────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#F0F7F3] pt-4">
        {sendError && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {sendError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !canSend}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={14} />
                Send offer
              </>
            )}
          </button>

          {!canSend && !sending && (
            <p className="text-xs text-[#9FB5A9]">
              {!offerLetter.trim() || !contractorAgreement.trim()
                ? 'Both documents must have content before sending'
                : 'Fill in the subject and message to send'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
