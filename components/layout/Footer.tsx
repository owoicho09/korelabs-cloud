import Link from 'next/link'

const LINKS = {
  Product: [
    { href: '/product', label: 'KoreOS' },
    { href: '/product#security', label: 'Security' },
    { href: '/product#integrations', label: 'Integrations' },
    { href: '/hiring', label: 'Hiring stats' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/about#values', label: 'Values' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-[#D8E8E0] bg-[#FAFAF8]">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.9" />
                  <circle cx="10" cy="4" r="2.5" fill="white" opacity="0.6" />
                  <circle cx="4" cy="10" r="2.5" fill="white" opacity="0.6" />
                  <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" />
                </svg>
              </span>
              <span className="font-display font-semibold text-[15px] text-[#1A2A1E]">KoreLabs Cloud</span>
            </Link>
            <p className="text-sm text-[#637A6F] leading-relaxed max-w-xs">
              Ambient workflow intelligence for European enterprises. KoreOS eliminates coordination waste so your organisation can do the work that actually matters.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-[#9FB5A9]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                Amsterdam HQ
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                Berlin Engineering
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-[#1A2A1E] uppercase tracking-widest mb-4">
                {section}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-[#637A6F] hover:text-[#1A2A1E] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-[#D8E8E0]">
          <p className="text-xs text-[#9FB5A9]">
            © {new Date().getFullYear()} KoreLabs Cloud BV. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9FB5A9]">
            <span>Series A · Amsterdam</span>
            <span>·</span>
            <span>European by design</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
