# Production Readiness Audit

Build status: **PASS — 0 errors, 32 pages compiled**

---

## 1. Fire-and-Forget Emails (FIXED — previous session)

Three routes were calling email functions without `await`. On Vercel serverless, the runtime
freezes the process the moment a response is returned, so the async email chain never ran.
All three were already fixed before this audit.

| Route | Function |
|---|---|
| `/api/apply` | `sendAcknowledgmentEmail` |
| `/api/interview/book` | `sendInterviewConfirmationEmail` |
| `/api/talent-pool` | `sendTalentPoolAcknowledgment` |

---

## 2. Security: CRON_SECRET check was inverted (FIXED)

**File:** `app/api/cron/pipeline/route.ts`

**Before:**
```ts
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

If `CRON_SECRET` was not set in the Vercel environment (e.g. accidentally omitted), the
condition short-circuits and the endpoint is completely open — anyone could trigger the
pipeline cron from outside Vercel.

**After:**
```ts
if (process.env.NODE_ENV === 'production') {
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
} else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Production always requires the secret. Development allows unauthenticated calls only when
no secret is configured, which is the normal local dev workflow.

---

## 3. Race Condition: Interview slot double-booking (FIXED)

**File:** `app/api/interview/book/route.ts`

**Before (TOCTOU — time-of-check to time-of-use):**
```ts
// Step 1: check
const { data: slot } = await db
  .from('interview_slots')
  .select('*')
  .eq('id', slot_id)
  .eq('is_booked', false)
  .single()
if (!slot) return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })

// Step 2: update (separate operation — gap between check and claim)
await db.from('interview_slots').update({ is_booked: true }).eq('id', slot_id)
```

Two concurrent requests from different applicants could both pass Step 1 simultaneously,
then both execute Step 2 — double-booking the same slot.

**After (atomic compare-and-update):**
```ts
const { data: slot } = await db
  .from('interview_slots')
  .update({ is_booked: true })
  .eq('id', slot_id)
  .eq('is_booked', false)  // ← WHERE clause in the UPDATE itself
  .select()
  .single()
if (!slot) return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })
```

The check and the claim are one atomic database operation. If `is_booked` is already true
when the UPDATE runs, it touches 0 rows, `.single()` returns null, and the 409 fires.

---

## 4. Hardcoded `allowedOrigins` missing production domain (FIXED)

**File:** `next.config.ts`

**Before:**
```ts
serverActions: {
  allowedOrigins: ['localhost:3000'],
},
```

Next.js uses `allowedOrigins` as a CSRF safeguard for server actions. In production the
request origin is the deployed domain (e.g. `korelabs.cloud`), not `localhost:3000`. Any
server action called from the production site would have been rejected with a CSRF error.

**After:**
```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL
const productionHost = appUrl ? new URL(appUrl).host : null

serverActions: {
  allowedOrigins: [
    'localhost:3000',
    ...(productionHost ? [productionHost] : []),
  ],
},
```

The production host is derived from `NEXT_PUBLIC_APP_URL` (already in the env). No new
env var required.

---

## 5. Supabase `.single()` on queries that can return 0 rows (FIXED)

**File:** `app/admin/applications/[id]/page.tsx`

**Before:**
```ts
db.from('assessments').select('*').eq('applicant_id', id).single(),
db.from('interviews').select('*, interview_slots(...)').eq('applicant_id', id).single(),
```

`.single()` returns a Supabase error when 0 rows are found. An applicant in the `received`
stage has no assessment yet; an applicant in `assessment_done` has no interview record yet.
These queries were generating constant error responses from the Supabase PostgREST layer,
which creates noise in Supabase error logs and could mask real errors.

**After:**
```ts
db.from('assessments').select('*').eq('applicant_id', id).maybeSingle(),
db.from('interviews').select('*, interview_slots(...)').eq('applicant_id', id).maybeSingle(),
```

`.maybeSingle()` returns `null` data (no error) when 0 rows exist. The UI already handles
null values with conditional rendering so no other changes were needed.

---

## 6. Admin PATCH route — three bugs (FIXED)

**File:** `app/api/admin/applications/[id]/route.ts`

