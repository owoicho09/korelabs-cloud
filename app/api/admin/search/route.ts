import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const db = getAdminClient()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    const { data } = await db
      .from('applicants')
      .select('id, first_name, last_name, email, stage, created_at, jobs(title)')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ results: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed' }, { status: 500 })
  }
}
