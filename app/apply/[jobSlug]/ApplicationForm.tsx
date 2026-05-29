'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  why_korelabs: z
    .string()
    .min(50, 'Please write at least 50 words')
    .max(2000, 'Please keep it under 300 words'),
})

type FormData = z.infer<typeof schema>

interface Props {
  jobSlug: string
  jobTitle: string
}

const STEPS = ['Personal info', 'Your background', 'Why KoreLabs', 'CV upload']

export function ApplicationForm({ jobSlug, jobTitle }: Props) {
  const [step, setStep] = useState(0)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [trackingToken, setTrackingToken] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const whyText = watch('why_korelabs') ?? ''
  const wordCount = whyText.trim() ? whyText.trim().split(/\s+/).length : 0

  async function nextStep() {
    let valid = false
    if (step === 0) {
      valid = await trigger(['first_name', 'last_name', 'email'])
    } else if (step === 1) {
      valid = await trigger(['phone', 'location', 'linkedin_url', 'github_url', 'portfolio_url'])
    } else if (step === 2) {
      valid = await trigger(['why_korelabs'])
    }
    if (valid) setStep((s) => s + 1)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCvError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setCvError('Please upload a PDF file')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setCvError('File must be under 5MB')
      return
    }
    setCvFile(file)
  }

  async function onSubmit(data: FormData) {
    if (!cvFile) {
      setCvError('Please upload your CV')
      return
    }
    setSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('job_slug', jobSlug)
      Object.entries(data).forEach(([k, v]) => {
        if (v) formData.append(k, v as string)
      })
      formData.append('cv', cvFile)

      const res = await fetch('/api/apply', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setTrackingToken(json.tracking_token)
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && trackingToken) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-brand" />
        </div>
        <h2 className="font-display text-2xl text-[#1A2A1E] mb-3">Application submitted.</h2>
        <p className="text-[#637A6F] mb-8 max-w-sm">
          We have received your application for {jobTitle}. Check your inbox for a confirmation email with a link to track your application.
        </p>
        <Link href={`/apply/track/${trackingToken}`}>
          <Button variant="outline">
            Track your application
            <ExternalLink size={14} />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors ${
              i < step ? 'bg-brand text-white' : i === step ? 'bg-brand text-white' : 'bg-[#F0F7F3] text-[#9FB5A9]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-[#1A2A1E]' : 'text-[#9FB5A9]'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-brand' : 'bg-[#D8E8E0]'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Personal info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" {...register('first_name')} error={errors.first_name?.message} />
              <Input label="Last name" {...register('last_name')} error={errors.last_name?.message} />
            </div>
            <Input label="Email address" type="email" {...register('email')} error={errors.email?.message} />
          </div>
        )}

        {/* Step 1: Background */}
        {step === 1 && (
          <div className="space-y-4">
            <Input label="Phone (optional)" type="tel" {...register('phone')} />
            <Input label="Current location" placeholder="e.g. Berlin, Germany" {...register('location')} />
            <Input label="LinkedIn URL (optional)" type="url" placeholder="https://linkedin.com/in/..." {...register('linkedin_url')} error={errors.linkedin_url?.message} />
            <Input label="GitHub URL (optional)" type="url" placeholder="https://github.com/..." {...register('github_url')} error={errors.github_url?.message} />
            <Input label="Portfolio URL (optional)" type="url" placeholder="https://..." {...register('portfolio_url')} error={errors.portfolio_url?.message} />
          </div>
        )}

        {/* Step 2: Why KoreLabs */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[#637A6F] pb-2">
              This is the part that matters most. Tell us in 50–300 words why you want to work at KoreLabs specifically — not a list of achievements.
            </p>
            <Textarea
              label="Why KoreLabs?"
              rows={8}
              placeholder="What is it about the problem we are solving, the kind of company we are, or this specific role that made you apply here rather than somewhere else?"
              {...register('why_korelabs')}
              error={errors.why_korelabs?.message}
              wordCount={{ current: wordCount, min: 50, max: 300 }}
            />
          </div>
        )}

        {/* Step 3: CV Upload */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1A2A1E] block mb-2">CV / Résumé</label>
              <div className="border-2 border-dashed border-[#D8E8E0] rounded-xl p-8 text-center hover:border-brand/40 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  {cvFile ? (
                    <div>
                      <p className="text-sm font-medium text-brand">{cvFile.name}</p>
                      <p className="text-xs text-[#9FB5A9] mt-1">
                        {(cvFile.size / 1024 / 1024).toFixed(1)}MB · Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#637A6F] mb-1">Click to upload your CV</p>
                      <p className="text-xs text-[#9FB5A9]">PDF only · Max 5MB</p>
                    </div>
                  )}
                </label>
              </div>
              {cvError && <p className="text-xs text-red-500 mt-1.5">{cvError}</p>}
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button type="submit" loading={submitting}>
              Submit application
            </Button>
          )}
        </div>

        {submitError && <p className="text-sm text-red-500 mt-3">{submitError}</p>}
      </form>
    </div>
  )
}
