'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ROLE_OPTIONS } from '@/lib/jobs'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role_interest: z.string().min(1, 'Please select a role area'),
  intro: z.string().min(30, 'Tell us a bit more').max(500, 'Max 500 characters'),
})

type FormData = z.infer<typeof schema>

export function TalentPoolForm() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const res = await fetch('/api/talent-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <CheckCircle size={24} className="text-brand" />
        </div>
        <h3 className="font-display text-xl text-[#1A2A1E] mb-2">You are on our radar.</h3>
        <p className="text-[#637A6F] text-sm">We will be in touch when something relevant opens up.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          {...register('first_name')}
          error={errors.first_name?.message}
        />
        <Input
          label="Last name"
          {...register('last_name')}
          error={errors.last_name?.message}
        />
      </div>
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        {...register('phone')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A2A1E]">Role interest</label>
        <select
          {...register('role_interest')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E8E0] text-[#1A2A1E] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        >
          <option value="">Select a role area</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
          <option value="General">General / Open to opportunities</option>
        </select>
        {errors.role_interest && (
          <p className="text-xs text-red-500">{errors.role_interest.message}</p>
        )}
      </div>

      <Textarea
        label="Brief introduction"
        rows={4}
        placeholder="Tell us who you are and what you work on..."
        {...register('intro')}
        error={errors.intro?.message}
        hint="50–500 characters"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" loading={isSubmitting}>
        Join the talent pool
      </Button>
    </form>
  )
}
