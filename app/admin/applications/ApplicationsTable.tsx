'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StageBadge, ScoreBadge } from '@/components/ui/Badge'
import { formatRelative, daysAgo } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'
import { ChevronDown, Filter, Send, Archive, ChevronLeft, ChevronRight } from 'lucide-react'

interface Application {
  id: string
  first_name: string
  last_name: string
  email: string
  stage: ApplicantStage
  created_at: string
  updated_at: string
  location: string | null
  score: number | null
  assessment_completed: boolean
  jobs: { title: string; department: string } | null
}

interface StageOption {
  value: string
  label: string
}

interface Props {
  applications: Application[]
  totalCount: number
  currentPage: number
  totalPages: number
  currentParams: Record<string, string | undefined>
  stageOptions: StageOption[]
}

export function ApplicationsTable({
  applications,
  totalCount,
  currentPage,
  totalPages,
  currentParams,
  stageOptions,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...currentParams, ...overrides, page: overrides.page ?? '1' }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v)
    }
    return `/admin/applications?${sp.toString()}`
  }

  function navigate(overrides: Record<string, string | undefined>) {
    startTransition(() => router.push(buildUrl(overrides)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === applications.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(applications.map((a) => a.id)))
    }
  }

  async function sendToHiringManager() {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await fetch('/api/admin/notify-hiring-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_ids: Array.from(selected) }),
      })
      setSelected(new Set())
      router.refresh()
    } finally {
      setBulkLoading(false)
    }
  }

  async function archiveSelected() {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/admin/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'archived' }),
          })
        )
      )
      setSelected(new Set())
      router.refresh()
    } finally {
      setBulkLoading(false)
    }
  }

  async function moveToStage(stage: string) {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/admin/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage }),
          })
        )
      )
      setSelected(new Set())
      router.refresh()
    } finally {
      setBulkLoading(false)
    }
  }

  const hasBulkSelection = selected.size > 0

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] hover:border-brand hover:text-brand transition-colors"
        >
          <Filter size={14} />
          Filters
          {currentParams.stage || currentParams.score_min || currentParams.score_max ? (
            <span className="w-2 h-2 rounded-full bg-brand" />
          ) : null}
        </button>

        {/* Stage filter */}
        <select
          value={currentParams.stage ?? ''}
          onChange={(e) => navigate({ stage: e.target.value || undefined })}
          className="px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] focus:outline-none focus:border-brand"
        >
          <option value="">All stages</option>
          {stageOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentParams.sort ?? 'date_desc'}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="px-3 py-2 rounded-lg border border-[#D8E8E0] bg-white text-sm text-[#637A6F] focus:outline-none focus:border-brand"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="name_asc">Name (A–Z)</option>
          <option value="score_desc">Score (high–low)</option>
          <option value="score_asc">Score (low–high)</option>
          <option value="stage">Stage</option>
        </select>

        {/* Clear filters */}
        {(currentParams.stage || currentParams.score_min || currentParams.score_max || currentParams.search) && (
          <button
            onClick={() => navigate({ stage: undefined, score_min: undefined, score_max: undefined, search: undefined })}
            className="text-xs text-[#9FB5A9] hover:text-red-500 transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-[#9FB5A9] ml-auto">{totalCount} total</span>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white rounded-xl border border-[#D8E8E0] flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-xs text-[#9FB5A9] block mb-1">Score range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                min={0}
                max={36}
                defaultValue={currentParams.score_min}
                onBlur={(e) => navigate({ score_min: e.target.value || undefined })}
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand"
              />
              <span className="text-[#9FB5A9] text-xs">–</span>
              <input
                type="number"
                placeholder="Max"
                min={0}
                max={36}
                defaultValue={currentParams.score_max}
                onBlur={(e) => navigate({ score_max: e.target.value || undefined })}
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9FB5A9] block mb-1">Search</label>
            <input
              type="text"
              placeholder="Name or email"
              defaultValue={currentParams.search}
              onBlur={(e) => navigate({ search: e.target.value || undefined })}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#D8E8E0] focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {hasBulkSelection && (
        <div className="mb-4 px-4 py-3 bg-brand text-white rounded-xl flex items-center gap-4">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={sendToHiringManager}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm transition-colors disabled:opacity-50"
            >
              <Send size={12} />
              Send to hiring manager
            </button>
            <button
              onClick={archiveSelected}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm transition-colors disabled:opacity-50"
            >
              <Archive size={12} />
              Archive
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-white/60 hover:text-white transition-colors ml-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-8 text-center">
          <p className="text-[#9FB5A9]">No applications match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-[#D8E8E0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F7F5] border-b border-[#D8E8E0]">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === applications.length && applications.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#C5D9CE] accent-brand"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Days in stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden xl:table-cell">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F7F3]">
                {applications.map((a) => {
                  const days = daysAgo(a.updated_at)
                  const isStuck = a.stage === 'assessment_sent' && days > 5
                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-[#F8FBF9] transition-colors ${selected.has(a.id) ? 'bg-brand-50' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggleSelect(a.id)}
                          className="rounded border-[#C5D9CE] accent-brand"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/applications/${a.id}`} className="hover:text-brand transition-colors">
                          <span className="font-medium text-[#1A2A1E]">{a.first_name} {a.last_name}</span>
                          <br />
                          <span className="text-xs text-[#9FB5A9]">{a.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-[#637A6F]">
                          {(a.jobs as { title: string } | null)?.title ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StageBadge stage={a.stage} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <ScoreBadge score={a.score} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className={`text-xs ${isStuck ? 'text-amber-600 font-medium' : 'text-[#9FB5A9]'}`}>
                          {days}d {isStuck && '⚠'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-[#9FB5A9] text-xs">
                        {formatRelative(a.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[#637A6F]">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => navigate({ page: String(currentPage - 1) })}
                  className="p-2 rounded-lg border border-[#D8E8E0] bg-white text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => navigate({ page: String(currentPage + 1) })}
                  className="p-2 rounded-lg border border-[#D8E8E0] bg-white text-[#637A6F] hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
