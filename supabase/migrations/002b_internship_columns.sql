-- KoreLabs Cloud — Internship stage, Step B
-- Run AFTER 002a_internship_enum.sql has succeeded.

alter table applicants add column if not exists internship_email_sent_at timestamptz;
alter table applicants add column if not exists internship_resend_id     text;

create index if not exists idx_applicants_stage_updated_at on applicants(stage, stage_updated_at);
