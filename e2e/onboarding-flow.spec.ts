import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Onboarding redesign (Phase 7/8) coverage.
 *
 * Route-per-step wizard under `/onboarding/*`:
 *   welcome → hours → services → staff → presence → public → notifications → done → /calendar
 *
 * Runs serial against the same real PWA dev server + seeded Postgres as
 * `critical-flows.spec.ts`. Each test signs up a brand-new salon with a unique
 * slug/phone so runs never collide with seed data or with each other.
 */

/** Unique-per-call signup identity. Slug stays ASCII + lowercase to satisfy the slug field. */
function freshSalon() {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const slug = `e2e-onb-${stamp}`.toLowerCase()
  return {
    slug,
    phone: `0913${stamp.slice(-7)}`,
    /** ASCII salon name: controlled Persian input occasionally fails to update React state headless. */
    salonLabel: `E2E Onboarding ${slug}`,
    managerName: 'مدیر E2E',
    password: 'Salon1234',
  }
}

/** Sign up a new manager + salon and land on the onboarding welcome step. */
async function signupNewSalon(page: Page) {
  const salon = freshSalon()
  await page.context().clearCookies()
  await page.goto('/signup', { waitUntil: 'domcontentloaded' })
  await page.locator('#salonName').waitFor({ state: 'visible' })

  const nameBox = page.locator('#salonName')
  await nameBox.click()
  await nameBox.pressSequentially(salon.salonLabel, { delay: 15 })
  await expect(nameBox).toHaveValue(salon.salonLabel)
  // Slug is auto-derived from the salon name; the slug field is hidden until "تغییر".
  await page.locator('#managerName').fill(salon.managerName)
  await page.locator('#managerPhone').fill(salon.phone)
  await page.locator('#password').fill(salon.password)

  const signupPost = page.waitForResponse(
    (r) => r.url().includes('/api/v1/auth/signup') && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'ساخت سالن' }).click()
  const res = await signupPost
  expect(res.ok(), await res.text()).toBeTruthy()

  await expect(page).toHaveURL(/\/onboarding\/welcome/)
  return salon
}

test.describe('Onboarding redesign', () => {
  test.describe.configure({ mode: 'serial' })

  test('Full new-salon flow: signup → preset services → manager-only → skip rest → calendar', async ({
    page,
  }) => {
    await test.step('Signup lands on welcome', async () => {
      await signupNewSalon(page)
      await expect(page).toHaveURL(/\/onboarding\/welcome/)
      await expect(page.getByRole('button', { name: 'بزن بریم' })).toBeVisible({
        timeout: 30_000,
      })
    })

    await test.step('Welcome → hours', async () => {
      await page.getByRole('button', { name: 'بزن بریم' }).click()
      await expect(page).toHaveURL(/\/onboarding\/hours/)
    })

    await test.step('Hours: accept defaults and continue', async () => {
      const waitSave = page.waitForResponse(
        (r) =>
          /\/api\/(v\d+\/)?settings\/business/.test(r.url()) &&
          ['PATCH', 'PUT', 'POST'].includes(r.request().method())
      )
      await page.getByRole('button', { name: 'ادامه' }).click()
      const res = await waitSave
      expect(res.ok(), await res.text()).toBeTruthy()
      await expect(page).toHaveURL(/\/onboarding\/services/)
    })

    await test.step('Services: apply a catalog preset', async () => {
      // The first non-disabled preset card is a role=button Card.
      const presetCard = page.getByRole('button').filter({ hasText: 'خدمت' }).first()
      await presetCard.click()
      // Detail view: apply the (pre-selected) variants.
      const applyBtn = page.getByRole('button', { name: /افزودن .* خدمت به سالن/ })
      await expect(applyBtn).toBeVisible({ timeout: 20_000 })
      const waitApply = page.waitForResponse(
        (r) =>
          /\/api\/(v\d+\/)?catalog-presets\/[^/]+\/apply/.test(r.url()) &&
          r.request().method() === 'POST'
      )
      await applyBtn.click()
      await waitApply
      // Confirmation chip appears once an active service exists.
      await expect(page.getByText(/خدمت فعال ثبت شد/)).toBeVisible({ timeout: 20_000 })
    })

    await test.step('Services → staff', async () => {
      await page.getByRole('button', { name: 'ادامه' }).click()
      await expect(page).toHaveURL(/\/onboarding\/staff/)
    })

    await test.step('Staff: choose manager-only path', async () => {
      const waitSetManager = page.waitForResponse(
        (r) => /\/api\/(v\d+\/)?onboarding/.test(r.url()) && r.request().method() === 'PATCH'
      )
      await page.getByRole('button', { name: 'فعلاً فقط خودم هستم' }).click()
      const res = await waitSetManager
      expect(res.ok(), await res.text()).toBeTruthy()
      await expect(page).toHaveURL(/\/onboarding\/presence/)
    })

    await test.step('Presence: skip', async () => {
      await page.getByRole('button', { name: 'فعلاً رد کن' }).click()
      await expect(page).toHaveURL(/\/onboarding\/public/)
    })

    await test.step('Public page: skip', async () => {
      await page.getByRole('button', { name: 'فعلاً رد کن' }).click()
      await expect(page).toHaveURL(/\/onboarding\/notifications/)
    })

    await test.step('Notifications: skip (بعداً)', async () => {
      await page.getByRole('button', { name: 'بعداً' }).click()
      await expect(page).toHaveURL(/\/onboarding\/done/)
    })

    await test.step('Done → complete → calendar', async () => {
      await expect(page.getByRole('heading', { name: /تمام شد/ })).toBeVisible()
      const waitComplete = page.waitForResponse(
        (r) => /\/api\/(v\d+\/)?onboarding/.test(r.url()) && r.request().method() === 'PATCH'
      )
      await page.getByRole('button', { name: /بزن بریم سراغ اولین نوبت/ }).click()
      const res = await waitComplete
      expect(res.ok(), await res.text()).toBeTruthy()
      await expect(page).toHaveURL(/\/calendar/, { timeout: 30_000 })
    })
  })

  test('Required-step block: /calendar before services+staff redirects into onboarding', async ({
    page,
  }) => {
    await test.step('Fresh signup (no services, no staff)', async () => {
      await signupNewSalon(page)
    })

    await test.step('Deep-link to /calendar is bounced back into onboarding', async () => {
      await page.goto('/calendar', { waitUntil: 'domcontentloaded' })
      // `_authed` guard sends managers to `/onboarding`, which resumes at welcome
      // for a fresh salon (no tracked steps complete yet).
      await expect(page).not.toHaveURL(/\/calendar/, { timeout: 30_000 })
      await expect(page).toHaveURL(/\/onboarding\/(?:welcome|hours)/)
    })

    await test.step('With services unmet, the wizard never reaches a step gated on services', async () => {
      // Reaching `/onboarding/staff` requires `servicesAdded`; deep-linking
      // there must redirect back to the services step.
      await page.goto('/onboarding/staff', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/onboarding\/services/, { timeout: 30_000 })
    })
  })
})
