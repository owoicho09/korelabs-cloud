# Fire-and-Forget Email Fix — All Instances

## Summary

Three routes were calling email functions without `await`, causing them to silently drop on
serverless (Vercel). All three have been fixed. One route (`/api/quiz/submit`) was checked
and found clean — it schedules pipeline jobs rather than sending email directly.

---

## Fix 1 — `app/api/apply/route.ts`

**Email function:** `sendAcknowledgmentEmail`

**Before:**
```ts
// Send acknowledgment email (fire-and-forget)
const jobTitle = (job as { title: string }).title
sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle).catch(console.error)
```

**After:**
```ts
const jobTitle = (job as { title: string }).title
await sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle)
```

---

## Fix 2 — `app/api/interview/book/route.ts`

**Email function:** `sendInterviewConfirmationEmail`

**Before:**
```ts
// Send confirmation email (best effort)
sendInterviewConfirmationEmail(
  interview.applicants as Parameters<typeof sendInterviewConfirmationEmail>[0],
  interview as Parameters<typeof sendInterviewConfirmationEmail>[1],
  jobTitle
).catch(console.error)
```

**After:**
```ts
await sendInterviewConfirmationEmail(
  interview.applicants as Parameters<typeof sendInterviewConfirmationEmail>[0],
  interview as Parameters<typeof sendInterviewConfirmationEmail>[1],
  jobTitle
)
```

---

## Fix 3 — `app/api/talent-pool/route.ts`

**Email function:** `sendTalentPoolAcknowledgment`

**Before:**
```ts
sendTalentPoolAcknowledgment(email, first_name, role_interest).catch(console.error)
```

**After:**
```ts
await sendTalentPoolAcknowledgment(email, first_name, role_interest)
```

---

## Route checked but not changed — `app/api/quiz/submit/[token]/route.ts`

This route does not call any email function directly. On assessment completion it inserts a
`send_interview_invite` row into `pipeline_jobs`, which the cron job processes later.
No fire-and-forget issue here.

---

## Why this is safe

Every email function in `lib/email.ts` already wraps `resend.emails.send()` in a try/catch
and writes failures to the `email_log` table. Awaiting them does not expose email errors to
the HTTP response — a Resend failure will be swallowed and logged, and the route will still
return its normal success status to the client.
