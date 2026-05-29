import { getAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { StageBadge } from '@/components/ui/Badge'
import { formatRelative } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'

export const revalidate = 0

async function getApplications() {
  const db = getAdminClient()
  if (!db) return []

  const { data } = await db
    .from('applicants')
    .select('id, first_name, last_name, email, stage, created_at, jobs(title, department)')
    .order('created_at', { ascending: false })

  return data ?? []
}

export default async function ApplicationsPage() {
  const applications = await getApplications()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-[#1A2A1E]">Applications</h1>
          <p className="text-sm text-[#637A6F] mt-1">{applications.length} total</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-8 text-center">
          <p className="text-[#9FB5A9]">No applications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D8E8E0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F7F5] border-b border-[#D8E8E0]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Stage</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F7F3]">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-[#F8FBF9] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/applications/${a.id}`} className="hover:text-brand transition-colors">
                      <span className="font-medium text-[#1A2A1E]">{a.first_name} {a.last_name}</span>
                      <br />
                      <span className="text-xs text-[#9FB5A9]">{a.email}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-[#637A6F]">
                      {(a.jobs as unknown as { title: string } | null)?.title ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StageBadge stage={a.stage as ApplicantStage} />
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-[#9FB5A9]">
                    {formatRelative(a.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
