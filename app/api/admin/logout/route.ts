import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    await clearAdminSession()
  } catch {
    // Best effort — redirect regardless
  }
  const url = new URL('/admin/login', req.url)
  return NextResponse.redirect(url)
}
