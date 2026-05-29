export type JobStatus = 'active' | 'paused' | 'closed'

export type ApplicantStage =
  | 'received'
  | 'assessment_sent'
  | 'assessment_done'
  | 'interview_scheduled'
  | 'interviewed'
  | 'hired'
  | 'on_hold'

export type PipelineJobType =
  | 'send_assessment'
  | 'send_interview_invite'
  | 'send_reminder_24h'
  | 'send_reminder_1h'

export type QuestionTier = 'fundamentals' | 'applied' | 'korelabs'

export interface Job {
  id: string
  slug: string
  title: string
  department: string
  location: string
  employment_type: string
  salary_min: number
  salary_max: number
  currency: string
  description: string
  requirements: string[]
  benefits: string[]
  status: JobStatus
  created_at: string
  updated_at: string
}

export interface Applicant {
  id: string
  job_id: string
  tracking_token: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  why_korelabs: string
  cv_path: string | null
  stage: ApplicantStage
  notes: string | null
  created_at: string
  updated_at: string
  job?: Job
}

export interface Assessment {
  id: string
  applicant_id: string
  quiz_token: string
  expires_at: string
  started_at: string | null
  completed_at: string | null
  answers: Record<string, number> | null
  score: number | null
  score_fundamentals: number | null
  score_applied: number | null
  score_korelabs: number | null
  created_at: string
}

export interface QuizQuestion {
  id: string
  job_slug: string
  tier: QuestionTier
  question: string
  options: string[]
  correct_index: number
  explanation: string
  points: number
  order_index: number
  created_at: string
}

export interface InterviewSlot {
  id: string
  starts_at: string
  duration_minutes: number
  is_booked: boolean
  zoom_link: string | null
  created_at: string
}

export interface Interview {
  id: string
  applicant_id: string
  slot_id: string | null
  booking_token: string
  zoom_link: string | null
  status: string
  outcome: string | null
  interviewer_notes: string | null
  booked_at: string | null
  created_at: string
  updated_at: string
  slot?: InterviewSlot
  applicant?: Applicant
}

export interface PipelineJob {
  id: string
  applicant_id: string
  type: PipelineJobType
  scheduled_for: string
  processed_at: string | null
  error: string | null
  created_at: string
}

export interface EmailLog {
  id: string
  applicant_id: string | null
  to_email: string
  subject: string
  type: string
  resend_id: string | null
  error: string | null
  sent_at: string
}

export interface TalentPool {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role_interest: string
  intro: string
  cv_path: string | null
  created_at: string
}

export interface ApplicationFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  why_korelabs: string
  cv: File
}

export interface TalentPoolFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  role_interest: string
  intro: string
  cv?: File
}

export interface AdminStats {
  total_applications: number
  applications_this_week: number
  interviews_this_week: number
  stage_counts: Record<ApplicantStage, number>
  applications_by_role: Array<{ title: string; count: number }>
}

export const STAGE_LABELS: Record<ApplicantStage, string> = {
  received: 'Received',
  assessment_sent: 'Assessment Sent',
  assessment_done: 'Assessment Done',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  hired: 'Hired',
  on_hold: 'On Hold',
}

export const PIPELINE_STAGES: ApplicantStage[] = [
  'received',
  'assessment_sent',
  'assessment_done',
  'interview_scheduled',
  'interviewed',
  'hired',
  'on_hold',
]
