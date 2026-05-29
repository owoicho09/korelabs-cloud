import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendInterviewConfirmationEmail } from '@/lib/email'
import { addHours } from 'date-fns'

export async function POST(req: Request) {
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { interview_id, slot_id } = await req.json()
    if (!interview_id || !slot_id) {
      return NextResponse.json({ error: 'interview_id and slot_id required' }, { status: 400 })
    }

    // Verify slot is still available
    const { data: slot } = await db
      .from('interview_slots')
      .select('*')
      .eq('id', slot_id)
      .eq('is_booked', false)
      .single()

    if (!slot) return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })

    // Mark slot as booked
    await db.from('interview_slots').update({ is_booked: true }).eq('id', slot_id)

    // Update interview
    const zoomLink = slot.zoom_link ?? process.env.ZOOM_INTERVIEW_LINK ?? ''
    const { data: interview } = await db
      .from('interviews')
      .update({
        slot_id,
        status: 'booked',
        zoom_link: zoomLink,
        booked_at: new Date().toISOString(),
      })
      .eq('id', interview_id)
      .select('*, applicants(*, jobs(title)), interview_slots(starts_at, duration_minutes)')
      .single()

    if (!interview) throw new Error('Interview not found')

    // Update applicant stage
    await db.from('applicants').update({ stage: 'interview_scheduled' }).eq('id', interview.applicant_id)

    const jobTitle = (interview.applicants?.jobs as { title: string } | null)?.title ?? 'the role'

    // Send confirmation email (best effort)
    sendInterviewConfirmationEmail(
      interview.applicants as Parameters<typeof sendInterviewConfirmationEmail>[0],
      interview as Parameters<typeof sendInterviewConfirmationEmail>[1],
      jobTitle
    ).catch(console.error)

    // Schedule reminder emails
    const slotTime = new Date(slot.starts_at)
    const reminder24h = new Date(slotTime.getTime() - 24 * 60 * 60 * 1000)
    const reminder1h = new Date(slotTime.getTime() - 60 * 60 * 1000)

    if (reminder24h > new Date()) {
      await db.from('pipeline_jobs').insert({
        applicant_id: interview.applicant_id,
        type: 'send_reminder_24h',
        scheduled_for: reminder24h.toISOString(),
      })
    }

    if (reminder1h > new Date()) {
      await db.from('pipeline_jobs').insert({
        applicant_id: interview.applicant_id,
        type: 'send_reminder_1h',
        scheduled_for: reminder1h.toISOString(),
      })
    }

    return NextResponse.json({ ok: true, interview })
  } catch (e) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}
