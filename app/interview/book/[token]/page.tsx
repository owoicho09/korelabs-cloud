import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { BookingClient } from './BookingClient'

export const metadata: Metadata = { title: 'Book interview slot' }

interface Props {
  params: Promise<{ token: string }>
}

async function getBookingData(token: string) {
  const db = getAdminClient()
  if (!db) return null

  const { data: interview } = await db
    .from('interviews')
    .select('*, applicants(first_name, jobs(title))')
    .eq('booking_token', token)
    .single()

  if (!interview) return null
  if (interview.booked_at) return { alreadyBooked: true }

  const { data: slots } = await db
    .from('interview_slots')
    .select('id, starts_at, duration_minutes')
    .eq('is_booked', false)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(20)

  return {
    alreadyBooked: false,
    interviewId: interview.id,
    firstName: (interview.applicants as { first_name: string } | null)?.first_name ?? 'there',
    jobTitle: (interview.applicants?.jobs as { title: string } | null)?.title ?? 'the role',
    slots: slots ?? [],
  }
}

export default async function BookingPage({ params }: Props) {
  const { token } = await params
  const data = await getBookingData(token)

  if (!data) notFound()

  if (data.alreadyBooked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl text-[#1A2A1E] mb-3">Interview already booked</h1>
          <p className="text-[#637A6F]">Your interview is already confirmed. Check your email for the details.</p>
        </div>
      </div>
    )
  }

  return (
    <BookingClient
      token={token}
      interviewId={data.interviewId ?? ''}
      firstName={data.firstName ?? 'there'}
      jobTitle={data.jobTitle ?? 'the role'}
      slots={data.slots ?? []}
    />
  )
}
