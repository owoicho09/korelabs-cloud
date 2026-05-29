import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  await clearAdminSession()
  const url = new URL('/admin/login', req.url)
  return NextResponse.redirect(url)
}
