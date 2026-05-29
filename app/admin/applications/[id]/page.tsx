import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getAdminClient } from '@/lib/supabase/admin'
import { StageBadge } from '@/components/ui/Badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/types'
import { StageControls } from './StageControls'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

async function getApplicant(id: string) {
  const db = getAdminClient()
  if (!db) return null

  const [{ data: applicant }, { data: assessment }, { data: interview }, { data: emails }] =
    await Promise.all([
      db.from('applicants').select('*, jobs(title, slug, department)').eq('id', id).single(),
      db.from('assessments').select('*').eq('applicant_id', id).single(),
      db.from('interviews').select('*, interview_slots(starts_at, duration_minutes)').eq('applicant_id', id).single(),
      db.from('email_log').select('*').eq('applicant_id', id).order('sent_at', { ascending: false }),
    ])

  if (!applicant) return null

  let cvSignedUrl: string | null = null
  if (applicant.cv_path) {
    const { data: signed } = await db.storage
      .from('cvs')
      .createSignedUrl(applicant.cv_path, 3600)
    cvSignedUrl = signed?.signedUrl ?? null
  }

  return { applicant, assessment, interview, emails: emails ?? [], cvSignedUrl }
}

export default async function ApplicantPage({ params }: Props) {
  const { id } = await params
  const data = await getApplicant(id)
  if (!data) notFound()

  const { applicant, assessment, interview, emails, cvSignedUrl } = data
  const job = applicant.jobs as { title: string; slug: string } | null
  const slot = interview?.interview_slots as { starts_at: string } | null

  return (
    <div className="p-8">
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm text-[#637A6F] hover:text-[#1A2A1E] mb-6">
        <ArrowLeft size={14} />
        All applications
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-2xl text-[#1A2A1E]">
                  {applicant.first_name} {applicant.last_name}
                </h1>
                <p className="text-[#637A6F] text-sm mt-0.5">{job?.title} · Applied {formatDate(applicant.created_at)}</p>
              </div>
              <StageBadge stage={applicant.stage as ApplicantStage} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Email', value: applicant.email },
                { label: 'Phone', value: applicant.phone ?? '—' },
                { label: 'Location', value: applicant.location ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-[#9FB5A9] text-xs">{label}</span>
                  <p className="text-[#1A2A1E]">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-[#D8E8E0]">
              {applicant.linkedin_url && (
                <a href={applicant.linkedin_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                  LinkedIn <ExternalLink size={11} />
                </a>
              )}
              {applicant.github_url && (
                <a href={applicant.github_url} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                  GitHub <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Why KoreLabs */}
          <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
            <h2 className="font-medium text-[#1A2A1E] mb-3 text-sm">Why KoreLabs</h2>
            <p className="text-[15px] text-[#637A6F] leading-relaxed whitespace-pre-wrap">
              {applicant.why_korelabs}
            </p>
          </div>

          {/* CV viewer */}
          {cvSignedUrl && (
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-[#1A2A1E] text-sm">CV</h2>
                <a href={cvSignedUrl} target="_blank" rel="noopener" className="text-xs text-brand hover:underline flex items-center gap-1">
                  Open in new tab <ExternalLink size={11} />
                </a>
              </div>
              <iframe src={cvSignedUrl} className="w-full h-[600px] rounded-lg border border-[#D8E8E0]" title="CV" />
            </div>
          )}

          {/* Assessment */}
          {assessment && (
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <h2 className="font-medium text-[#1A2A1E] mb-4 text-sm">Assessment</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total score', value: assessment.score !== null ? `${assessment.score}/36` : 'Pending' },
                  { label: 'Fundamentals', value: assessment.score_fundamentals !== null ? `${assessment.score_fundamentals}/8` : '—' },
                  { label: 'Applied', value: assessment.score_applied !== null ? `${assessment.score_applied}/16` : '—' },
                  { label: 'KoreLabs', value: assessment.score_korelabs !== null ? `${assessment.score_korelabs}/12` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-[#F4F7F5] text-center">
                    <div className="font-display text-xl text-brand font-semibold">{value}</div>
                    <div className="text-xs text-[#637A6F] mt-1">{label}</div>
                  </div>
                ))}
              </div>
              {assessment.completed_at && (
                <p className="text-xs text-[#9FB5A9] mt-3">
                  Completed {formatDateTime(assessment.completed_at)}
                </p>
              )}
            </div>
          )}

          {/* Email log */}
          {emails.length > 0 && (
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-6">
              <h2 className="font-medium text-[#1A2A1E] mb-4 text-sm">Email history</h2>
              <div className="space-y-2">
                {emails.map((e) => (
                  <div key={e.id} className="flex items-start justify-between text-sm">
                    <div>
                      <span className="text-[#1A2A1E] font-medium">{e.subject}</span>
                      <span className="text-[#9FB5A9] ml-2 text-xs">({e.type})</span>
                    </div>
                    <span className="text-[#9FB5A9] text-xs whitespace-nowrap ml-4">{formatDate(e.sent_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <StageControls applicantId={applicant.id} currentStage={applicant.stage as ApplicantStage} />

          {interview && slot && (
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-5">
              <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Interview</h3>
              <p className="text-sm text-[#637A6F]">{formatDateTime(slot.starts_at)}</p>
              <p className="text-xs text-[#9FB5A9] mt-1">Status: {interview.status}</p>
            </div>
          )}

          {applicant.notes && (
            <div className="bg-white rounded-xl border border-[#D8E8E0] p-5">
              <h3 className="font-medium text-[#1A2A1E] text-sm mb-3">Notes</h3>
              <p className="text-sm text-[#637A6F] whitespace-pre-wrap">{applicant.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
