'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { PipelineJobType } from '@/lib/types'

interface EmailAction {
  type: PipelineJobType
  label: string
}

const EMAIL_ACTIONS: EmailAction[] = [
  { type: 'send_assessment', label: 'Assessment email' },
  { type: 'send_interview_invite', label: 'Interview invite' },
  { type: 'send_reminder_24h', label: '24h reminder' },
  { type: 'send_reminder_1h', label: '1h reminder' },
]

interface Props {
  applicantId: string
}

export function EmailTrigger({ applicantId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<PipelineJobType | null>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function trigger(type: PipelineJobType) {
    setBusy(type)
    setResult(null)
    try {
      const res = await fetch('/api/admin/trigger-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: applicantId, type }),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: json.detail ?? 'Sent' })
        router.refresh()
      } else {
        setResult({ ok: false, message: json.error ?? 'Failed' })
      }
    } catch {
      setResult({ ok: false, message: 'Network error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#D8E8E0] p-5 space-y-3">
      <div>
        <h3 className="font-medium text-[#1A2A1E] text-sm">Test email pipeline</h3>
        <p className="text-xs text-[#9FB5A9] mt-0.5">Sends immediately, bypassing the schedule</p>
      </div>

      <div className="space-y-2">
        {EMAIL_ACTIONS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => trigger(type)}
            disabled={busy !== null}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#D8E8E0] text-sm text-[#1A2A1E] hover:border-brand hover:text-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{label}</span>
            {busy === type && (
              <svg className="animate-spin h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {result && (
        <p className={`text-xs px-3 py-2 rounded-lg ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
