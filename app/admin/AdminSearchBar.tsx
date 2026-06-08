'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { StageBadge } from '@/components/ui/Badge'
import type { ApplicantStage } from '@/lib/types'

interface Result {
  id: string
  first_name: string
  last_name: string
  email: string
  stage: ApplicantStage
  jobs: { title: string } | null
}

export function AdminSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.results ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
  }, [query, search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#637A6F]" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search applicants…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-[#8FB5A0] focus:outline-none focus:bg-white/20 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#637A6F] hover:text-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#D8E8E0] shadow-lg overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[#9FB5A9]">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#9FB5A9]">No results found</div>
          ) : (
            <div className="divide-y divide-[#F0F7F3]">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/applications/${r.id}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FBF9] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A2A1E]">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-[#9FB5A9]">
                      {(r.jobs as { title: string } | null)?.title ?? '—'} · {r.email}
                    </p>
                  </div>
                  <StageBadge stage={r.stage} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
