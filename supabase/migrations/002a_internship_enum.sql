-- KoreLabs Cloud — Internship stage, Step A
-- Run this FIRST, on its own, in the Supabase SQL editor.
-- (ALTER TYPE ... ADD VALUE must commit before the value can be used.)

alter type applicant_stage add value if not exists 'internship_offered' after 'assessment_video_done';
