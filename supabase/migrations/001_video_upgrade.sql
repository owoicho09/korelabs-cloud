-- KoreLabs Cloud — Video Upgrade Migration
-- Run this in Supabase SQL editor BEFORE deploying the new code.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).

-- ─── 1. Extend applicant_stage enum ──────────────────────────────────────────
-- PostgreSQL does not support removing enum values, so we add new ones
-- and migrate existing rows. Old values are kept for safety during cutover.

alter type applicant_stage add value if not exists 'assessment_video_done';
alter type applicant_stage add value if not exists 'under_review';
alter type applicant_stage add value if not exists 'accepted';
alter type applicant_stage add value if not exists 'archived';

-- ─── 2. Migrate existing rows to new stage names ──────────────────────────────
-- Run inside a transaction so it's atomic.

begin;

-- interview_scheduled → under_review
update applicants set stage = 'under_review' where stage = 'interview_scheduled';
-- interviewed → under_review
update applicants set stage = 'under_review' where stage = 'interviewed';
-- hired → accepted
update applicants set stage = 'accepted' where stage = 'hired';
-- assessment_done → assessment_video_done (no video was recorded, but quiz was done)
update applicants set stage = 'assessment_video_done' where stage = 'assessment_done';

commit;

-- ─── 3. Add nudge & video tracking columns to applicants ─────────────────────

alter table applicants add column if not exists nudge1_resend_id text;
alter table applicants add column if not exists nudge2_resend_id text;
alter table applicants add column if not exists video_reminder_resend_id text;
alter table applicants add column if not exists stage_updated_at timestamptz;

-- Backfill stage_updated_at with updated_at for existing rows
update applicants set stage_updated_at = updated_at where stage_updated_at is null;

-- ─── 4. video_questions table ─────────────────────────────────────────────────

create table if not exists video_questions (
  id uuid primary key default uuid_generate_v4(),
  department text not null,
  question text not null,
  order_index integer not null,
  max_seconds integer not null default 90,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_questions_department on video_questions(department);

alter table video_questions enable row level security;

drop policy if exists "Service role manages video questions" on video_questions;
create policy "Service role manages video questions"
  on video_questions for all
  using (auth.role() = 'service_role');

-- ─── 5. videos table ──────────────────────────────────────────────────────────

create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  question_index integer not null,
  storage_path text not null,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_videos_applicant_id on videos(applicant_id);

alter table videos enable row level security;

drop policy if exists "Service role manages videos" on videos;
create policy "Service role manages videos"
  on videos for all
  using (auth.role() = 'service_role');

-- ─── 6. Seed video_questions ──────────────────────────────────────────────────
-- Idempotent: only inserts if department has no questions yet.

insert into video_questions (department, question, order_index, max_seconds)
select * from (values
  -- engineering-backend
  ('engineering-backend', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-backend', 'Tell us about a time you had to design or rethink a system under real constraints — scale, reliability, latency, or otherwise. How did you approach it?', 2, 90),
  ('engineering-backend', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- engineering-frontend
  ('engineering-frontend', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-frontend', 'How do you think about the line between a good UI and a great one? Tell us about a specific product decision that changed how you think about this.', 2, 90),
  ('engineering-frontend', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- engineering-ai
  ('engineering-ai', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-ai', 'Tell us about a time you took an ML model from experiment to production. What broke, what surprised you, and what would you do differently?', 2, 90),
  ('engineering-ai', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- engineering-security
  ('engineering-security', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-security', 'Describe a security vulnerability you found or fixed that wasn''t obvious. How did you discover it and what did you do?', 2, 90),
  ('engineering-security', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- engineering-devops
  ('engineering-devops', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-devops', 'Tell us about the most complex infrastructure problem you''ve solved. What was failing, what was your diagnosis, and how did you fix it?', 2, 90),
  ('engineering-devops', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- product-design
  ('product-design', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('product-design', 'Tell us about a design decision where the data said one thing and your instinct said another. How did you handle it?', 2, 90),
  ('product-design', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  -- operations
  ('operations', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('operations', 'Tell us about a time you had to bring order to chaos in a fast-moving organisation. What was the situation and how did you approach it?', 2, 90),
  ('operations', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90)
) as v(department, question, order_index, max_seconds)
where not exists (
  select 1 from video_questions vq where vq.department = v.department
);

-- ─── 7. Storage bucket (run manually or via Supabase dashboard) ───────────────
-- create bucket 'videos' with public = false
-- The bucket must be private. Signed URLs are generated server-side with 1-hour expiry.
-- Run in Supabase Storage UI or via the management API if not already created.
