import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { QuizClient } from './QuizClient'

export const metadata: Metadata = { title: 'Assessment' }

interface Props {
  params: Promise<{ token: string }>
}

async function getQuizData(token: string) {
  const db = getAdminClient()
  if (!db) return null

  const { data: assessment } = await db
    .from('assessments')
    .select('*, applicants(first_name, job_id, jobs(slug, title))')
    .eq('quiz_token', token)
    .single()

  if (!assessment) return null
  if (assessment.completed_at) return { expired: true, completed: true }
  if (new Date(assessment.expires_at) < new Date()) return { expired: true, completed: false }

  const jobSlug = (assessment.applicants?.jobs as { slug: string } | null)?.slug
  if (!jobSlug) return null

  const { data: questions } = await db
    .from('quiz_questions')
    .select('id, tier, question, options, points, order_index')
    .eq('job_slug', jobSlug)
    .order('order_index')

  return {
    expired: false,
    completed: false,
    assessment,
    questions: questions ?? [],
    firstName: assessment.applicants?.first_name ?? 'there',
    jobTitle: (assessment.applicants?.jobs as { title: string } | null)?.title ?? 'the role',
  }
}

export default async function QuizPage({ params }: Props) {
  const { token } = await params
  const data = await getQuizData(token)

  if (!data) notFound()

  if (data.expired && data.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl text-[#1A2A1E] mb-3">Assessment already completed</h1>
          <p className="text-[#637A6F]">You have already submitted this assessment. We will be in touch soon.</p>
        </div>
      </div>
    )
  }

  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl text-[#1A2A1E] mb-3">Assessment link expired</h1>
          <p className="text-[#637A6F]">This link has expired. Please email careers@korelabs.cloud if you believe this is an error.</p>
        </div>
      </div>
    )
  }

  return (
    <QuizClient
      token={token}
      questions={data.questions ?? []}
      firstName={data.firstName ?? 'there'}
      jobTitle={data.jobTitle ?? 'the role'}
      assessmentId={data.assessment?.id}
    />
  )
}
