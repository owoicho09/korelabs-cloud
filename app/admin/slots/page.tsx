import { getAdminClient } from '@/lib/supabase/admin'
import { formatDateTime } from '@/lib/utils'
import { AddSlotForm } from './AddSlotForm'

export const revalidate = 0

async function getSlots() {
  const db = getAdminClient()
  if (!db) return []

  const { data } = await db
    .from('interview_slots')
    .select('*, interviews(applicants(first_name, last_name))')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')

  return data ?? []
}

export default async function SlotsPage() {
  const slots = await getSlots()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#1A2A1E]">Interview slots</h1>
        <p className="text-sm text-[#637A6F] mt-1">Manage available interview times</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-medium text-[#1A2A1E] mb-4 text-sm">Add a slot</h2>
          <AddSlotForm />
        </div>

        <div>
          <h2 className="font-medium text-[#1A2A1E] mb-4 text-sm">Upcoming slots ({slots.length})</h2>
          <div className="space-y-2">
            {slots.length === 0 ? (
              <p className="text-sm text-[#9FB5A9]">No upcoming slots.</p>
            ) : (
              slots.map((slot) => {
                const booking = Array.isArray(slot.interviews) ? slot.interviews[0] : null
                const bookedBy = booking
                  ? (booking.applicants as { first_name: string; last_name: string } | null)
                  : null

                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-4 rounded-xl border text-sm ${
                      slot.is_booked
                        ? 'border-brand/30 bg-brand-50'
                        : 'border-[#D8E8E0] bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[#1A2A1E]">{formatDateTime(slot.starts_at)}</p>
                      <p className="text-xs text-[#9FB5A9]">{slot.duration_minutes} min</p>
                    </div>
                    {slot.is_booked && bookedBy ? (
                      <span className="text-xs text-brand font-medium">
                        Booked: {bookedBy.first_name} {bookedBy.last_name}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9FB5A9]">Available</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
