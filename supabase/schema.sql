-- KoreLabs Cloud — Full Database Schema
-- Run this in Supabase SQL editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type applicant_stage as enum (
  'received',
  'assessment_sent',
  'assessment_done',
  'interview_scheduled',
  'interviewed',
  'hired',
  'on_hold'
);

create type job_status as enum ('active', 'paused', 'closed');

create type pipeline_job_type as enum (
  'send_assessment',
  'send_interview_invite',
  'send_reminder_24h',
  'send_reminder_1h'
);

create type question_tier as enum ('fundamentals', 'applied', 'korelabs');

-- Updated at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Jobs table
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  department text not null,
  location text not null default 'Remote Europe',
  employment_type text not null default 'Full-time',
  salary_min integer not null,
  salary_max integer not null,
  currency text not null default 'EUR',
  description text not null,
  requirements text[] not null default '{}',
  benefits text[] not null default '{}',
  status job_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_jobs_slug on jobs(slug);
create index idx_jobs_status on jobs(status);

create trigger jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

-- Applicants table
create table applicants (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete restrict,
  tracking_token text not null unique default encode(gen_random_bytes(32), 'hex'),

  -- Personal info
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,

  -- Application content
  why_korelabs text not null,
  cv_path text,

  -- Pipeline
  stage applicant_stage not null default 'received',
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_applicants_job_id on applicants(job_id);
create index idx_applicants_tracking_token on applicants(tracking_token);
create index idx_applicants_email on applicants(email);
create index idx_applicants_stage on applicants(stage);

create trigger applicants_updated_at
  before update on applicants
  for each row execute function set_updated_at();

-- Quiz questions table
create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  job_slug text not null references jobs(slug) on delete cascade,
  tier question_tier not null,
  question text not null,
  options text[] not null,
  correct_index integer not null check (correct_index >= 0 and correct_index <= 3),
  explanation text not null,
  points integer not null default 1,
  order_index integer not null,
  created_at timestamptz not null default now()
);

create index idx_quiz_questions_job_slug on quiz_questions(job_slug);
create index idx_quiz_questions_tier on quiz_questions(tier);

-- Assessments table
create table assessments (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  quiz_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  answers jsonb,
  score integer,
  score_fundamentals integer,
  score_applied integer,
  score_korelabs integer,
  created_at timestamptz not null default now()
);

create index idx_assessments_applicant_id on assessments(applicant_id);
create index idx_assessments_quiz_token on assessments(quiz_token);

-- Interview slots table (available times admin creates)
create table interview_slots (
  id uuid primary key default uuid_generate_v4(),
  starts_at timestamptz not null,
  duration_minutes integer not null default 45,
  is_booked boolean not null default false,
  zoom_link text,
  created_at timestamptz not null default now()
);

create index idx_interview_slots_starts_at on interview_slots(starts_at);
create index idx_interview_slots_is_booked on interview_slots(is_booked);

-- Interviews table
create table interviews (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  slot_id uuid references interview_slots(id) on delete set null,
  booking_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  zoom_link text,
  status text not null default 'pending_booking',
  outcome text,
  interviewer_notes text,
  booked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_interviews_applicant_id on interviews(applicant_id);
create index idx_interviews_booking_token on interviews(booking_token);

create trigger interviews_updated_at
  before update on interviews
  for each row execute function set_updated_at();

-- Pipeline jobs (scheduled task queue)
create table pipeline_jobs (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  type pipeline_job_type not null,
  scheduled_for timestamptz not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index idx_pipeline_jobs_scheduled_for on pipeline_jobs(scheduled_for);
create index idx_pipeline_jobs_processed_at on pipeline_jobs(processed_at);
create index idx_pipeline_jobs_applicant_id on pipeline_jobs(applicant_id);

-- Email log
create table email_log (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid references applicants(id) on delete set null,
  to_email text not null,
  subject text not null,
  type text not null,
  resend_id text,
  error text,
  sent_at timestamptz not null default now()
);

create index idx_email_log_applicant_id on email_log(applicant_id);

-- Talent pool
create table talent_pool (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  role_interest text not null,
  intro text not null,
  cv_path text,
  created_at timestamptz not null default now()
);

create index idx_talent_pool_email on talent_pool(email);
create index idx_talent_pool_role_interest on talent_pool(role_interest);

-- RLS Policies
-- Enable RLS
alter table jobs enable row level security;
alter table applicants enable row level security;
alter table quiz_questions enable row level security;
alter table assessments enable row level security;
alter table interview_slots enable row level security;
alter table interviews enable row level security;
alter table pipeline_jobs enable row level security;
alter table email_log enable row level security;
alter table talent_pool enable row level security;

-- Jobs: public read for active jobs
create policy "Public can read active jobs"
  on jobs for select
  using (status = 'active');

-- Applicants: service role only (no direct client access)
create policy "Service role manages applicants"
  on applicants for all
  using (auth.role() = 'service_role');

-- Quiz questions: read via service role
create policy "Service role manages quiz questions"
  on quiz_questions for all
  using (auth.role() = 'service_role');

-- Assessments: service role only
create policy "Service role manages assessments"
  on assessments for all
  using (auth.role() = 'service_role');

-- Interview slots: service role
create policy "Service role manages interview slots"
  on interview_slots for all
  using (auth.role() = 'service_role');

-- Interviews: service role
create policy "Service role manages interviews"
  on interviews for all
  using (auth.role() = 'service_role');

-- Pipeline jobs: service role
create policy "Service role manages pipeline jobs"
  on pipeline_jobs for all
  using (auth.role() = 'service_role');

-- Email log: service role
create policy "Service role manages email log"
  on email_log for all
  using (auth.role() = 'service_role');

-- Talent pool: service role
create policy "Service role manages talent pool"
  on talent_pool for all
  using (auth.role() = 'service_role');

-- Storage bucket
-- Run separately: create bucket 'cvs' (private)
