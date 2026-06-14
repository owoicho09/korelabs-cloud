-- ============================================================
-- KoreLabs Cloud — Supabase SQL Editor Setup
-- ============================================================
-- Run in TWO steps. PostgreSQL requires ALTER TYPE ... ADD VALUE
-- to commit before the new values can be used in the same session.
--
-- STEP 1: Paste ONLY the block below, click Run, wait for success.
-- STEP 2: Paste the rest of this file and click Run.
-- ============================================================


-- ============================================================
-- STEP 1 — Enum values (run this alone first)
-- ============================================================

alter type applicant_stage add value if not exists 'assessment_video_done';
alter type applicant_stage add value if not exists 'under_review';
alter type applicant_stage add value if not exists 'accepted';
alter type applicant_stage add value if not exists 'on_hold';
alter type applicant_stage add value if not exists 'archived';


-- ============================================================
-- STEP 2 — Tables, columns, policies, seed data
--           (run AFTER step 1 has succeeded)
-- ============================================================

-- ── Migrate any old stage names that may exist ───────────────
update applicants set stage = 'under_review'          where stage = 'interview_scheduled';
update applicants set stage = 'under_review'          where stage = 'interviewed';
update applicants set stage = 'accepted'              where stage = 'hired';
update applicants set stage = 'assessment_video_done' where stage = 'assessment_done';

-- ── Extra columns on applicants ──────────────────────────────
alter table applicants add column if not exists nudge1_resend_id         text;
alter table applicants add column if not exists nudge2_resend_id         text;
alter table applicants add column if not exists video_reminder_resend_id text;
alter table applicants add column if not exists stage_updated_at         timestamptz;

update applicants set stage_updated_at = updated_at where stage_updated_at is null;

-- ── video_questions table ─────────────────────────────────────
-- One row per department: the single prompt shown to the candidate.

create table if not exists video_questions (
  id          uuid        primary key default uuid_generate_v4(),
  department  text        not null,
  question    text        not null,
  order_index integer     not null,
  max_seconds integer     not null default 90,
  created_at  timestamptz not null default now()
);

create index if not exists idx_video_questions_department on video_questions(department);

alter table video_questions enable row level security;

drop policy if exists "Service role manages video questions" on video_questions;
create policy "Service role manages video questions"
  on video_questions for all
  using (auth.role() = 'service_role');

-- ── videos table ─────────────────────────────────────────────
-- One row per uploaded video (now just one per applicant).

create table if not exists videos (
  id               uuid        primary key default uuid_generate_v4(),
  applicant_id     uuid        not null references applicants(id) on delete cascade,
  question_index   integer     not null,
  storage_path     text        not null,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

create index        if not exists idx_videos_applicant_id      on videos(applicant_id);
create unique index if not exists idx_videos_applicant_question on videos(applicant_id, question_index);

alter table videos enable row level security;

drop policy if exists "Service role manages videos" on videos;
create policy "Service role manages videos"
  on videos for all
  using (auth.role() = 'service_role');

-- ── Seed video prompts (idempotent) ──────────────────────────
-- Only the first question per department is shown (code does .limit(1)).
-- These are safe to re-run; the WHERE NOT EXISTS prevents duplicates.

insert into video_questions (department, question, order_index, max_seconds)
select * from (values
  ('engineering-backend',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('engineering-frontend',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('engineering-ai',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('engineering-security',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('engineering-devops',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('product-design',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90),

  ('operations',
   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?',
   1, 90)
) as v(department, question, order_index, max_seconds)
where not exists (
  select 1 from video_questions vq where vq.department = v.department
);

-- ── Storage bucket note ───────────────────────────────────────
-- You already created the 'videos' bucket — that is correct.
-- Public or private both work (the app uses signed URLs either way).
-- No further bucket configuration is needed.
