import { getAdminClient } from '@/lib/supabase/admin'
import { STAGE_LABELS, type ApplicantStage } from '@/lib/types'
import { formatRelative, daysAgo } from '@/lib/utils'
import Link from 'next/link'
import { StageBadge } from '@/components/ui/Badge'
import { startOfWeek } from 'date-fns'
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { SendVideoInvitesButton } from './SendVideoInvitesButton'

export const revalidate = 0

async function getDashboardData() {
  const db = getAdminClient()
  if (!db) return null

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

  const [
    { count: total },
    { count: thisWeek },
    { data: byStageFull },
    { data: recent },
    { count: accepted },
    { data: stuckAssessment },
    { data: awaitingReview },
    { data: needsVideoInvite },
  ] = await Promise.all([
    db.from('applicants').select('*', { count: 'exact', head: true }),
    db.from('applicants').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    db.from('applicants').select('stage, updated_at'),
    db.from('applicants').select('id, first_name, last_name, stage, created_at, jobs(title)').order('created_at', { ascending: false }).limit(8),
    db.from('applicants').select('*', { count: 'exact', head: true }).eq('stage', 'accepted').gte('updated_at', weekStart),
    // Stuck at assessment_sent for >5 days
    db.from('applicants')
      .select('id, first_name, last_name, email, updated_at, jobs(title)')
      .eq('stage', 'assessment_sent')
      .lt('updated_at', new Date(Date.now() - 5 * 86400000).toISOString())
      .order('updated_at')
      .limit(10),
    // At assessment_video_done awaiting review
    db.from('applicants')
      .select('id, first_name, last_name, updated_at, jobs(title)')
      .eq('stage', 'assessment_video_done')
      .order('updated_at')
      .limit(10),
    // Has completed assessment but no videos yet
    db.from('applicants')
      .select('id, assessments!inner(completed_at), videos(id)')
      .not('stage', 'in', '("accepted","archived")'),
  ])

  const stageCounts: Record<string, number> = {}
  const stageTimeTotals: Record<string, number> = {}
  const stageTimeCounts: Record<string, number> = {}
  for (const a of byStageFull ?? []) {
    stageCounts[a.stage] = (stageCounts[a.stage] ?? 0) + 1
    const days = daysAgo(a.updated_at)
    stageTimeTotals[a.stage] = (stageTimeTotals[a.stage] ?? 0) + days
    stageTimeCounts[a.stage] = (stageTimeCounts[a.stage] ?? 0) + 1
  }

  const eligibleForVideoInvite = (needsVideoInvite ?? []).filter((a) => {
    const assessments = a.assessments as { completed_at: string | null }[] | null
    const completed = assessments?.some((ass) => ass.completed_at)
    const hasVideos = (a.videos as { id: string }[] | null)?.length ?? 0
    return completed && hasVideos === 0
  }).length

  return {
    total: total ?? 0,
    thisWeek: thisWeek ?? 0,
    accepted: accepted ?? 0,
    stageCounts,
    stageTimeTotals,
    stageTimeCounts,
    recent: recent ?? [],
    stuckAssessment: stuckAssessment ?? [],
    awaitingReview: awaitingReview ?? [],
    eligibleForVideoInvite,
  }
}

const ORDERED_STAGES: ApplicantStage[] = [
  'received', 'assessment_sent', 'assessment_video_done', 'under_review', 'accepted', 'on_hold', 'archived',
]

