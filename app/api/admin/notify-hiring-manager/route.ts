import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendHiringManagerSingle, sendHiringManagerBatch } from '@/lib/email'
import type { Applicant, Assessment, Video } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function buildApplicantData(applicantId: string) {
  const db = getAdminClient()
  if (!db) return null

  const [{ data: applicant }, { data: assessment }, { data: videos }] = await Promise.all([
    db.from('applicants').select('*, jobs(title, slug, department)').eq('id', applicantId).single(),
    db.from('assessments').select('*').eq('applicant_id', applicantId).maybeSingle(),
    db.from('videos').select('*').eq('applicant_id', applicantId).order('question_index'),
  ])

  if (!applicant) return null

  const job = applicant.jobs as { title: string; department: string } | null
  const roleTitle = job?.title ?? 'the role'
  const department = job?.department ?? 'general'

  // CV signed URL (24h expiry)
  let cvSignedUrl: string | null = null
  if (applicant.cv_path) {
    const { data: signed } = await db.storage.from('cvs').createSignedUrl(applicant.cv_path, 86400)
    cvSignedUrl = signed?.signedUrl ?? null
  }

  // Video signed URLs with question text
  const videoSignedUrls: Array<{ question: string; url: string; duration: number | null }> = []
  if (videos && videos.length > 0) {
    const { data: questions } = await db
      .from('video_questions')
      .select('question, order_index')
      .eq('department', department)
      .order('order_index')

    for (const video of videos as Video[]) {
      const { data: signed } = await db.storage.from('videos').createSignedUrl(video.storage_path, 86400)
      if (signed?.signedUrl) {
        const q = questions?.find((q) => q.order_index === video.question_index + 1)
        videoSignedUrls.push({
          question: q?.question ?? `Question ${video.question_index + 1}`,
          url: signed.signedUrl,
          duration: video.duration_seconds,
        })
      }
    }
  }

  return {
    applicant: applicant as unknown as Applicant,
    roleTitle,
    assessment: assessment as Assessment | null,
    cvSignedUrl,
    videoSignedUrls,
    adminProfileUrl: `${APP_URL}/admin/applications/${applicantId}`,
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const body = await req.json()
    const isBulk = Array.isArray(body.applicant_ids) && body.applicant_ids.length > 0
    const isSingle = typeof body.applicant_id === 'string'

    if (!isBulk && !isSingle) {
      return NextResponse.json({ error: 'Provide applicant_id or applicant_ids' }, { status: 400 })
    }

    const ids: string[] = isBulk ? body.applicant_ids : [body.applicant_id]

    const dataList = await Promise.all(ids.map((id) => buildApplicantData(id)))
    const valid = dataList.filter(Boolean) as NonNullable<typeof dataList[0]>[]

    if (valid.length === 0) {
      return NextResponse.json({ error: 'No valid applicants found' }, { status: 404 })
    }

    if (valid.length === 1 && isSingle) {
      await sendHiringManagerSingle(valid[0])
    } else {
      await sendHiringManagerBatch(valid)
    }

    // Only advance stage for applicants currently at assessment_video_done
    const eligibleForAdvance = valid
      .filter((d) => (d.applicant.stage as unknown as string) === 'assessment_video_done')
      .map((d) => d.applicant.id)

    if (eligibleForAdvance.length > 0) {
      await db
        .from('applicants')
        .update({ stage: 'under_review', stage_updated_at: new Date().toISOString() })
        .in('id', eligibleForAdvance)
    }

    return NextResponse.json({ ok: true, count: valid.length, stage_advanced: eligibleForAdvance.length })
  } catch (e) {
    console.error('[notify-hiring-manager] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
