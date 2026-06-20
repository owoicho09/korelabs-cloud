'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Video, X } from 'lucide-react'

interface StuckCounts {
  assessment_stuck: { count: number; ids: string[] }
  video_pending: { count: number; ids: string[] }
  mislabelled_video: { count: number; ids: string[] }
}

interface Props {
  initial: StuckCounts
}

export function StuckBanner({ initial }: Props) {
  const [counts, setCounts] = useState<StuckCounts>({
    assessment_stuck: initial.assessment_stuck,
    video_pending: initial.video_pending,
    mislabelled_video: initial.mislabelled_video ?? { count: 0, ids: [] },
  })
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (dismissed) return null
  if (
    counts.assessment_stuck.count === 0 &&
    counts.video_pending.count === 0 &&
    counts.mislabelled_video.count === 0
  ) return null

  async function reengageAll(type: 'assessment' | 'video') {
    const ids = type === 'assessment' ? counts.assessment_stuck.ids : counts.video_pending.ids
    if (!ids.length) return
    setLoading(type)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_ids: ids,
          action: type === 'assessment' ? 'resend_assessment' : 'send_video_invite',
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage(`Sent to ${json.processed} applicant${json.processed !== 1 ? 's' : ''}${json.errors?.length ? `, ${json.errors.length} skipped` : ''}`)
        // Refresh counts from API
        fetch('/api/admin/stuck-counts')
          .then((r) => r.json())
          .then(setCounts)
      } else {
        setMessage(json.error ?? 'Failed')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <AlertTriangle size={14} />
          Needs attention
        </p>
        <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-700 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {counts.assessment_stuck.count > 0 && (
          <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <span className="text-amber-800">
              <strong>{counts.assessment_stuck.count}</strong> stuck in assessment
            </span>
            <button
              onClick={() => reengageAll('assessment')}
              disabled={loading !== null}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading === 'assessment' ? 'animate-spin' : ''} />
              Re-engage all
            </button>
          </div>
        )}

        {counts.video_pending.count > 0 && (
          <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <span className="text-amber-800">
              <strong>{counts.video_pending.count}</strong> awaiting video
            </span>
            <button
              onClick={() => reengageAll('video')}
              disabled={loading !== null}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Video size={11} className={loading === 'video' ? 'animate-spin' : ''} />
              Send video invite to all
            </button>
          </div>
        )}

        {counts.mislabelled_video.count > 0 && (
          <div className="flex items-center gap-3 bg-white border border-red-300 rounded-lg px-3 py-2 text-sm">
            <Video size={13} className="text-red-500 shrink-0" />
            <span className="text-red-800">
              <strong>{counts.mislabelled_video.count}</strong>{' '}
              {counts.mislabelled_video.count === 1 ? 'applicant' : 'applicants'} marked &ldquo;Video Done&rdquo; with no recordings
            </span>
            <Link
              href="/admin/applications?stage=assessment_video_done"
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors"
            >
              Review
            </Link>
          </div>
        )}
      </div>

      {message && <p className="text-xs text-amber-600 mt-2">{message}</p>}
    </div>
  )
}
