import { getAdminClient } from '@/lib/supabase/admin'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'
import { KanbanBoard } from './KanbanBoard'

export const revalidate = 0

async function getPipelineData() {
  const db = getAdminClient()
  if (!db) return {}

  const { data } = await db
    .from('applicants')
    .select('id, first_name, last_name, stage, created_at, jobs(title)')
    .order('created_at', { ascending: false })

  const columns: Record<ApplicantStage, typeof data> = {} as Record<ApplicantStage, typeof data>
  for (const stage of PIPELINE_STAGES) {
    columns[stage] = (data ?? []).filter((a) => a.stage === stage)
  }

  return columns
}

export default async function PipelinePage() {
  const columns = await getPipelineData()

  return (
    <div className="p-8 h-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#1A2A1E]">Pipeline</h1>
        <p className="text-sm text-[#637A6F] mt-1">Drag cards to move applicants between stages</p>
      </div>
      <KanbanBoard initialColumns={columns} />
    </div>
  )
}
