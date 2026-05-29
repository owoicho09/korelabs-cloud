'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import Link from 'next/link'
import { StageBadge } from '@/components/ui/Badge'
import { formatRelative } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'

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

export function KanbanBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState<Record<string, Applicant[]>>(
    Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s, initialColumns[s] ?? []])
    ) as Record<ApplicantStage, Applicant[]>
  )

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceStage = source.droppableId as ApplicantStage
    const destStage = destination.droppableId as ApplicantStage

    const sourceList = [...(columns[sourceStage] ?? [])]
    const destList = sourceStage === destStage ? sourceList : [...(columns[destStage] ?? [])]

    const [moved] = sourceList.splice(source.index, 1)
    destList.splice(destination.index, 0, { ...moved, stage: destStage })

    setColumns((prev) => ({
      ...prev,
      [sourceStage]: sourceList,
      [destStage]: destList,
    }))

    // Persist to API
    await fetch(`/api/admin/applications/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: destStage }),
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-60">
            <div className="flex items-center justify-between mb-3 px-1">
              <StageBadge stage={stage} />
              <span className="text-xs text-[#9FB5A9]">{columns[stage]?.length ?? 0}</span>
            </div>

            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] rounded-xl p-2 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-brand-50 border border-brand/30' : 'bg-[#F0F7F3]'
                  }`}
                >
                  {(columns[stage] ?? []).map((applicant, index) => (
                    <Draggable key={applicant.id} draggableId={applicant.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-2 p-3 rounded-lg bg-white border border-[#D8E8E0] cursor-grab active:cursor-grabbing transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-sm'
                          }`}
                        >
                          <Link href={`/admin/applications/${applicant.id}`} onClick={(e) => e.stopPropagation()}>
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
