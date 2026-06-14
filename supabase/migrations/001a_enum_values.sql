-- KoreLabs Cloud — Step A: Add new enum values
-- Run this FIRST, on its own, in the Supabase SQL editor.
-- Wait for success before running 001b_schema_and_data.sql.
--
-- Reason: PostgreSQL requires ALTER TYPE ... ADD VALUE to commit before
-- the new values can be referenced in DML in the same session.

alter type applicant_stage add value if not exists 'assessment_video_done';
alter type applicant_stage add value if not exists 'under_review';
alter type applicant_stage add value if not exists 'accepted';
alter type applicant_stage add value if not exists 'archived';
