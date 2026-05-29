import { NextResponse } from 'next/server'
import { verifyAdminPassword, setAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    const valid = await verifyAdminPassword(password)
    if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    await setAdminSession()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
