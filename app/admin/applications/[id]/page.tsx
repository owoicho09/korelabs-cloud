import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAdminClient } from '@/lib/supabase/admin'
import { ApplicantDetail } from './ApplicantDetail'
import type { ApplicantStage } from '@/lib/types'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

async function getApplicant(id: string) {
  const db = getAdminClient()
  if (!db) return null

  const [{ data: applicant }, { data: assessment }, { data: emails }, { data: videos }] =
    await Promise.all([
      db.from('applicants').select('*, jobs(title, slug, department)').eq('id', id).single(),
      db.from('assessments').select('*, quiz_token').eq('applicant_id', id).maybeSingle(),
      db.from('email_log').select('*').eq('applicant_id', id).order('sent_at', { ascending: false }),
      db.from('videos').select('*').eq('applicant_id', id).order('question_index'),
    ])

  if (!applicant) return null

  const job = applicant.jobs as { title: string; slug: string; department: string } | null

  // CV signed URL (1h)
  let cvSignedUrl: string | null = null
  if (applicant.cv_path) {
    const { data: signed } = await db.storage.from('cvs').createSignedUrl(applicant.cv_path, 3600)
    cvSignedUrl = signed?.signedUrl ?? null
  }

  // Video signed URLs + question text
  const videoData: Array<{
    id: string
    question_index: number
    storage_path: string
    duration_seconds: number | null
    signed_url: string | null
    question_text: string
    created_at: string
  }> = []

  if (videos && videos.length > 0) {
    const { data: questions } = await db
      .from('video_questions')
      .select('question, order_index')
      .eq('department', job?.department ?? 'engineering-backend')
      .order('order_index')

    for (const video of videos) {
      const { data: signed } = await db.storage.from('videos').createSignedUrl(video.storage_path, 3600)
      const q = questions?.find((q) => q.order_index === video.question_index + 1)
      videoData.push({
        id: video.id,
        question_index: video.question_index,
        storage_path: video.storage_path,
        duration_seconds: video.duration_seconds,
        signed_url: signed?.signedUrl ?? null,
        question_text: q?.question ?? `Question ${video.question_index + 1}`,
        created_at: video.created_at,
      })
    }
  }

  // Quiz questions with answers for assessment breakdown
  let quizQuestions: Array<{
    id: string
    tier: string
    question: string
    options: string[]
    correct_index: number
    points: number
    order_index: number
  }> = []

  if (assessment?.answers && job?.slug) {
    const { data: qs } = await db
      .from('quiz_questions')
      .select('id, tier, question, options, correct_index, points, order_index')
      .eq('job_slug', job.slug)
      .order('order_index')
    quizQuestions = qs ?? []
  }

  return {
    applicant,
    assessment,
    emails: emails ?? [],
    videoData,
    quizQuestions,
    cvSignedUrl,
  }
}

export default async function ApplicantPage({ params }: Props) {
  const { id } = await params
  const data = await getApplicant(id)
  if (!data) notFound()

  return (
    <div className="p-4 sm:p-8">
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm text-[#637A6F] hover:text-[#1A2A1E] mb-6">
        <ArrowLeft size={14} />
        All applications
      </Link>

      <ApplicantDetail
        applicant={data.applicant as Parameters<typeof ApplicantDetail>[0]['applicant']}
        assessment={data.assessment}
        emails={data.emails}
        videoData={data.videoData}
        quizQuestions={data.quizQuestions}
        cvSignedUrl={data.cvSignedUrl}
      />
    </div>
  )
}
