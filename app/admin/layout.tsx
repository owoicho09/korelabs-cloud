import Link from 'next/link'
import { LayoutDashboard, Users, Columns, Briefcase, Calendar, UserSearch, LogOut } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/pipeline', label: 'Pipeline', icon: Columns },
  { href: '/admin/applications', label: 'Applications', icon: Users },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/slots', label: 'Interview slots', icon: Calendar },
  { href: '/admin/talent', label: 'Talent pool', icon: UserSearch },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F4F7F5] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A2A1E] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.9" />
                <circle cx="10" cy="4" r="2.5" fill="white" opacity="0.6" />
                <circle cx="4" cy="10" r="2.5" fill="white" opacity="0.6" />
                <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" />
              </svg>
            </span>
            <span className="font-display text-sm font-semibold text-white">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#8FB5A0] hover:text-white hover:bg-white/10 transition-colors mb-0.5"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#8FB5A0] hover:text-white hover:bg-white/10 transition-colors w-full"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-[#4A6E5A] hover:text-[#8FB5A0] transition-colors mt-1"
          >
            View public site →
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
