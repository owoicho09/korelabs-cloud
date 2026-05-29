import { getAdminClient } from '@/lib/supabase/admin'
import { STAGE_LABELS, type ApplicantStage } from '@/lib/types'
import { formatRelative } from '@/lib/utils'
import Link from 'next/link'
import { StageBadge } from '@/components/ui/Badge'
import { startOfWeek } from 'date-fns'

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
    { count: interviewsThisWeek },
  ] = await Promise.all([
    db.from('applicants').select('*', { count: 'exact', head: true }),
    db.from('applicants').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    db.from('applicants').select('stage'),
    db.from('applicants').select('id, first_name, last_name, stage, created_at, jobs(title)').order('created_at', { ascending: false }).limit(8),
    db.from('interviews').select('*', { count: 'exact', head: true }).eq('status', 'booked').gte('booked_at', weekStart),
  ])

  const stageCounts: Record<string, number> = {}
  for (const a of byStageFull ?? []) {
    stageCounts[a.stage] = (stageCounts[a.stage] ?? 0) + 1
  }

  return { total: total ?? 0, thisWeek: thisWeek ?? 0, interviewsThisWeek: interviewsThisWeek ?? 0, stageCounts, recent: recent ?? [] }
}

export default async function AdminOverview() {
  const data = await getDashboardData()

  const ORDERED_STAGES: ApplicantStage[] = ['received', 'assessment_sent', 'assessment_done', 'interview_scheduled', 'interviewed', 'hired', 'on_hold']

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
              { label: 'Interviews this week', value: data.interviewsThisWeek },
              { label: 'Hired', value: data.stageCounts['hired'] ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="p-5 rounded-xl bg-white border border-[#D8E8E0]">
                <div className="font-display text-3xl text-brand font-semibold">{value}</div>
                <div className="text-xs text-[#637A6F] mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pipeline stages */}
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <h2 className="font-medium text-[#1A2A1E] mb-5 text-sm">Pipeline stages</h2>
              <div className="space-y-3">
                {ORDERED_STAGES.map((stage) => {
                  const count = data.stageCounts[stage] ?? 0
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <StageBadge stage={stage} />
                      <span className="font-medium text-[#1A2A1E] text-sm">{count}</span>
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
