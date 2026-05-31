'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/about', label: 'About' },
  { href: '/careers', label: 'Careers' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#D8E8E0]/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.9" />
                <circle cx="10" cy="4" r="2.5" fill="white" opacity="0.6" />
                <circle cx="4" cy="10" r="2.5" fill="white" opacity="0.6" />
                <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" />
              </svg>
            </span>
            <span className="font-display font-semibold text-[15px] text-[#1A2A1E] tracking-tight">
              KoreLabs
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3.5 py-2 text-sm text-[#637A6F] hover:text-[#1A2A1E] transition-colors rounded-lg hover:bg-[#F0F7F3]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact">
              <Button variant="ghost" size="sm">Talk to us</Button>
            </Link>
            <Link href="/contact">
              <Button variant="primary" size="sm">Request access</Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[#637A6F] hover:text-[#1A2A1E] hover:bg-[#F0F7F3] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-[#FAFAF8] border-b border-[#D8E8E0]">
          <div className="container py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm text-[#1A2A1E] rounded-lg hover:bg-[#F0F7F3] transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-[#D8E8E0]">
              <Link href="/contact" onClick={() => setOpen(false)}>
                <Button variant="outline" size="md" className="w-full">Talk to us</Button>
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)}>
                <Button variant="primary" size="md" className="w-full">Request access</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
