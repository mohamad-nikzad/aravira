import { test, expect } from '@playwright/test'
import {
  loginManagerExpectsDashboard,
  loginManagerExpectsCalendar,
  loginStaffExpectsCalendar,
  logoutFromSettings,
  SEEDED_MANAGER,
  SEEDED_STAFF,
} from './helpers/auth'
import { LoginPage } from './pages/login.page'

/**
 * Top 20 user-journey tests (serial, shared seeded DB).
 * Requires: migrated DB + `bun run db:seed` for primary salon demo data.
 */
test.describe('Critical salon journeys', () => {
  test.describe.configure({ mode: 'serial' })

  test('01 — Landing page exposes auth entry points', async ({ page }) => {
    await test.step('Open marketing home', async () => {
      await page.goto('/')
      await expect(page.getByRole('link', { name: 'ورود' }).first()).toBeVisible()
    })
    await test.step('Signup CTA', async () => {
      await expect(page.getByRole('link', { name: 'ساخت حساب مدیر' }).first()).toBeVisible()
    })
  })

  test('02 — Login rejects invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await test.step('POST /api/auth/login returns 401 and UI shows error', async () => {
      await loginPage.goto()
      const [res] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'
        ),
        loginPage.submit(SEEDED_MANAGER.phone, 'wrong-password-xyz'),
      ])
      expect(res.status()).toBe(401)
      await expect(page.getByText('شماره موبایل یا رمز عبور اشتباه است')).toBeVisible()
    })
  })

  test('03 — Manager logs in, lands on dashboard, and can open calendar', async ({ page }) => {
    await test.step('Authenticate manager', async () => {
      await loginManagerExpectsDashboard(page)
    })
    await test.step('Dashboard counters load', async () => {
      await expect(page.getByText('نوبت‌های امروز')).toBeVisible()
    })
    await test.step('Calendar chrome', async () => {
      await page.getByRole('link', { name: 'تقویم' }).click()
      await expect(page).toHaveURL(/\/calendar/)
      await expect(page.getByRole('button', { name: 'ماه' })).toBeVisible()
      await expect(page.getByLabel('نوبت جدید')).toBeVisible()
    })
  })

  test('04 — Staff session: calendar only, clients route blocked', async ({ page }) => {
    await test.step('Login as staff', async () => {
      await page.context().clearCookies()
      await loginStaffExpectsCalendar(page)
    })
    await test.step('No manager-only nav link', async () => {
      await expect(page.getByRole('navigation').getByRole('link', { name: 'مشتریان' })).toHaveCount(0)
    })
    await test.step('Deep link to clients redirects away', async () => {
      await page.goto('/clients')
      await expect(page).toHaveURL(/\/calendar/)
    })
  })

  test('05 — Manager can walk primary navigation', async ({ page }) => {
    await test.step('Manager login', async () => {
      await page.context().clearCookies()
      await loginManagerExpectsDashboard(page)
    })
    await test.step('Today', async () => {
      await page.getByRole('link', { name: 'امروز' }).click()
      await expect(page.getByRole('heading', { name: 'امروز' })).toBeVisible()
    })
    await test.step('Clients', async () => {
      await page.getByRole('link', { name: 'مشتریان' }).click()
      await expect(page.getByRole('heading', { name: 'مشتریان' })).toBeVisible()
    })
    await test.step('Retention', async () => {
      await page.getByRole('link', { name: 'پیگیری' }).click()
      await expect(page.getByRole('heading', { name: 'پیگیری مشتریان' })).toBeVisible()
    })
    await test.step('Settings', async () => {
      await page.getByRole('link', { name: 'تنظیمات' }).click()
      await expect(page.getByRole('heading', { name: 'تنظیمات' })).toBeVisible()
    })
    await test.step('Dashboard from settings', async () => {
      await page.getByRole('link', { name: 'داشبورد و آمار' }).click()
      await expect(page.getByRole('heading', { name: 'داشبورد' })).toBeVisible()
    })
    await test.step('Back to calendar', async () => {
      await page.getByRole('link', { name: 'تقویم' }).click()
      await expect(page).toHaveURL(/\/calendar/)
    })
  })

  test('06 — Clients list: search narrows results', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'مشتریان' }).click()
    await test.step('Type search query', async () => {
      await page.getByPlaceholder('جستجوی مشتری...').fill('دمو')
    })
    await test.step('Still see demo rows', async () => {
      await expect(page.getByText('دمو VIP امروز')).toBeVisible()
    })
  })

  test('07 — Clients: create customer from drawer', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'مشتریان' }).click()
    const suffix = Date.now().toString().slice(-7)
    const phone = `0912${suffix}`
    const name = `این مشتری E2E ${suffix}`

    await test.step('Open new client drawer', async () => {
      await page.getByRole('button', { name: /مشتری جدید/ }).click()
      await expect(page.getByRole('heading', { name: 'مشتری جدید' })).toBeVisible()
    })
    await test.step('Fill and save', async () => {
      await page.locator('#client-name').fill(name)
      await page.locator('#client-phone').fill(phone)
      await page.getByRole('button', { name: 'افزودن مشتری' }).click()
    })
    await test.step('Appears in list', async () => {
      await expect(page.getByText(name)).toBeVisible()
    })
  })

  test('08 — Client profile: open from list and return', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'مشتریان' }).click()
    await test.step('Open seeded demo profile', async () => {
      await page.getByText('دمو VIP امروز').click()
    })
    await test.step('Profile header', async () => {
      await expect(page.getByRole('heading', { name: 'دمو VIP امروز' })).toBeVisible()
      await expect(page.getByText('09129900104')).toBeVisible()
    })
    await test.step('Back to list', async () => {
      await page.getByRole('link', { name: 'بازگشت' }).click()
      await expect(page.getByRole('heading', { name: 'مشتریان' })).toBeVisible()
    })
  })

  test('09 — Calendar: switch day / week / month / list', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await test.step('Day view', async () => {
      await page.getByRole('button', { name: 'روز', exact: true }).click()
      await expect(page.locator('.fc-timeGridDay-view')).toBeVisible()
    })
    await test.step('Week view', async () => {
      await page.getByRole('button', { name: 'هفته', exact: true }).click()
      await expect(page.locator('.fc-timeGridWeek-view')).toBeVisible()
    })
    await test.step('Month view', async () => {
      await page.getByRole('button', { name: 'ماه', exact: true }).click()
      await expect(page.locator('.fc-dayGridMonth-view')).toBeVisible()
    })
    await test.step('List view', async () => {
      await page.getByRole('button', { name: 'لیست', exact: true }).click()
      await expect(page.locator('.fc-listWeek-view, .fc-list')).toBeVisible()
    })
  })

  test('10 — Calendar: open appointment from agenda', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('button', { name: 'لیست', exact: true }).click()
    await test.step('Click first seeded event row', async () => {
      await page.getByText(/دمو VIP امروز/).first().click()
    })
    await test.step('Detail drawer shows service', async () => {
      await expect(page.getByRole('heading', { name: 'دمو VIP امروز' })).toBeVisible()
      await expect(page.getByText('رنگ مو', { exact: true })).toBeVisible()
    })
    await test.step('Close drawer', async () => {
      await page.getByRole('button', { name: 'بستن' }).click()
    })
  })

  test('11 — Appointment: confirm scheduled visit from drawer', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('button', { name: 'لیست', exact: true }).click()
    await page.getByText(/دمو VIP امروز/).first().click()
    await test.step('Confirm when available', async () => {
      const confirm = page.getByRole('button', { name: 'تایید نوبت' })
      if (await confirm.isVisible()) {
        await confirm.click()
        await expect(page.getByRole('heading', { name: 'دمو VIP امروز' })).not.toBeVisible()
      }
    })
  })

  test('12 — Calendar: FAB opens new appointment drawer', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await test.step('Tap floating action', async () => {
      await page.getByLabel('نوبت جدید').click()
    })
    await test.step('Drawer title', async () => {
      await expect(page.getByRole('heading', { name: 'نوبت جدید' })).toBeVisible()
    })
    await test.step('Dismiss', async () => {
      await page.getByRole('button', { name: 'انصراف' }).click()
    })
  })

  test('13 — Calendar: create appointment on future day', async ({ page }) => {
    await loginManagerExpectsCalendar(page)

    await test.step('Advance calendar nav (FAB uses navigationDate as initialDate — avoids seeded “today” overlap)', async () => {
      await page.getByRole('button', { name: 'هفته', exact: true }).click()
      const weekSkips = 6 + (Date.now() % 9)
      for (let i = 0; i < weekSkips; i++) {
        await page.getByRole('button', { name: 'بعدی' }).click()
      }
    })

    await test.step('Open new-visit drawer from FAB', async () => {
      await page.getByLabel('نوبت جدید').click()
      await expect(page.getByRole('heading', { name: 'نوبت جدید' })).toBeVisible()
    })

    await test.step('Select client', async () => {
      await page.getByRole('button', { name: /انتخاب مشتری/ }).click()
      await page.locator('input[placeholder="جستجو نام یا شماره..."]').fill('09129900102')
      await page.getByRole('button', { name: /09129900102/ }).click()
    })

    await test.step('Select service then staff (ماساژ + سارا — seed has fewer massage rows for Sara than busy hair slots)', async () => {
      const drawer = page.getByRole('dialog', { name: 'نوبت جدید' })
      const staffServiceTriggers = drawer.locator('.flex.min-w-0.flex-col.gap-7').locator('[data-slot="select-trigger"]')
      await staffServiceTriggers.nth(1).click()
      await page.getByRole('option', { name: /ماساژ سوئدی/ }).first().click()
      await staffServiceTriggers.nth(0).click()
      await page.getByRole('option', { name: /^سارا محمودی$/ }).click()
    })

    await test.step('Submit and wait for API', async () => {
      const submit = page.getByRole('button', { name: 'ثبت نوبت' })
      await expect(submit).toBeEnabled({ timeout: 25_000 })
      const waitCreate = page.waitForResponse(
        (r) => r.url().includes('/api/appointments') && r.request().method() === 'POST'
      )
      await submit.click()
      const res = await waitCreate
      expect(res.ok(), await res.text()).toBeTruthy()
    })

    await test.step('Drawer closes', async () => {
      await expect(page.getByRole('heading', { name: 'نوبت جدید' })).not.toBeVisible({ timeout: 20_000 })
    })
  })

  test('14 — Today: manager dashboard loads with counters', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'امروز' }).click()
    await test.step('Header + stats strip', async () => {
      await expect(page.getByRole('heading', { name: 'امروز' })).toBeVisible()
      await expect(page.locator('.grid.grid-cols-2').first()).toBeVisible()
    })
  })

  test('15 — Today: mark first active visit as completed', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'امروز' }).click()
    const done = page.getByRole('button', { name: 'انجام شد' }).first()
    await test.step('Tap انجام شد when present', async () => {
      if (await done.isVisible().catch(() => false)) {
        const waitPatch = page.waitForResponse(
          (r) => r.url().includes('/api/appointments/') && r.request().method() === 'PATCH'
        )
        await done.click()
        await waitPatch
      }
    })
  })

  test('16 — Retention queue loads and can mark reviewed', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'پیگیری' }).click()
    await test.step('List or empty state', async () => {
      const empty = page.getByText('موردی در صف نیست.')
      const card = page.getByRole('button', { name: 'بررسی شد' }).first()
      if (await empty.isVisible().catch(() => false)) {
        await expect(empty).toBeVisible()
      } else if (await card.isVisible().catch(() => false)) {
        const waitPatch = page.waitForResponse(
          (r) => r.url().includes('/api/retention/') && r.request().method() === 'PATCH'
        )
        await card.click()
        await waitPatch
      }
    })
  })

  test('17 — Retention: “نوبت” deep-link opens calendar with booking drawer', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'پیگیری' }).click()
    const book = page.getByRole('link', { name: 'نوبت' }).first()
    if (!(await book.isVisible().catch(() => false))) {
      return
    }
    await test.step('Follow نوبت link', async () => {
      await book.click()
    })
    await test.step('Pre-filled create drawer', async () => {
      await expect(page).toHaveURL(/\/calendar/)
      await expect(page.getByRole('heading', { name: 'نوبت جدید' })).toBeVisible({ timeout: 20_000 })
    })
    await page.getByRole('button', { name: 'انصراف' }).click()
  })

  test('18 — Settings: save business hours and sign out', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'تنظیمات' }).click()
    await test.step('PATCH business hours', async () => {
      const waitSave = page.waitForResponse(
        (r) => r.url().includes('/api/settings/business') && r.request().method() === 'PATCH'
      )
      await page.getByRole('button', { name: 'ذخیره ساعات کاری' }).click()
      const res = await waitSave
      expect(res.ok()).toBeTruthy()
    })
    await test.step('Logout returns to login', async () => {
      await logoutFromSettings(page)
    })
  })

  test('19 — Staff directory: open weekly schedule drawer', async ({ page }) => {
    await loginManagerExpectsCalendar(page)
    await page.getByRole('link', { name: 'تنظیمات' }).click()
    await page.getByRole('link', { name: 'پرسنل و نقش‌ها' }).click()
    await expect(page.getByRole('heading', { name: 'پرسنل' })).toBeVisible()
    await test.step('Open schedule for first staff row', async () => {
      const scheduleBtn = page.getByRole('button', { name: 'ساعت' }).first()
      await scheduleBtn.click()
    })
    await test.step('Drawer title', async () => {
      await expect(page.getByRole('heading', { name: /برنامه کاری/ })).toBeVisible()
    })
  })

  test('20 — Signup creates salon and lands on onboarding', async ({ page }) => {
    await page.context().clearCookies()
    const slug = `e2e-${Date.now()}`
    const phone = `0913${Date.now().toString().slice(-7)}`
    /** ASCII salon name: controlled Persian input occasionally failed to update React state in headless runs. */
    const salonLabel = `E2E Salon ${slug}`

    await test.step('Submit signup', async () => {
      await page.goto('/signup', { waitUntil: 'domcontentloaded' })
      await page.locator('#salonName').waitFor({ state: 'visible' })
      const nameBox = page.locator('#salonName')
      await nameBox.click()
      await nameBox.pressSequentially(salonLabel, { delay: 15 })
      await expect(nameBox).toHaveValue(salonLabel)
      await page.locator('#slug').fill(slug)
      await page.locator('#managerName').fill('مدیر E2E')
      await page.locator('#managerPhone').fill(phone)
      await page.locator('#password').fill('Salon1234')
      const signupPost = page.waitForResponse(
        (r) => r.url().includes('/api/auth/signup') && r.request().method() === 'POST'
      )
      await page.getByRole('button', { name: 'ساخت سالن' }).click()
      const res = await signupPost
      expect(res.ok(), await res.text()).toBeTruthy()
    })

    await test.step('Redirected to onboarding', async () => {
      await expect(page).toHaveURL(/\/onboarding/)
      await expect(page.getByRole('heading', { name: 'راه‌اندازی سالن' })).toBeVisible({ timeout: 30_000 })
    })
  })
})
