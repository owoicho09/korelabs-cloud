'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import Link from 'next/link'
import { StageBadge, ScoreBadge } from '@/components/ui/Badge'
import { daysAgo } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'
import { RefreshCw, CheckCircle, Archive, Video, Send, Eye } from 'lucide-react'

type KanbanApplicant = {
  id: string
  first_name: string
  last_name: string
  stage: string
  created_at: string
  updated_at: string
  score: number | null
  jobs: { title: string } | null
  video_count: number
}

interface Props {
  initialColumns: Record<string, KanbanApplicant[] | null>
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  applicant,
  overlay = false,
  onStageChange,
}: {
  applicant: KanbanApplicant
  overlay?: boolean
  onStageChange: (id: string, newStage: ApplicantStage) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: applicant.id,
    data: { applicant },
  })

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const days = daysAgo(applicant.updated_at)
  const isStuck = days > 10
  const isSlowing = days > 5 && !isStuck

  async function cardAction(e: React.MouseEvent, action: string, stage?: string) {
    e.stopPropagation()
    setActionLoading(action)
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: [applicant.id], action, ...(stage ? { stage } : {}) }),
      })
      const json = await res.json()
      if (res.ok) {
        setActionMsg('✓')
        if (stage) onStageChange(applicant.id, stage as ApplicantStage)
        if (action === 'mark_accepted') onStageChange(applicant.id, 'accepted')
        setTimeout(() => setActionMsg(null), 2000)
      } else {
        setActionMsg(json.error ?? '!')
        setTimeout(() => setActionMsg(null), 3000)
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function sendToHM(e: React.MouseEvent) {
    e.stopPropagation()
    setActionLoading('hm')
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/notify-hiring-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_id: applicant.id }),
      })
      const json = await res.json()
      if (res.ok) {
        setActionMsg('✓')
        onStageChange(applicant.id, 'under_review')
        setTimeout(() => setActionMsg(null), 2000)
      } else {
        setActionMsg(json.error ?? '!')
        setTimeout(() => setActionMsg(null), 3000)
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0 : 1 }}
      className={`group mb-2 p-3 rounded-lg bg-white border select-none transition-shadow ${
        overlay ? 'shadow-lg rotate-1 cursor-grabbing' : 'hover:shadow-sm cursor-grab active:cursor-grabbing'
      } ${isStuck ? 'border-red-200' : isSlowing ? 'border-amber-200' : 'border-[#D8E8E0]'}`}
    >
      <Link
        href={`/admin/applications/${applicant.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="font-medium text-[#1A2A1E] text-xs hover:text-brand transition-colors leading-snug">
          {applicant.first_name} {applicant.last_name}
        </p>
      </Link>
      <p className="text-[11px] text-[#9FB5A9] mt-0.5 truncate">{applicant.jobs?.title ?? '—'}</p>

      <div className="flex items-center justify-between mt-1.5">
        <ScoreBadge score={applicant.score} />
        <span className={`text-[10px] font-medium ${isStuck ? 'text-red-500' : isSlowing ? 'text-amber-500' : 'text-[#B0CBBC]'}`}>
          {days}d {isStuck ? '🔴' : isSlowing ? '🟡' : ''}
        </span>
      </div>

      {applicant.stage === 'assessment_video_done' && (
        <div className={`flex items-center gap-0.5 text-[9px] font-medium mt-1 ${applicant.video_count > 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
          <Video size={8} />
          {applicant.video_count > 0
            ? `${applicant.video_count} video${applicant.video_count > 1 ? 's' : ''}`
            : 'no videos ⚠'}
        </div>
      )}

      {/* Hover quick actions */}
      {!overlay && (
        <div
          className="hidden group-hover:flex items-center gap-0.5 mt-2 pt-1.5 border-t border-[#F0F7F3]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Link
            href={`/admin/applications/${applicant.id}`}
            title="View profile"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-[#EEF6F1] text-[#9FB5A9] hover:text-brand transition-colors"
          >
            <Eye size={11} />
          </Link>
          <button
            title="Send to hiring manager"
            disabled={!!actionLoading}
            onClick={sendToHM}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-[#EEF6F1] text-[#9FB5A9] hover:text-brand transition-colors disabled:opacity-40"
          >
            <Send size={11} />
          </button>
          <button
            title="Re-send assessment"
            disabled={!!actionLoading}
            onClick={(e) => cardAction(e, 'resend_assessment')}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-[#EEF6F1] text-[#9FB5A9] hover:text-brand transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={actionLoading === 'resend_assessment' ? 'animate-spin' : ''} />
          </button>
          <button
            title="Send video invite"
            disabled={!!actionLoading}
            onClick={(e) => cardAction(e, 'send_video_invite')}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-[#EEF6F1] text-[#9FB5A9] hover:text-brand transition-colors disabled:opacity-40"
          >
            <Video size={11} />
          </button>
          <button
            title="Mark as accepted"
            disabled={!!actionLoading}
            onClick={(e) => cardAction(e, 'mark_accepted')}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-emerald-50 text-[#9FB5A9] hover:text-emerald-600 transition-colors disabled:opacity-40"
          >
            <CheckCircle size={11} />
          </button>
          <button
            title="Archive"
            disabled={!!actionLoading}
            onClick={(e) => cardAction(e, 'move_stage', 'archived')}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center py-1 rounded hover:bg-red-50 text-[#9FB5A9] hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <Archive size={11} />
          </button>
        </div>
      )}

      {actionMsg && (
        <p className={`text-[10px] mt-1 text-center ${actionMsg === '✓' ? 'text-emerald-600' : 'text-red-500'}`}>
          {actionMsg}
        </p>
      )}
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  applicants,
  onStageChange,
}: {
  stage: ApplicantStage
  applicants: KanbanApplicant[]
  onStageChange: (id: string, newStage: ApplicantStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex-shrink-0 w-56">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <StageBadge stage={stage} />
        </div>
        <span className="text-xs text-[#9FB5A9] font-medium">{applicants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-xl p-2 transition-colors ${
          isOver ? 'bg-brand-50 border border-brand/30' : 'bg-[#F0F7F3]'
        }`}
      >
        {applicants.map((applicant) => (
          <KanbanCard
            key={applicant.id}
            applicant={applicant}
            onStageChange={onStageChange}
          />
        ))}
        {applicants.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-[#C5D9CE]">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Board ───────────────────────────────────────────────────────────────────

export function KanbanBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState<Record<string, KanbanApplicant[]>>(
    Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s, initialColumns[s] ?? []])
    ) as Record<ApplicantStage, KanbanApplicant[]>
  )
  const [activeCard, setActiveCard] = useState<KanbanApplicant | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function findStageOf(cardId: string): ApplicantStage | null {
    for (const stage of PIPELINE_STAGES) {
      if (columns[stage]?.some((a) => a.id === cardId)) return stage
    }
    return null
  }

  function onStageChange(cardId: string, newStage: ApplicantStage) {
    const sourceStage = findStageOf(cardId)
    if (!sourceStage || sourceStage === newStage) return

    const sourceList = [...(columns[sourceStage] ?? [])]
    const idx = sourceList.findIndex((a) => a.id === cardId)
    if (idx === -1) return
    const [moved] = sourceList.splice(idx, 1)

    setColumns((prev) => ({
      ...prev,
      [sourceStage]: sourceList,
      [newStage]: [{ ...moved, stage: newStage }, ...(prev[newStage] ?? [])],
    }))
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveCard((active.data.current?.applicant as KanbanApplicant) ?? null)
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null)
    if (!over) return

    const cardId = active.id as string
    const destStage = over.id as ApplicantStage
    const sourceStage = findStageOf(cardId)

    if (!sourceStage || sourceStage === destStage) return

    onStageChange(cardId, destStage)

    await fetch(`/api/admin/applications/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: destStage }),
    })
  }

  return (
    <div>
      {/* Stage legend */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PIPELINE_STAGES.map((s) => (
          <div key={s} className="text-xs text-[#9FB5A9] flex items-center gap-1">
            <span className="font-medium text-[#637A6F]">{columns[s]?.length ?? 0}</span> {STAGE_LABELS[s]}
          </div>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {PIPELINE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applicants={columns[stage] ?? []}
              onStageChange={onStageChange}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? <KanbanCard applicant={activeCard} overlay onStageChange={onStageChange} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
