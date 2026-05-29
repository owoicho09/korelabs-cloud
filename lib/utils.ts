import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return inputs
    .filter(Boolean)
    .map((i) => {
      if (typeof i === 'string') return i
      if (typeof i === 'object' && i !== null) {
        return Object.entries(i)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ')
      }
      return ''
    })
    .join(' ')
    .trim()
}

export function formatSalary(min: number, max: number, currency = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency
  const fmt = (n: number) => {
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}k`
    return `${symbol}${n}`
  }
  return `${fmt(min)}–${fmt(max)}`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function generateTrackingUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/apply/track/${token}`
}

export function generateQuizUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/quiz/${token}`
}

export function generateBookingUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/interview/book/${token}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}

export function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}