### Bug A: Notes could not be cleared
```ts
// Before — empty string is falsy, so notes: "" was silently dropped
if (parsed.notes) updates.notes = parsed.notes

// After — correctly applies any value that was explicitly provided
if (parsed.notes !== undefined) updates.notes = parsed.notes
```

### Bug B: No guard against empty update payload
If a PATCH request arrived with an empty body `{}` after Zod parsing, an empty `UPDATE SET`
was sent to Supabase. Added a 400 guard:
```ts
if (Object.keys(updates).length === 0) {
  return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
}
```

### Bug C: No 404 when applicant does not exist
After a successful `.update()` with `.single()`, `data` can be `null` if the `id` matched
no row (e.g. stale admin tab). Was returning `null` as JSON. Now returns 404:
```ts
if (!data) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
```

---

## 7. No error handling on logout route (FIXED)

**File:** `app/api/admin/logout/route.ts`

`clearAdminSession()` calls Next.js `cookies()` which can throw in certain contexts (e.g.
during static rendering or after headers are sent). The route had no try/catch.

```ts
// After
try {
  await clearAdminSession()
} catch {
  // Best effort — redirect regardless
}
```

The redirect always happens regardless of whether the cookie clear succeeded.

---

## 8. Missing input validation on `/api/apply` (FIXED)

**File:** `app/api/apply/route.ts`

Required fields (`job_slug`, `first_name`, `last_name`, `email`, `why_korelabs`) were read
from `formData` and passed directly to the DB insert without any presence check. A missing
field would result in a Supabase NOT NULL constraint error bubbling up as a generic 500
instead of a clean 400.

Added upfront validation:
```ts
const missing = []
if (!jobSlug) missing.push('job_slug')
if (!firstName) missing.push('first_name')
if (!lastName) missing.push('last_name')
if (!email || !email.includes('@')) missing.push('email')
if (!whyKorelabs) missing.push('why_korelabs')
if (missing.length > 0) {
  return NextResponse.json({ error: `Missing or invalid fields: ${missing.join(', ')}` }, { status: 400 })
}
```

---

## 9. No validation of `answers` in quiz submit (FIXED)

**File:** `app/api/quiz/submit/[token]/route.ts`

`answers` was destructured from the request body and passed to the scoring loop without
any type check. If the client sent a non-object (array, null, primitive), the scoring loop
would silently produce zero scores or throw.

```ts
if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
  return NextResponse.json({ error: 'answers must be an object' }, { status: 400 })
}
```

---

## 10. Error handling on cron initial query (FIXED)

**File:** `app/api/cron/pipeline/route.ts`

The initial `SELECT` from `pipeline_jobs` had no error handling. A DB connectivity issue
would return an unhandled exception rather than a clean 500.

```ts
const { data: jobs, error: fetchError } = await db
  .from('pipeline_jobs')
  .select('*')
  ...

if (fetchError) {
  console.error('Pipeline query error:', fetchError)
  return NextResponse.json({ error: 'Failed to fetch pipeline jobs' }, { status: 500 })
}
```

---

## Items audited and found clean (no changes needed)

| Area | Finding |
|---|---|
| Service role key exposure | `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix and is only imported in server-side files (API routes, server components). Not exposed to the client. |
| CV storage | CVs are uploaded to the `cvs` Supabase Storage bucket and retrieved exclusively via `createSignedUrl(path, 3600)`. No public URLs. |
| Admin middleware | `matcher: ['/admin/:path*']` protects all admin UI pages. The two sensitive API routes under `/api/admin/*` have their own `isAdminAuthenticated()` checks. |
| Assessment expiry | Both the page server component and the `/api/quiz/submit` route independently check `expires_at` and `completed_at` before allowing access. |
| Pipeline email sends | `lib/pipeline.ts` properly `await`s all email sends and handles errors per-job. |
| Admin slots API | Validates `starts_at` presence and is authenticated before any DB write. |
| `any` types | No `any` types found. The `as unknown as Applicant` casts in `pipeline.ts` exist because the Supabase return type includes joined table columns not present in the `Applicant` interface — these are type narrowing casts, not escapes from type safety. |

---

## Build result

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (32/32)
```

Zero TypeScript errors. Zero lint errors.
