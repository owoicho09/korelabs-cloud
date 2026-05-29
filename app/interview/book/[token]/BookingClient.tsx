'use client'

import { useState } from 'react'
import { CheckCircle, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'

interface Slot {
  id: string
  starts_at: string
  duration_minutes: number
}

interface Props {
  token: string
  interviewId: string
  firstName: string
  jobTitle: string
  slots: Slot[]
}

export function BookingClient({ firstName, jobTitle, slots, interviewId }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null)

  async function confirmBooking() {
    if (!selectedSlot) return
    setBooking(true)
    setError(null)

    try {
      const res = await fetch('/api/interview/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId, slot_id: selectedSlot }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Booking failed')
      }
      setBookedSlot(slots.find((s) => s.id === selectedSlot) ?? null)
      setBooked(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (booked && bookedSlot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5 mx-auto">
            <CheckCircle size={32} className="text-brand" />
          </div>
          <h2 className="font-display text-2xl text-[#1A2A1E] mb-3">Interview confirmed.</h2>
          <p className="text-[#637A6F] mb-4">
            Your interview for <strong className="text-[#1A2A1E]">{jobTitle}</strong> is booked for:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand/20 text-brand font-medium mb-6">
            <Calendar size={14} />
            {formatDateTime(bookedSlot.starts_at)}
          </div>
          <p className="text-sm text-[#637A6F]">
            We have sent you a confirmation email with the Zoom link. See you there, {firstName}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="container max-w-xl py-16">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center mb-6">
          <Calendar size={14} className="text-white" />
        </div>

        <h1 className="font-display text-[32px] text-[#1A2A1E] leading-tight mb-3">
          Book your interview slot, {firstName}.
        </h1>
        <p className="text-[#637A6F] mb-8">
          Choose a time that works for your <strong className="text-[#1A2A1E]">{jobTitle}</strong> interview. Interviews are 45 minutes via Zoom.
        </p>

        {slots.length === 0 ? (
          <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            No slots are currently available. Please email careers@korelabs.cloud and we will find a time that works.
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-8">
              {slots.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedSlot === slot.id
                      ? 'border-brand bg-brand-50'
                      : 'border-[#D8E8E0] bg-white hover:border-brand/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="slot"
                    value={slot.id}
                    checked={selectedSlot === slot.id}
                    onChange={() => setSelectedSlot(slot.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                    selectedSlot === slot.id ? 'border-brand bg-brand' : 'border-[#C5D9CE]'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-[#1A2A1E]">
                      {formatDateTime(slot.starts_at)}
                    </div>
                    <div className="text-xs text-[#9FB5A9] flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {slot.duration_minutes} minutes · Zoom
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <Button
              size="lg"
              onClick={confirmBooking}
              loading={booking}
              disabled={!selectedSlot}
            >
              Confirm this slot
            </Button>

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
