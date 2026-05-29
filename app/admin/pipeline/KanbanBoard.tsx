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
import { StageBadge } from '@/components/ui/Badge'
import { formatRelative } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES } from '@/lib/types'

type Applicant = {
  id: string
  first_name: string
  last_name: string
  stage: string
  created_at: string
  jobs: { title: string } | null
}

interface Props {
  initialColumns: Record<string, Applicant[] | null>
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  applicant,
  overlay = false,
}: {
  applicant: Applicant
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: applicant.id,
    data: { applicant },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0 : 1 }}
      className={`mb-2 p-3 rounded-lg bg-white border border-[#D8E8E0] cursor-grab active:cursor-grabbing select-none ${
        overlay ? 'shadow-lg rotate-1' : 'hover:shadow-sm'
      } transition-shadow`}
    >
      <Link
        href={`/admin/applications/${applicant.id}`}
        className="block"
        onClick={(e) => {
          // Let the link fire only on a genuine click (no drag movement).
          // The PointerSensor distance constraint keeps this reliable.
          e.stopPropagation()
        }}
      >
        <p className="font-medium text-[#1A2A1E] text-xs hover:text-brand transition-colors">
          {applicant.first_name} {applicant.last_name}
        </p>
      </Link>
      <p className="text-[11px] text-[#9FB5A9] mt-0.5 truncate">
        {applicant.jobs?.title ?? '—'}
      </p>
      <p className="text-[10px] text-[#B0CBBC] mt-1">
        {formatRelative(applicant.created_at)}
      </p>
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  applicants,
}: {
  stage: ApplicantStage
  applicants: Applicant[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex-shrink-0 w-60">
      <div className="flex items-center justify-between mb-3 px-1">
        <StageBadge stage={stage} />
        <span className="text-xs text-[#9FB5A9]">{applicants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-xl p-2 transition-colors ${
          isOver
            ? 'bg-brand-50 border border-brand/30'
            : 'bg-[#F0F7F3]'
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
  const [columns, setColumns] = useState<Record<string, Applicant[]>>(
    Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s, initialColumns[s] ?? []])
    ) as Record<ApplicantStage, Applicant[]>
  )
  const [activeCard, setActiveCard] = useState<Applicant | null>(null)

  const sensors = useSensors(
    // Require 5 px of movement before a drag begins so link clicks still fire.
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
    setActiveCard((active.data.current?.applicant as Applicant) ?? null)
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null)
    if (!over) return

    const cardId = active.id as string
    // over.id is always a stage name — only columns are registered as droppables.
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
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            applicants={columns[stage] ?? []}
          />
        ))}
      </div>

      {/* Floating card preview shown while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeCard ? <KanbanCard applicant={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
