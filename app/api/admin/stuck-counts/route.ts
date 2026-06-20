import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const [{ data: assessmentRows }, { data: videoRows }, { data: mislabelledRows }] = await Promise.all([
    // Stuck in assessment_sent with no completed assessment
    db.from('applicants')
      .select('id, assessments(completed_at)')
      .eq('stage', 'assessment_sent'),
    // Completed assessment but no video recorded, not yet in video_done/accepted/archived
    db.from('applicants')
      .select('id, assessments(completed_at), videos(id)')
      .not('stage', 'in', '("received","assessment_video_done","accepted","archived")'),
    // Marked video_done but have zero actual video rows — data integrity issue
    db.from('applicants')
      .select('id, videos(id)')
      .eq('stage', 'assessment_video_done'),
  ])

  const assessmentStuckIds = (assessmentRows ?? [])
    .filter((a) => {
      const asses = a.assessments as { completed_at: string | null }[] | null
      return !asses?.some((x) => x.completed_at)
    })
    .map((a) => a.id)

  const videoPendingIds = (videoRows ?? [])
    .filter((a) => {
      const asses = a.assessments as { completed_at: string | null }[] | null
      const vids = a.videos as { id: string }[] | null
      return asses?.some((x) => x.completed_at) && !(vids?.length)
    })
    .map((a) => a.id)

  const mislabelledIds = (mislabelledRows ?? [])
    .filter((a) => {
      const vids = a.videos as { id: string }[] | null
      return !(vids?.length)
    })
    .map((a) => a.id)

  return NextResponse.json({
    assessment_stuck: { count: assessmentStuckIds.length, ids: assessmentStuckIds },
    video_pending: { count: videoPendingIds.length, ids: videoPendingIds },
    mislabelled_video: { count: mislabelledIds.length, ids: mislabelledIds },
  })
}
