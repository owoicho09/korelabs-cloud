import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { getAdminClient } from '@/lib/supabase/admin'
import { STATIC_JOBS } from '@/lib/jobs'
import type { ApplicantStage } from '@/lib/types'
import { STAGE_LABELS } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Hiring stats',
  description: 'Live hiring metrics from the KoreLabs recruiting pipeline.',
}

export const revalidate = 300 // Revalidate every 5 minutes

async function getStats() {
  const db = getAdminClient()
  if (!db) {
    return { total: 0, stages: {} as Record<string, number>, byRole: [] as Array<{ title: string; count: number }> }
  }

  try {
    const { data: applicants } = await db
      .from('applicants')
      .select('stage, job_id, jobs(title)')

    if (!applicants) return { total: 0, stages: {}, byRole: [] }

    const stages: Record<string, number> = {}
    const roleMap: Record<string, number> = {}

    for (const a of applicants) {
      stages[a.stage] = (stages[a.stage] ?? 0) + 1
      const title = (a.jobs as unknown as { title: string } | null)?.title ?? 'Unknown'
      roleMap[title] = (roleMap[title] ?? 0) + 1
    }

    const byRole = Object.entries(roleMap).map(([title, count]) => ({ title, count }))

    return { total: applicants.length, stages, byRole }
  } catch {
    return { total: 0, stages: {}, byRole: [] }
  }
}

export default async function HiringPage() {
  const { total, stages, byRole } = await getStats()
  const openRoles = STATIC_JOBS.filter((j) => j.status === 'active').length

  const ORDERED_STAGES: ApplicantStage[] = [
    'received',
    'assessment_sent',
    'assessment_done',
    'interview_scheduled',
    'interviewed',
    'hired',
    'on_hold',
  ]

  return (
    <>
      <Header />

      <section className="pt-32 pb-16">
        <div className="container">
          <div className="max-w-2xl">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">Radical transparency</p>
              <h1 className="font-display text-[44px] md:text-[52px] text-[#1A2A1E] leading-tight mb-6">
                Our hiring pipeline, live.
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <p className="text-lg text-[#637A6F] leading-relaxed">
                We publish our hiring metrics because we think candidates deserve to know what they are getting into. These numbers update automatically and reflect the real state of our pipeline.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Top stats */}
      <section className="pb-16">
        <div className="container">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Total applications', value: total.toString() },
                { label: 'Open roles', value: openRoles.toString() },
                { label: 'Hired this cycle', value: (stages['hired'] ?? 0).toString() },
                { label: 'Active in pipeline', value: (total - (stages['hired'] ?? 0) - (stages['on_hold'] ?? 0)).toString() },
              ].map(({ label, value }) => (
                <div key={label} className="p-5 rounded-2xl bg-white border border-[#D8E8E0]">
                  <div className="font-display text-[32px] text-brand font-semibold">{value}</div>
                  <div className="text-xs text-[#637A6F] mt-1">{label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pipeline stages */}
            <AnimatedSection>
              <div className="p-7 rounded-2xl bg-white border border-[#D8E8E0]">
                <h2 className="font-display text-xl text-[#1A2A1E] mb-6">Pipeline stages</h2>
                <div className="space-y-3">
                  {ORDERED_STAGES.map((stage) => {
                    const count = stages[stage] ?? 0
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={stage}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-[#637A6F]">{STAGE_LABELS[stage]}</span>
                          <span className="font-medium text-[#1A2A1E]">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#F0F7F3]">
                          <div
                            className="h-full rounded-full bg-brand transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </AnimatedSection>

            {/* By role */}
            <AnimatedSection delay={0.08}>
              <div className="p-7 rounded-2xl bg-white border border-[#D8E8E0]">
                <h2 className="font-display text-xl text-[#1A2A1E] mb-6">Applications by role</h2>
                <div className="space-y-3">
                  {byRole.length === 0 ? (
                    <p className="text-sm text-[#9FB5A9]">No applications yet.</p>
                  ) : (
                    byRole
                      .sort((a, b) => b.count - a.count)
                      .map(({ title, count }) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <div key={title}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-[#637A6F] truncate">{title}</span>
                              <span className="font-medium text-[#1A2A1E] ml-4">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#F0F7F3]">
                              <div
                                className="h-full rounded-full bg-brand/60 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Methodology note */}
      <section className="pb-24">
        <div className="container">
          <AnimatedSection>
            <div className="max-w-2xl p-6 rounded-2xl bg-[#F4FAF6] border border-brand/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">A note on methodology</p>
              <p className="text-sm text-[#637A6F] leading-relaxed">
                These numbers reflect all applications since our current hiring cycle began. &quot;Active in pipeline&quot; excludes hired and on-hold candidates. Stage counts represent the current stage of each applicant — not cumulative totals. Numbers update every 5 minutes.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  )
}
