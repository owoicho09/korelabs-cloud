import { getAdminClient } from '@/lib/supabase/admin'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'
import { ApplicationsTable } from './ApplicationsTable'
import { StuckBanner } from './StuckBanner'

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
      id, first_name, last_name, email, stage, created_at, updated_at, location, notes,
      jobs(title, department),
      assessments(score, completed_at),
      videos(id)
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
    const videoCount = (a.videos as { id: string }[] | null)?.length ?? 0
    return { ...a, jobs: jobData, notes: (a as Record<string, unknown>).notes as string | null ?? null, score: assessment?.score ?? null, assessment_completed: !!assessment?.completed_at, video_count: videoCount }
  })

  const scoreMin = params.score_min ? parseInt(params.score_min) : null
  const scoreMax = params.score_max ? parseInt(params.score_max) : null
  if (scoreMin !== null) rows = rows.filter((r) => r.score !== null && r.score >= scoreMin)
  if (scoreMax !== null) rows = rows.filter((r) => r.score !== null && r.score <= scoreMax)

  if (sort === 'score_desc') rows = rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  if (sort === 'score_asc') rows = rows.sort((a, b) => (a.score ?? -1) - (b.score ?? -1))

  return rows
}

async function getStuckCounts() {
  const db = getAdminClient()
  const empty = {
    assessment_stuck: { count: 0, ids: [] as string[] },
    video_pending: { count: 0, ids: [] as string[] },
    mislabelled_video: { count: 0, ids: [] as string[] },
  }
  if (!db) return empty

  const [{ data: assessmentRows }, { data: videoRows }, { data: mislabelledRows }] = await Promise.all([
    db.from('applicants').select('id, assessments(completed_at)').eq('stage', 'assessment_sent'),
    db.from('applicants')
      .select('id, assessments(completed_at), videos(id)')
      .not('stage', 'in', '("received","assessment_video_done","accepted","archived")'),
    db.from('applicants')
      .select('id, videos(id)')
      .eq('stage', 'assessment_video_done'),
  ])

  const assessmentStuckIds = (assessmentRows ?? [])
    .filter((a) => {
      const asses = a.assessments as { completed_at: string | null }[] | null
      return !asses?.some((x) => x.completed_at)
    })
    .map((a) => a.id)

  const videoPendingIds = (videoRows ?? [])
    .filter((a) => {
      const asses = a.assessments as { completed_at: string | null }[] | null
      const vids = a.videos as { id: string }[] | null
      return asses?.some((x) => x.completed_at) && !(vids?.length)
    })
    .map((a) => a.id)

  const mislabelledIds = (mislabelledRows ?? [])
    .filter((a) => {
      const vids = a.videos as { id: string }[] | null
      return !(vids?.length)
    })
    .map((a) => a.id)

  return {
    assessment_stuck: { count: assessmentStuckIds.length, ids: assessmentStuckIds },
    video_pending: { count: videoPendingIds.length, ids: videoPendingIds },
    mislabelled_video: { count: mislabelledIds.length, ids: mislabelledIds },
  }
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams
  const [applications, stuckCounts] = await Promise.all([
    getApplications(params),
    getStuckCounts(),
  ])

  const page = parseInt(params.page ?? '1')
  const perPage = 50
  const totalPages = Math.ceil(applications.length / perPage)
  const paged = applications.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[#1A2A1E]">Applications</h1>
          <p className="text-sm text-[#637A6F] mt-1">{applications.length} total</p>
        </div>
      </div>

      <StuckBanner initial={stuckCounts} />

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
