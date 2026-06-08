import { getAdminClient } from '@/lib/supabase/admin'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'
import { ApplicationsTable } from './ApplicationsTable'

export const revalidate = 0

interface SearchParams {
  stage?: string
  search?: string
  sort?: string
  page?: string
  score_min?: string
  score_max?: string
  [key: string]: string | undefined
}

async function getApplications(params: SearchParams) {
  const db = getAdminClient()
  if (!db) return []

  let query = db
    .from('applicants')
    .select(`
      id, first_name, last_name, email, stage, created_at, updated_at, location,
      jobs(title, department),
      assessments(score, completed_at)
    `)

  if (params.stage && PIPELINE_STAGES.includes(params.stage as ApplicantStage)) {
    query = query.eq('stage', params.stage)
  }

  if (params.search) {
    const q = params.search
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const sort = params.sort ?? 'date_desc'
  if (sort === 'date_desc') query = query.order('created_at', { ascending: false })
  else if (sort === 'date_asc') query = query.order('created_at', { ascending: true })
  else if (sort === 'name_asc') query = query.order('first_name', { ascending: true })
  else if (sort === 'stage') query = query.order('stage', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query

  let rows = (data ?? []).map((a) => {
    const assessment = (a.assessments as unknown as { score: number | null; completed_at: string | null }[] | null)?.[0] ?? null
    const jobData = (Array.isArray(a.jobs) ? a.jobs[0] : a.jobs) as { title: string; department: string } | null
    return { ...a, jobs: jobData, score: assessment?.score ?? null, assessment_completed: !!assessment?.completed_at }
  })

  // Score filtering (done in JS since it's a joined field)
  const scoreMin = params.score_min ? parseInt(params.score_min) : null
  const scoreMax = params.score_max ? parseInt(params.score_max) : null
  if (scoreMin !== null) rows = rows.filter((r) => r.score !== null && r.score >= scoreMin)
  if (scoreMax !== null) rows = rows.filter((r) => r.score !== null && r.score <= scoreMax)

  // Score sort (done in JS)
  if (sort === 'score_desc') rows = rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  if (sort === 'score_asc') rows = rows.sort((a, b) => (a.score ?? -1) - (b.score ?? -1))

  return rows
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams
  const applications = await getApplications(params)

  const page = parseInt(params.page ?? '1')
  const perPage = 50
  const totalPages = Math.ceil(applications.length / perPage)
  const paged = applications.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[#1A2A1E]">Applications</h1>
          <p className="text-sm text-[#637A6F] mt-1">{applications.length} total</p>
        </div>
      </div>

      <ApplicationsTable
        applications={paged}
        totalCount={applications.length}
        currentPage={page}
        totalPages={totalPages}
        currentParams={params}
        stageOptions={PIPELINE_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
      />
    </div>
  )
}
