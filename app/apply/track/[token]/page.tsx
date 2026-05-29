import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { StageBadge } from '@/components/ui/Badge'
import { getAdminClient } from '@/lib/supabase/admin'
import { formatRelative } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'

export const metadata: Metadata = { title: 'Application status' }

interface Props {
  params: Promise<{ token: string }>
}

async function getApplicant(token: string) {
  const db = getAdminClient()
  if (!db) return null

  const { data } = await db
    .from('applicants')
    .select('*, jobs(title, slug, department)')
    .eq('tracking_token', token)
    .single()

  return data
}

export default async function TrackPage({ params }: Props) {
  const { token } = await params
  const applicant = await getApplicant(token)

  if (!applicant) notFound()

  const job = applicant.jobs as { title: string; slug: string; department: string } | null
  const currentStageIndex = PIPELINE_STAGES.indexOf(applicant.stage as ApplicantStage)
  const activeStages: ApplicantStage[] = ['received', 'assessment_sent', 'assessment_done', 'interview_scheduled', 'interviewed', 'hired']

  return (
    <>
      <Header />

      <section className="pt-32 pb-24">
        <div className="container max-w-xl">
          <AnimatedSection>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Application tracker</p>
              <h1 className="font-display text-[32px] md:text-[40px] text-[#1A2A1E] leading-tight mb-2">
                Hi, {applicant.first_name}.
              </h1>
              <p className="text-[#637A6F]">
                Tracking your application for <strong className="text-[#1A2A1E]">{job?.title ?? 'a role'}</strong> at KoreLabs.
              </p>
            </div>
          </AnimatedSection>

          {/* Current status card */}
          <AnimatedSection delay={0.08}>
            <div className="p-7 rounded-2xl bg-white border border-[#D8E8E0] mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-[#9FB5A9] mb-1">Current status</p>
                  <StageBadge stage={applicant.stage as ApplicantStage} />
                </div>
                <p className="text-xs text-[#9FB5A9]">
                  Applied {formatRelative(applicant.created_at)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-3">
                {activeStages.map((stage, i) => {
                  const isActive = stage === applicant.stage
                  const isPast = i < currentStageIndex
                  const isFuture = i > currentStageIndex

                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
                        isPast ? 'bg-brand text-white' :
                        isActive ? 'bg-brand text-white ring-4 ring-brand/20' :
                        'bg-[#F0F7F3] text-[#9FB5A9]'
                      }`}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${
                        isActive ? 'text-[#1A2A1E] font-medium' :
                        isPast ? 'text-[#637A6F]' : 'text-[#B0CBBC]'
                      }`}>
                        {STAGE_LABELS[stage]}
                      </span>
                      {isActive && (
                        <span className="text-xs text-brand ml-auto">← You are here</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* What happens next */}
          <AnimatedSection delay={0.14}>
            <div className="p-6 rounded-xl bg-[#F4FAF6] border border-brand/20">
              <h3 className="font-medium text-[#1A2A1E] mb-2 text-sm">What happens next</h3>
              <p className="text-sm text-[#637A6F]">
                {applicant.stage === 'received'
                  ? 'Your application is with our team. We will review it carefully and move you forward or send you an assessment within a few business days.'
                  : applicant.stage === 'assessment_sent'
                  ? 'You should have received an assessment link by email. Complete it within 48 hours to keep your application active.'
                  : applicant.stage === 'assessment_done'
                  ? 'We are reviewing your assessment. You will hear from us about an interview invitation shortly.'
                  : applicant.stage === 'interview_scheduled'
                  ? 'Your interview is confirmed. Check your email for the Zoom link and confirmation details.'
                  : applicant.stage === 'interviewed'
                  ? 'Your interview is complete. The team is reviewing and will be in touch with a decision soon.'
                  : applicant.stage === 'hired'
                  ? 'Congratulations — you have been offered a role at KoreLabs. Our team will be in touch with the details.'
                  : 'Your application is under review. We will be in touch.'}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.18}>
            <p className="text-xs text-[#9FB5A9] text-center mt-8">
              Questions? Email careers@korelabs.cloud with your application reference.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  )
}
