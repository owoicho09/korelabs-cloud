import type { Metadata } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'KoreLabs Cloud — Ambient Workflow Intelligence',
    template: '%s — KoreLabs Cloud',
  },
  description:
    'KoreOS is an ambient workflow intelligence layer that sits across enterprise tools and eliminates coordination waste. Used by growing European companies.',
  keywords: ['workflow automation', 'enterprise AI', 'coordination waste', 'KoreOS', 'KoreLabs'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'KoreLabs Cloud',
    title: 'KoreLabs Cloud — Ambient Workflow Intelligence',
    description:
      'KoreOS eliminates coordination overhead so your organisation can do the work that actually matters.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
