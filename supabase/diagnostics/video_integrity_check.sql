-- ─── Video Integrity Diagnostic ──────────────────────────────────────────────
-- Run both queries in the Supabase SQL editor (read-only).
-- They identify applicants marked assessment_video_done with NO actual video
-- recordings in the videos table — i.e. they were mislabelled manually.
--
-- Do NOT run the corrective UPDATE at the bottom until you have reviewed
-- the list and decided on the correct stage for each person.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. How many are mislabelled?
SELECT COUNT(*) AS mislabelled_count
FROM   applicants
WHERE  stage = 'assessment_video_done'
  AND  NOT EXISTS (
         SELECT 1 FROM videos v WHERE v.applicant_id = applicants.id
       );

-- 2. Full list with details
SELECT
  a.id,
  a.first_name || ' ' || a.last_name  AS full_name,
  a.email,
  j.title                              AS role,
  a.stage,
  a.stage_updated_at,
  a.updated_at,
  COALESCE(
    (SELECT COUNT(*) FROM videos v WHERE v.applicant_id = a.id), 0
  )                                    AS video_count
FROM   applicants a
LEFT   JOIN jobs j ON j.id = a.job_id
WHERE  a.stage = 'assessment_video_done'
  AND  NOT EXISTS (
         SELECT 1 FROM videos v WHERE v.applicant_id = a.id
       )
ORDER  BY a.updated_at DESC;

-- ─── Corrective UPDATE — DO NOT RUN YET ─────────────────────────────────────
-- Review the list above first.  When you are ready, uncomment the block below
-- and choose the correct target stage for each person (likely 'assessment_sent'
-- if they never actually recorded, or check individually).
--
-- UPDATE applicants
-- SET    stage            = 'assessment_sent',  -- adjust per review
--        stage_updated_at = now()
-- WHERE  stage = 'assessment_video_done'
--   AND  NOT EXISTS (
--          SELECT 1 FROM videos v WHERE v.applicant_id = applicants.id
--        );
