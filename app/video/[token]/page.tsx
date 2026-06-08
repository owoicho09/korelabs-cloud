import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { VideoRecorder } from './VideoRecorder'

export const metadata: Metadata = { title: 'Video Introduction — KoreLabs' }

interface Props {
  params: Promise<{ token: string }>
}

async function getVideoData(quizToken: string) {
  const db = getAdminClient()
  if (!db) return null

  const { data: assessment } = await db
    .from('assessments')
    .select('applicant_id, completed_at, applicants(first_name, jobs(title, department))')
    .eq('quiz_token', quizToken)
    .single()

  if (!assessment) return null
  if (!assessment.completed_at) {
    // Quiz not submitted yet — redirect not yet, just show a message
    return { quizNotDone: true }
  }

  const applicantData = assessment.applicants as unknown as {
    first_name: string
    jobs: { title: string; department: string } | null
  } | null

  const department = applicantData?.jobs?.department ?? 'engineering-backend'
  const firstName = applicantData?.first_name ?? 'there'
  const roleTitle = applicantData?.jobs?.title ?? 'the role'

  // Fetch video questions for this department
  const { data: questions } = await db
    .from('video_questions')
    .select('id, question, order_index, max_seconds')
    .eq('department', department)
    .order('order_index')

  if (!questions || questions.length === 0) {
    // Fall back to generic questions
    return {
      quizNotDone: false,
      firstName,
      roleTitle,
      quizToken,
      questions: [
        { id: '1', question: 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', order_index: 1, max_seconds: 90 },
        { id: '2', question: 'Tell us about a meaningful technical or craft decision you made. What did you consider and what did you choose?', order_index: 2, max_seconds: 90 },
        { id: '3', question: 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', order_index: 3, max_seconds: 90 },
      ],
    }
  }

  // Check how many videos already uploaded
  const { count } = await db
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('applicant_id', assessment.applicant_id)

  const alreadyComplete = (count ?? 0) >= 3

  return { quizNotDone: false, firstName, roleTitle, quizToken, questions, alreadyComplete }
}

export default async function VideoPage({ params }: Props) {
  const { token } = await params
  const data = await getVideoData(token)

  if (!data) notFound()

  if (data.quizNotDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl text-[#1A2A1E] mb-3">Complete your assessment first</h1>
          <p className="text-[#637A6F]">Please finish your written assessment before recording your video introduction.</p>
        </div>
      </div>
    )
  }

  if (data.alreadyComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5 mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a9270" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-[#1A2A1E] mb-3">Video already submitted.</h2>
          <p className="text-[#637A6F]">
            Thank you, {data.firstName}. Our hiring team will review your application and be in touch if your profile matches what we are looking for.
          </p>
        </div>
      </div>
    )
  }

  return (
    <VideoRecorder
      quizToken={token}
      firstName={data.firstName ?? 'there'}
      roleTitle={data.roleTitle ?? 'the role'}
      questions={(data.questions ?? []).map((q) => ({
        id: q.id,
        question: q.question,
        maxSeconds: q.max_seconds,
      }))}
    />
  )
}
