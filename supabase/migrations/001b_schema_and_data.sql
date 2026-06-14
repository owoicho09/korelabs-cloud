-- KoreLabs Cloud — Step B: Schema changes and data migration
-- Run this AFTER 001a_enum_values.sql has successfully committed.

-- Migrate existing rows to new stage names
update applicants set stage = 'under_review'          where stage = 'interview_scheduled';
update applicants set stage = 'under_review'          where stage = 'interviewed';
update applicants set stage = 'accepted'              where stage = 'hired';
update applicants set stage = 'assessment_video_done' where stage = 'assessment_done';

-- Add tracking columns to applicants
alter table applicants add column if not exists nudge1_resend_id         text;
alter table applicants add column if not exists nudge2_resend_id         text;
alter table applicants add column if not exists video_reminder_resend_id text;
alter table applicants add column if not exists stage_updated_at         timestamptz;

update applicants set stage_updated_at = updated_at where stage_updated_at is null;

-- video_questions table
create table if not exists video_questions (
  id          uuid primary key default uuid_generate_v4(),
  department  text not null,
  question    text not null,
  order_index integer not null,
  max_seconds integer not null default 90,
  created_at  timestamptz not null default now()
);

create index if not exists idx_video_questions_department on video_questions(department);

alter table video_questions enable row level security;

drop policy if exists "Service role manages video questions" on video_questions;
create policy "Service role manages video questions"
  on video_questions for all
  using (auth.role() = 'service_role');

-- videos table
create table if not exists videos (
  id               uuid primary key default uuid_generate_v4(),
  applicant_id     uuid not null references applicants(id) on delete cascade,
  question_index   integer not null,
  storage_path     text not null,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

create index        if not exists idx_videos_applicant_id       on videos(applicant_id);
create unique index if not exists idx_videos_applicant_question on videos(applicant_id, question_index);

alter table videos enable row level security;

drop policy if exists "Service role manages videos" on videos;
create policy "Service role manages videos"
  on videos for all
  using (auth.role() = 'service_role');

-- Seed video_questions (idempotent — skips departments already seeded)
insert into video_questions (department, question, order_index, max_seconds)
select * from (values
  ('engineering-backend',  'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-backend',  'Tell us about a time you had to design or rethink a system under real constraints — scale, reliability, latency, or otherwise. How did you approach it?', 2, 90),
  ('engineering-backend',  'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('engineering-frontend', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-frontend', 'How do you think about the line between a good UI and a great one? Tell us about a specific product decision that changed how you think about this.', 2, 90),
  ('engineering-frontend', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('engineering-ai',       'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-ai',       'Tell us about a time you took an ML model from experiment to production. What broke, what surprised you, and what would you do differently?', 2, 90),
  ('engineering-ai',       'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('engineering-security', 'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-security', 'Describe a security vulnerability you found or fixed that wasn''t obvious. How did you discover it and what did you do?', 2, 90),
  ('engineering-security', 'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('engineering-devops',   'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('engineering-devops',   'Tell us about the most complex infrastructure problem you''ve solved. What was failing, what was your diagnosis, and how did you fix it?', 2, 90),
  ('engineering-devops',   'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('product-design',       'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('product-design',       'Tell us about a design decision where the data said one thing and your instinct said another. How did you handle it?', 2, 90),
  ('product-design',       'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90),

  ('operations',           'Walk us through a project or piece of work you are genuinely proud of. What was hard about it and what did you learn?', 1, 90),
  ('operations',           'Tell us about a time you had to bring order to chaos in a fast-moving organisation. What was the situation and how did you approach it?', 2, 90),
  ('operations',           'Why KoreLabs specifically — what about this problem space excites you enough to want to work on it every day?', 3, 90)
) as v(department, question, order_index, max_seconds)
where not exists (
  select 1 from video_questions vq where vq.department = v.department
);
