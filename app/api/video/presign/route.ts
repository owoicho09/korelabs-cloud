import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { quiz_token, question_index } = await req.json()

    if (!quiz_token || question_index === undefined) {
      return NextResponse.json({ error: 'Missing quiz_token or question_index' }, { status: 400 })
    }

    // Resolve applicant from quiz token
    const { data: assessment } = await db
      .from('assessments')
      .select('applicant_id, completed_at')
      .eq('quiz_token', quiz_token)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (!assessment.completed_at) return NextResponse.json({ error: 'Assessment not completed' }, { status: 422 })

    const storagePath = `${assessment.applicant_id}/${question_index}.webm`

    const { data: signed, error } = await db.storage
      .from('videos')
      .createSignedUploadUrl(storagePath)

    if (error || !signed) {
      console.error('[video/presign] createSignedUploadUrl failed:', error)
      return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: signed.signedUrl, storagePath })
  } catch (e) {
    console.error('[video/presign] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
