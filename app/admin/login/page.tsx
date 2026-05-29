'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(from)
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Admin password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter admin password"
        autoFocus
        error={error ?? undefined}
      />
      <Button type="submit" loading={loading} className="w-full">
        Sign in
      </Button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.9" />
              <circle cx="10" cy="4" r="2.5" fill="white" opacity="0.6" />
              <circle cx="4" cy="10" r="2.5" fill="white" opacity="0.6" />
              <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" />
            </svg>
          </span>
          <span className="font-display font-semibold text-[15px] text-[#1A2A1E]">KoreLabs Admin</span>
        </div>

        <h1 className="font-display text-2xl text-[#1A2A1E] mb-2">Sign in</h1>
        <p className="text-sm text-[#637A6F] mb-6">Access the hiring dashboard.</p>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
