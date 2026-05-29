'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PIPELINE_STAGES, STAGE_LABELS, type ApplicantStage } from '@/lib/types'

interface Props {
  applicantId: string
  currentStage: ApplicantStage
}

export function StageControls({ applicantId, currentStage }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<ApplicantStage>(currentStage)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')

  async function updateStage() {
    setSaving(true)
    try {
      await fetch(`/api/admin/applications/${applicantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: selected, notes: notes || undefined }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#D8E8E0] p-5 space-y-4">
      <h3 className="font-medium text-[#1A2A1E] text-sm">Update stage</h3>

      <div className="space-y-1">
        {PIPELINE_STAGES.map((stage) => (
          <label
            key={stage}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
              selected === stage
                ? 'bg-brand-50 text-brand'
                : 'text-[#637A6F] hover:bg-[#F4F7F5]'
            }`}
          >
            <input
              type="radio"
              name="stage"
              value={stage}
              checked={selected === stage}
              onChange={() => setSelected(stage)}
              className="sr-only"
            />
            <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${
              selected === stage ? 'bg-brand border-brand' : 'border-[#C5D9CE]'
            }`} />
            {STAGE_LABELS[stage]}
          </label>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes (optional)"
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-[#D8E8E0] text-[#1A2A1E] resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[#9FB5A9]"
      />

      <Button
        onClick={updateStage}
        loading={saving}
        disabled={selected === currentStage && !notes}
        size="sm"
        className="w-full"
      >
        Save changes
      </Button>
    </div>
  )
}
