'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  subject: z.string().min(1, 'Required'),
  message: z.string().min(20, 'Please include more detail'),
})

type FormData = z.infer<typeof schema>

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(_data: FormData) {
    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 600))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <CheckCircle size={24} className="text-brand" />
        </div>
        <h3 className="font-display text-xl text-[#1A2A1E] mb-2">Message received.</h3>
        <p className="text-[#637A6F] text-sm">We will get back to you within one business day.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Your name"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Company (optional)"
        {...register('company')}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A2A1E]">Subject</label>
        <select
          {...register('subject')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E8E0] text-[#1A2A1E] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        >
          <option value="">Select a topic</option>
          <option value="product">KoreOS — product enquiry</option>
          <option value="demo">Request a demo</option>
          <option value="partnership">Partnership</option>
          <option value="investment">Investment</option>
          <option value="other">Something else</option>
        </select>
        {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
      </div>
      <Textarea
        label="Message"
        rows={5}
        placeholder="Tell us about your organisation and what you are trying to solve..."
        {...register('message')}
        error={errors.message?.message}
      />
      <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
        Send message
      </Button>
    </form>
  )
}
