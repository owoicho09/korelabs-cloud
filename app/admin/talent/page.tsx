import { getAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

async function getTalentPool() {
  const db = getAdminClient()
  if (!db) return []
  const { data } = await db.from('talent_pool').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export default async function TalentPage() {
  const talent = await getTalentPool()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#1A2A1E]">Talent pool</h1>
        <p className="text-sm text-[#637A6F] mt-1">{talent.length} people on the radar</p>
      </div>

      {talent.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E8E0] p-8 text-center">
          <p className="text-[#9FB5A9]">No talent pool signups yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D8E8E0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F7F5] border-b border-[#D8E8E0]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden md:table-cell">Role interest</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide hidden lg:table-cell">Intro</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#637A6F] uppercase tracking-wide">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F7F3]">
              {talent.map((person) => (
                <tr key={person.id} className="hover:bg-[#F8FBF9]">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-[#1A2A1E]">{person.first_name} {person.last_name}</span>
                    <br />
                    <span className="text-xs text-[#9FB5A9]">{person.email}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-[#637A6F]">
                    {person.role_interest}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-[#637A6F] max-w-xs">
                    <p className="truncate">{person.intro}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[#9FB5A9] text-xs">
                    {formatDate(person.created_at)}
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
