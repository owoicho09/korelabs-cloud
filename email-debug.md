# Email Not Sending in Production — Root Cause Analysis

## Where the email is triggered

**File:** `app/api/apply/route.ts`, line 73

```ts
// Send acknowledgment email (fire-and-forget)
const jobTitle = (job as { title: string }).title
sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle).catch(console.error)

return NextResponse.json({ tracking_token: applicant.tracking_token }, { status: 201 })
```

The function is called and immediately forgotten — the `return` on the next line fires before `sendAcknowledgmentEmail` has a chance to run.

---

## Root cause: fire-and-forget kills the async chain in serverless

This is a **serverless execution model bug**, not a Resend configuration bug.

On Vercel (and every other serverless/edge platform), the runtime freezes or terminates the function the moment a response is returned. When you do:

```ts
sendAcknowledgmentEmail(...).catch(console.error)  // ← promise launched but NOT awaited
return NextResponse.json(...)                        // ← response sent → runtime frozen immediately
```

The `sendAcknowledgmentEmail` promise is created but its execution body has not started by the time `return` is hit. The platform considers the invocation done and freezes the Node.js context. The async chain inside `sendAcknowledgmentEmail` — the OpenAI call, the Resend send, the DB log — **never runs**.

This is exactly why nothing appears in Resend logs: `resend.emails.send()` is never called.

The `.catch(console.error)` also never fires, so there is no error trace either.

---

## What sendAcknowledgmentEmail does (lib/email.ts, lines 69–106)

```ts
export async function sendAcknowledgmentEmail(applicant: Applicant, roleTitle: string): Promise<void> {
  const resend = getResend()                // checks RESEND_API_KEY env var
  const subject = `Application received — ${roleTitle} at KoreLabs`
  const trackingUrl = generateTrackingUrl(applicant.tracking_token)

  const body = await personaliseEmail(...)  // ← awaits OpenAI (or fallback)

  const html = buildEmailHtml(...)

  if (resend) {
    try {
      const result = await resend.emails.send({ from, to, subject, html })
      resendId = result.data?.id
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  await logEmail(...)  // logs to email_log table
}
```

The function is correctly written — `resend.emails.send` is awaited, errors are caught, and everything is logged. The entire function never executes because the serverless runtime is killed before it can run.

---

## Secondary risk (not the cause today, but worth fixing)

`personaliseEmail()` is called unconditionally even when `resend` is `null` (no API key). That wastes an OpenAI call on every missing-key invocation. Minor, but worth reordering.

---

## The fix

Remove the fire-and-forget. `await` the email before returning. The response only adds ~200–500 ms in the typical case (OpenAI fast-path or fallback + Resend).

**app/api/apply/route.ts, line 73 — change:**

```ts
// BEFORE (broken on serverless)
sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle).catch(console.error)
```

```ts
// AFTER (correct)
await sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle)
```

The full block after the fix:

```ts
const jobTitle = (job as { title: string }).title
await sendAcknowledgmentEmail(applicant as unknown as Applicant, jobTitle)

return NextResponse.json({ tracking_token: applicant.tracking_token }, { status: 201 })
```

Because `sendAcknowledgmentEmail` already wraps the Resend call in try/catch and swallows errors into the log, awaiting it will not cause the `/api/apply` route to 500 if the email fails — it will still return 201 to the client.

---

## How to confirm the fix worked

1. Deploy with the `await` change.
2. Submit a test application.
3. Check the Resend dashboard — an entry should now appear.
4. Check the `email_log` table in Supabase — a row with `type = 'acknowledgment'` and a populated `resend_id` should be present.
5. If `resend_id` is null and `error` is populated, a secondary issue (domain verification, API key) would then be the next thing to check.
