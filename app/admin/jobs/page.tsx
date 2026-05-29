import { getAdminClient } from '@/lib/supabase/admin'
import { STATIC_JOBS } from '@/lib/jobs'
import { formatSalary } from '@/lib/utils'
import Link from 'next/link'
import type { Job } from '@/lib/types'

export const revalidate = 0

async function getJobs(): Promise<Job[]> {
  const db = getAdminClient()
  if (!db) {
    return STATIC_JOBS.map((j, i) => ({ ...j, id: `static-${i}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
  }

  const { data } = await db.from('jobs').select('*').order('created_at')
  return data ?? []
}

export default async function JobsPage() {
  const jobs = await getJobs()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#1A2A1E]">Jobs</h1>
        <p className="text-sm text-[#637A6F] mt-1">{jobs.filter((j) => j.status === 'active').length} active roles</p>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl border border-[#D8E8E0] p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium text-[#1A2A1E]">{job.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  job.status === 'active' ? 'bg-brand-50 text-brand' : 'bg-amber-50 text-amber-600'
                }`}>
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-[#637A6F]">
                {job.department} · {job.location} · {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </div>
            <Link
              href={`/careers/${job.slug}`}
              target="_blank"
              className="text-xs text-brand hover:underline"
            >
              View public listing →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
