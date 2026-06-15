import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { auth } from '@repo/auth/server'
import { getDb } from '@repo/database/client'
import {
  businessSettings,
  organization,
  salonMember,
  salonProfile,
  user,
} from '@repo/database/schema'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { STAFF_COLORS } from '@repo/salon-core/types'
import { signupSchema } from '@repo/salon-core/forms/auth'
import { getManagerOnboardingFlags } from '@repo/database/onboarding'
import { getUserWithServiceIds } from '@repo/database/staff'
import type { AppEnv } from '../factory'
import { requireTenant } from '../middleware/auth'
import { zValidator } from '../lib/validate'
import { brand } from '@repo/brand'
import { error, ok } from '../lib/responses'

const OWNER_COLOR = normalizeCalendarColorId(STAFF_COLORS[0])

function phoneToEmail(phone: string): string {
  return `${phone}@${brand.emailLocalDomain}`
}

function forwardSetCookie(c: Parameters<typeof ok>[0], headers: Headers) {
  // Better Auth sets multiple cookies on signup (the 7-day `session_token` and,
  // with cookieCache enabled, a short-lived `session_data` cache cookie). A
  // plain `headers.get('set-cookie')` collapses them into one comma-joined
  // string the browser can't parse, dropping the real session token — so the
  // session silently dies once the 60s cache cookie expires. Forward each
  // Set-Cookie header individually instead.
  for (const cookie of headers.getSetCookie()) {
    c.header('Set-Cookie', cookie, { append: true })
  }
}

/**
 * Salon names are entered in Persian, which can't form a Latin URL slug, so we
 * mint a unique placeholder at signup. The owner picks a friendly booking link
 * later in onboarding.
 */
async function generateUniqueSlug(
  db: ReturnType<typeof getDb>,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = `salon-${Math.random().toString(36).slice(2, 8)}`
    const taken = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1)
    if (!taken[0]) return slug
  }
  throw new Error('could not generate a unique salon slug')
}

function isConflict(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : ''
  return (
    msg.includes('already') ||
    msg.includes('exists') ||
    msg.includes('duplicate') ||
    msg.includes('unique')
  )
}

/**
 * Signup wrapper: creates the owner user via Better Auth, then the salon
 * organization, sidecars, and initial business hours. The Better Auth sign-in
 * cookie is forwarded onto our response so the PWA is logged in immediately.
 *
 * Login / logout / get-session are served directly by the mounted Better Auth
 * handler at /api/v1/auth/sign-in/*, /sign-out, /get-session.
 *
 * `/me` is a shim that resolves the Better Auth session into the legacy `User`
 * shape (role mapped, salonId + color from the member/sidecar rows) so the PWA
 * auth layer stays unchanged.
 */
export const authRoute = new Hono<AppEnv>()
  .get('/me', requireTenant(), async (c) => {
    const { userId, salonId } = c.var.tenant
    const user = await getUserWithServiceIds(userId, salonId)
    if (!user) return error(c, 'وارد نشده‌اید', 401)

    if (user.role === 'manager') {
      const flags = await getManagerOnboardingFlags(salonId)
      return ok(c, {
        user: {
          ...user,
          needsOnboarding: flags.needsOnboarding,
          onboardingCompleted: flags.onboardingCompleted,
        },
      })
    }

    return ok(c, { user })
  })
  .post(
  '/signup',
  zValidator('json', signupSchema),
  async (c) => {
    const {
      salonName,
      slug: requestedSlug,
      managerName,
      managerPhone,
      password,
    } = c.req.valid('json')
    const db = getDb()

    let slug: string
    if (requestedSlug) {
      // A client-chosen slug must be free before we create the user, so a clash
      // can't leave an orphaned user with no organization behind.
      const existingSlug = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.slug, requestedSlug))
        .limit(1)
      if (existingSlug[0]) {
        return error(c, 'این آدرس سالن قبلاً ثبت شده است', 409)
      }
      slug = requestedSlug
    } else {
      slug = await generateUniqueSlug(db)
    }

    let signUpRes: Response
    try {
      signUpRes = await auth.api.signUpEmail({
        body: {
          email: phoneToEmail(managerPhone),
          password,
          name: managerName,
          username: managerPhone,
        },
        asResponse: true,
      })
    } catch (err) {
      if (isConflict(err)) {
        return error(c, 'این شماره موبایل قبلاً ثبت شده است', 409)
      }
      throw err
    }
    if (!signUpRes.ok) {
      if (signUpRes.status === 409 || signUpRes.status === 422) {
        return error(c, 'این شماره موبایل قبلاً ثبت شده است', 409)
      }
      return error(c, 'ثبت‌نام ناموفق بود', 400)
    }
    const signUpBody = (await signUpRes.json()) as {
      user: { id: string }
    }
    const userId = signUpBody.user.id
    await db
      .update(user)
      .set({
        phoneNumber: managerPhone,
        phoneNumberVerified: true,
        displayUsername: managerPhone,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    let orgId: string
    try {
      const createdOrg = await auth.api.createOrganization({
        body: { name: salonName, slug, userId },
      })
      if (!createdOrg) throw new Error('createOrganization returned empty')
      orgId = createdOrg.id
    } catch (err) {
      if (isConflict(err)) {
        return error(c, 'این آدرس سالن قبلاً ثبت شده است', 409)
      }
      throw err
    }

    await db.transaction(async (tx) => {
      await tx.insert(salonProfile).values({ organizationId: orgId })
      await tx.insert(salonMember).values({
        userId,
        organizationId: orgId,
        displayName: managerName,
        color: OWNER_COLOR,
        active: true,
      })
      await tx.insert(businessSettings).values({
        salonId: orgId,
        workingStart: '09:00',
        workingEnd: '19:00',
        slotDurationMinutes: 30,
      })
    })

    forwardSetCookie(c, signUpRes.headers)
    return ok(c, {
      salon: { id: orgId, name: salonName, slug },
      user: { id: userId, name: managerName, phone: managerPhone },
      redirectTo: '/onboarding',
    })
  }
)

export type AuthRoute = typeof authRoute
