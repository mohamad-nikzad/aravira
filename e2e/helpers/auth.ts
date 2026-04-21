import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const SEEDED_MANAGER = { phone: '09120000000', password: 'admin123' }
export const SEEDED_STAFF = { phone: '09120000001', password: 'admin123' }

export async function login(page: Page, phone: string, password: string) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'آراویرا' })).toBeVisible()
  const phoneBox = page.getByRole('textbox', { name: 'شماره موبایل' })
  const passBox = page.getByRole('textbox', { name: 'رمز عبور' })
  await phoneBox.click()
  await phoneBox.fill(phone)
  await passBox.click()
  await passBox.fill(password)
  const [loginRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'ورود' }).click(),
  ])
  if (!loginRes.ok()) {
    throw new Error(`Login API ${loginRes.status()}: ${await loginRes.text()}`)
  }
  await page.waitForURL(/\/(dashboard|calendar)/, { timeout: 30_000 })
}

export async function loginManagerExpectsDashboard(page: Page) {
  await login(page, SEEDED_MANAGER.phone, SEEDED_MANAGER.password)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'داشبورد' })).toBeVisible()
}

export async function loginManagerExpectsCalendar(page: Page) {
  await loginManagerExpectsDashboard(page)
  await page.getByRole('link', { name: 'تقویم' }).click()
  await expect(page).toHaveURL(/\/calendar/)
  await expect(page.locator('.calendar-header-gradient')).toBeVisible()
}

export async function loginStaffExpectsCalendar(page: Page) {
  await login(page, SEEDED_STAFF.phone, SEEDED_STAFF.password)
  await expect(page).toHaveURL(/\/calendar/)
}

export async function logoutFromSettings(page: Page) {
  await page.goto('/settings')
  await page.getByRole('button', { name: /خروج از حساب/ }).click()
  await expect(page).toHaveURL(/\/login/)
}
