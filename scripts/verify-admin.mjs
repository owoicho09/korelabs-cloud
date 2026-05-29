import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const BASE = 'http://localhost:3000'
const PASSWORD = 'korelabs-admin-2025'
const SHOTS = 'C:/Users/HP/Desktop/Projects/korelabs-cloud/scripts/screenshots'

await mkdir(SHOTS, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []

async function shot(name) {
  const path = join(SHOTS, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  return path
}

async function check(label, url, waitFor) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {})
  const title = await page.title()
  const h1 = await page.$eval('h1', el => el.textContent).catch(() => null)
  const errors = await page.$$eval('[class*="error"],[class*="Error"]', els => els.map(e => e.textContent?.trim()).filter(Boolean)).catch(() => [])
  const path = await shot(label)
  results.push({ label, url, title, h1, errors, path })
  console.log(`✓ ${label}: "${h1 ?? title}"`)
  return { title, h1, errors }
}

// Step 1: Login page
await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' })
await shot('01-login-page')
console.log('Login page loaded:', await page.title())

// Step 2: Submit login
await page.fill('input[type="password"]', PASSWORD)
await page.click('button[type="submit"]')
await page.waitForURL(`${BASE}/admin`, { timeout: 10000 })
await shot('02-admin-overview')
const overviewH1 = await page.$eval('h1', el => el.textContent).catch(() => null)
console.log(`✓ Admin overview: "${overviewH1}"`)

// Check for DB connection warning
const dbWarning = await page.$('.bg-amber-50').catch(() => null)
if (dbWarning) {
  const txt = await dbWarning.textContent()
  console.log(`  ⚠ DB warning: ${txt?.trim()}`)
} else {
  // Check for stats
  const stats = await page.$$eval('[class*="font-display"]', els => els.slice(0, 4).map(e => e.textContent?.trim()))
  console.log(`  Stats visible: ${stats.join(', ')}`)
}

// Step 3: Pipeline / Kanban
await check('03-pipeline', `${BASE}/admin/pipeline`, '.font-display')
const columns = await page.$$eval('[class*="rounded-xl"]', els => els.length)
console.log(`  Kanban elements visible: ${columns}`)

// Step 4: Applications list
await check('04-applications', `${BASE}/admin/applications`, 'h1')
const rows = await page.$$('tbody tr').catch(() => [])
console.log(`  Table rows: ${rows.length}`)

// Step 5: Individual applicant (try first row if exists)
const firstRow = await page.$('tbody tr a').catch(() => null)
if (firstRow) {
  const href = await firstRow.getAttribute('href')
  await check('05-applicant-detail', `${BASE}${href}`, 'h1')
  const hasIframe = await page.$('iframe').catch(() => null)
  const hasPDF = await page.$('a[href*="supabase"]').catch(() => null)
  console.log(`  CV iframe present: ${!!hasIframe}`)
  console.log(`  CV signed link present: ${!!hasPDF}`)
} else {
  console.log('  No applicants in DB yet — skipping individual view')
  await page.goto(`${BASE}/admin/applications/nonexistent`, { waitUntil: 'networkidle', timeout: 8000 }).catch(() => {})
  await shot('05-applicant-notfound')
  console.log(`  No-applicant state: "${await page.title()}"`)
}

// Step 6: Jobs
await check('06-jobs', `${BASE}/admin/jobs`, 'h1')
const jobCards = await page.$$('[class*="rounded-xl"][class*="border"]').catch(() => [])
console.log(`  Job cards visible: ${jobCards.length}`)

// Step 7: Interview slots
await check('07-slots', `${BASE}/admin/slots`, 'h1')
const form = await page.$('form').catch(() => null)
console.log(`  Add slot form present: ${!!form}`)

// Step 8: Talent pool
await check('08-talent', `${BASE}/admin/talent`, 'h1')
const talentMsg = await page.$('p').then(el => el?.textContent()).catch(() => null)
console.log(`  Talent message: "${talentMsg}"`)

// Step 9: Try unauthenticated access (new context)
const ctx2 = await browser.newContext()
const page2 = await ctx2.newPage()
await page2.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
const redirectedTo = page2.url()
console.log(`\n  Auth check: unauthenticated /admin redirects to → ${redirectedTo}`)
await ctx2.close()

await browser.close()

console.log('\n=== SUMMARY ===')
for (const r of results) {
  const errStr = r.errors.length ? ` ⚠ ERRORS: ${r.errors.slice(0, 2).join(', ')}` : ''
  console.log(`  ${r.label}: ${r.h1 ?? r.title}${errStr}`)
}
console.log('\nScreenshots saved to:', SHOTS)
