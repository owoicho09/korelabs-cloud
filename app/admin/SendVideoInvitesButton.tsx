'use client'

import { useState } from 'react'
import { Video } from 'lucide-react'

export function SendVideoInvitesButton({ eligibleCount }: { eligibleCount: number }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ sent: number; total_eligible: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function send() {
    if (state === 'loading') return
    setState('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/send-video-invites', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setResult({ sent: json.sent, total_eligible: json.total_eligible })
      setState('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed')
      setState('error')
    }
  }

  if (state === 'done' && result) {
    return (
      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
        Sent {result.sent} video invite{result.sent !== 1 ? 's' : ''}.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={send}
        disabled={state === 'loading' || eligibleCount === 0}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
      >
        <Video size={14} />
        {state === 'loading' ? 'Sending…' : `Send video invite to all (${eligibleCount})`}
      </button>
      {state === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
