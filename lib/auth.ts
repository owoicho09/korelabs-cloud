import { cookies } from 'next/headers'

const COOKIE_NAME = 'kl_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return false
  return password === secret
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === 'authenticated'
}
