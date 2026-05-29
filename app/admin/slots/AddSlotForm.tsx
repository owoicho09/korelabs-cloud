'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function AddSlotForm() {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('45')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time) return
    setSaving(true)
    setError(null)

    try {
      const startsAt = new Date(`${date}T${time}:00`)
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: startsAt.toISOString(),
          duration_minutes: parseInt(duration, 10),
          zoom_link: process.env.NEXT_PUBLIC_ZOOM_LINK,
        }),
      })
      if (!res.ok) throw new Error('Failed to add slot')
      setDate('')
      setTime('')
      router.refresh()
    } catch {
      setError('Failed to add slot. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#D8E8E0] p-5 space-y-4">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />
      <Input
        label="Time (local)"
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <Input
        label="Duration (minutes)"
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        min="15"
        max="120"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" loading={saving} size="sm">
        Add slot
      </Button>
    </form>
  )
}