export default async function AdminOverview() {
  const data = await getDashboardData()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#1A2A1E]">Hiring overview</h1>
        <p className="text-sm text-[#637A6F] mt-1">Live pipeline data</p>
      </div>

      {!data ? (
        <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Database not connected. Configure Supabase environment variables to see data.
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total applications', value: data.total },
              { label: 'This week', value: data.thisWeek },
              { label: 'Accepted this week', value: data.accepted },
              { label: 'Awaiting video review', value: data.stageCounts['assessment_video_done'] ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="p-5 rounded-xl bg-white border border-[#D8E8E0]">
                <div className="font-display text-3xl text-brand font-semibold">{value}</div>
                <div className="text-xs text-[#637A6F] mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Bulk video invite */}
          {data.eligibleForVideoInvite > 0 && (
            <div className="mb-6 p-5 bg-white border border-[#D8E8E0] rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#1A2A1E]">
                  {data.eligibleForVideoInvite} applicant{data.eligibleForVideoInvite !== 1 ? 's' : ''} completed the assessment but haven't recorded their video yet.
                </p>
                <p className="text-xs text-[#9FB5A9] mt-0.5">Send them their recording link in one click.</p>
              </div>
              <SendVideoInvitesButton eligibleCount={data.eligibleForVideoInvite} />
            </div>
          )}

          {/* Pipeline Intelligence Panel */}
          {(data.stuckAssessment.length > 0 || data.awaitingReview.length > 0) && (
            <div className="mb-6 grid lg:grid-cols-2 gap-4">
              {data.stuckAssessment.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <h2 className="font-medium text-amber-900 text-sm">Stuck in assessment ({data.stuckAssessment.length})</h2>
                    <span className="text-xs text-amber-600 ml-auto">&gt;5 days</span>
                  </div>
                  <div className="space-y-2">
                    {data.stuckAssessment.slice(0, 5).map((a) => (
                      <Link key={a.id} href={`/admin/applications/${a.id}`} className="flex items-center justify-between hover:opacity-80">
                        <div>
                          <p className="text-sm font-medium text-amber-900">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-amber-700">{(a.jobs as unknown as { title: string } | null)?.title}</p>
                        </div>
                        <span className="text-xs text-amber-600">{daysAgo(a.updated_at)}d</span>
                      </Link>
                    ))}
                  </div>
                  <Link href="/admin/applications?stage=assessment_sent" className="text-xs text-amber-700 hover:underline mt-3 block">
                    View all stuck →
                  </Link>
                </div>
              )}

              {data.awaitingReview.length > 0 && (
                <div className="bg-white border border-[#D8E8E0] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-brand" />
                    <h2 className="font-medium text-[#1A2A1E] text-sm">Awaiting review ({data.awaitingReview.length})</h2>
                    <span className="text-xs text-[#637A6F] ml-auto">Video done</span>
                  </div>
                  <div className="space-y-2">
                    {data.awaitingReview.slice(0, 5).map((a) => (
                      <Link key={a.id} href={`/admin/applications/${a.id}`} className="flex items-center justify-between hover:opacity-80">
                        <div>
                          <p className="text-sm font-medium text-[#1A2A1E]">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-[#9FB5A9]">{(a.jobs as unknown as { title: string } | null)?.title}</p>
                        </div>
                        <span className="text-xs text-[#637A6F]">{daysAgo(a.updated_at)}d</span>
                      </Link>
                    ))}
                  </div>
                  <Link href="/admin/applications?stage=assessment_video_done" className="text-xs text-brand hover:underline mt-3 block">
                    Review all →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pipeline stages */}
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <h2 className="font-medium text-[#1A2A1E] mb-5 text-sm">Pipeline stages</h2>
              <div className="space-y-3">
                {ORDERED_STAGES.filter((s) => s !== 'archived').map((stage) => {
                  const count = data.stageCounts[stage] ?? 0
                  const avgDays = data.stageTimeCounts[stage]
                    ? Math.round((data.stageTimeTotals[stage] ?? 0) / data.stageTimeCounts[stage])
                    : 0
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <StageBadge stage={stage} />
                      <div className="flex items-center gap-3 text-right">
                        {count > 0 && avgDays > 0 && (
                          <span className="text-xs text-[#9FB5A9]">avg {avgDays}d</span>
                        )}
                        <span className="font-medium text-[#1A2A1E] text-sm w-6 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent applications */}
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-medium text-[#1A2A1E] text-sm">Recent applications</h2>
                <Link href="/admin/applications" className="text-xs text-brand hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {data.recent.length === 0 ? (
                  <p className="text-sm text-[#9FB5A9]">No applications yet.</p>
                ) : (
                  data.recent.map((a) => (
                    <Link key={a.id} href={`/admin/applications/${a.id}`} className="flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A2A1E] group-hover:text-brand transition-colors">
                          {a.first_name} {a.last_name}
                        </p>
                        <p className="text-xs text-[#9FB5A9]">
                          {(a.jobs as unknown as { title: string } | null)?.title} · {formatRelative(a.created_at)}
                        </p>
                      </div>
                      <StageBadge stage={a.stage as ApplicantStage} />
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
