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

type KanbanApplicant = {
  id: string
  first_name: string
  last_name: string
  stage: string
  created_at: string
  updated_at: string
  score: number | null
  jobs: { title: string } | null
}

interface Props {
  initialColumns: Record<string, KanbanApplicant[] | null>
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  applicant,
  overlay = false,
}: {
  applicant: KanbanApplicant
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: applicant.id,
    data: { applicant },
  })

  const days = daysAgo(applicant.updated_at)
  const isStuck = days > 10
  const isSlowing = days > 5 && !isStuck

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0 : 1 }}
      className={`mb-2 p-3 rounded-lg bg-white border cursor-grab active:cursor-grabbing select-none transition-shadow ${
        overlay ? 'shadow-lg rotate-1' : 'hover:shadow-sm'
      } ${isStuck ? 'border-red-200' : isSlowing ? 'border-amber-200' : 'border-[#D8E8E0]'}`}
    >
      <Link
        href={`/admin/applications/${applicant.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-medium text-[#1A2A1E] text-xs hover:text-brand transition-colors">
          {applicant.first_name} {applicant.last_name}
        </p>
      </Link>
      <p className="text-[11px] text-[#9FB5A9] mt-0.5 truncate">
        {applicant.jobs?.title ?? '—'}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <ScoreBadge score={applicant.score} />
        <span className={`text-[10px] font-medium ${isStuck ? 'text-red-500' : isSlowing ? 'text-amber-500' : 'text-[#B0CBBC]'}`}>
          {days}d {isStuck ? '🔴' : isSlowing ? '🟡' : ''}
        </span>
      </div>
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  applicants,
}: {
  stage: ApplicantStage
  applicants: KanbanApplicant[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex-shrink-0 w-56">
      <div className="flex items-center justify-between mb-3 px-1">
        <StageBadge stage={stage} />
        <span className="text-xs text-[#9FB5A9] font-medium">{applicants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-xl p-2 transition-colors ${
          isOver ? 'bg-brand-50 border border-brand/30' : 'bg-[#F0F7F3]'
        }`}
      >
        {applicants.map((applicant) => (
          <KanbanCard key={applicant.id} applicant={applicant} />
        ))}
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

    const sourceList = [...(columns[sourceStage] ?? [])]
    const destList = [...(columns[destStage] ?? [])]
    const cardIndex = sourceList.findIndex((a) => a.id === cardId)
    if (cardIndex === -1) return

    const [moved] = sourceList.splice(cardIndex, 1)
    destList.unshift({ ...moved, stage: destStage })

    setColumns((prev) => ({
      ...prev,
      [sourceStage]: sourceList,
      [destStage]: destList,
    }))

    await fetch(`/api/admin/applications/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: destStage }),
    })
  }

  return (
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
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <KanbanCard applicant={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
