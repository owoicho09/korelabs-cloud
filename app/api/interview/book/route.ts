import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendInterviewConfirmationEmail, sendReminderEmail } from '@/lib/email'
import type { Applicant } from '@/lib/types'

export async function POST(req: Request) {
  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { interview_id, slot_id } = await req.json()
    if (!interview_id || !slot_id) {
      return NextResponse.json({ error: 'interview_id and slot_id required' }, { status: 400 })
    }

    // Atomically claim the slot — only succeeds if is_booked is still false,
    // preventing double-booking under concurrent requests.
    const { data: slot } = await db
      .from('interview_slots')
      .update({ is_booked: true })
      .eq('id', slot_id)
      .eq('is_booked', false)
      .select()
      .single()

    if (!slot) return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })

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
    const applicant = interview.applicants as unknown as Applicant

    // Send confirmation immediately
    await sendInterviewConfirmationEmail(
      applicant,
      interview as Parameters<typeof sendInterviewConfirmationEmail>[1],
      jobTitle
    )

    // Schedule reminder emails via Resend's native scheduledAt — no cron needed.
    const slotTime = new Date(slot.starts_at)
    const reminder24hAt = new Date(slotTime.getTime() - 24 * 60 * 60 * 1000)
    const reminder1hAt = new Date(slotTime.getTime() - 60 * 60 * 1000)
    const now = new Date()

    if (reminder24hAt > now) {
      await sendReminderEmail(
        applicant,
        interview as Parameters<typeof sendReminderEmail>[1],
        jobTitle,
        '24h',
        reminder24hAt.toISOString()
      )
    }

    if (reminder1hAt > now) {
      await sendReminderEmail(
        applicant,
        interview as Parameters<typeof sendReminderEmail>[1],
        jobTitle,
        '1h',
        reminder1hAt.toISOString()
      )
    }

    return NextResponse.json({ ok: true, interview })
  } catch (e) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}
