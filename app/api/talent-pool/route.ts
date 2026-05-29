import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendTalentPoolAcknowledgment } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { first_name, last_name, email, phone, role_interest, intro } = body

    if (!first_name || !last_name || !email || !role_interest || !intro) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminClient()
    if (db) {
      const { error } = await db.from('talent_pool').insert({
        first_name,
        last_name,
        email,
        phone: phone || null,
        role_interest,
        intro,
      })
      if (error && error.code === '23505') {
        return NextResponse.json({ error: 'Email already in talent pool' }, { status: 409 })
      }
      if (error) throw error
    }

    sendTalentPoolAcknowledgment(email, first_name, role_interest).catch(console.error)

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to join talent pool' }, { status: 500 })
  }
}
