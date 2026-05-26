import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import {
  createSession,
  getCurrentUserFromRequest,
  login,
} from '@repo/auth/auth'
import {
  createSalonWorkspace,
  SignupConflictError,
  SignupValidationError,
} from '@repo/auth/signup'
import { loginSchema, signupSchema } from '@repo/salon-core/forms/auth'
import type { AppEnv } from '../factory'
import { zValidator } from '../lib/validate'
import { error, ok } from '../lib/responses'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  // SameSite=None + Secure so the cookie travels on cross-origin requests
  // from the PWA (app.saloora.beauty → api.saloora.beauty in prod, and
  // http://localhost:<pwa-port> → http://localhost:<api-port> in dev).
  // Browsers treat localhost as a secure context, so Secure works over plain
  // http://localhost without HTTPS.
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export const auth = new Hono<AppEnv>()
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const { phone, password } = c.req.valid('json')
    const result = await login(phone, password)
    if (!result) {
      return error(c, 'شماره موبایل یا رمز عبور اشتباه است', 401)
    }
    setSessionCookie(c, result.token)
    return ok(c, { user: result.user, token: result.token })
  })
  .post('/logout', async (c) => {
    deleteCookie(c, 'session', { path: '/', secure: true, sameSite: 'None' })
    return ok(c, { success: true })
  })
  .get('/me', async (c) => {
    const user = await getCurrentUserFromRequest(c.req.raw)
    if (!user) return error(c, 'وارد نشده‌اید', 401)
    return ok(c, { user })
  })
  .post('/signup', zValidator('json', signupSchema), async (c) => {
    try {
      const result = await createSalonWorkspace(c.req.valid('json'))
      const token = await createSession(result.user.id)
      setSessionCookie(c, token)
      return ok(c, {
        salon: result.salon,
        user: result.user,
        token,
        redirectTo: '/onboarding',
      })
    } catch (err) {
      if (err instanceof SignupValidationError) {
        return error(c, err.message, 400)
      }
      if (err instanceof SignupConflictError) {
        return error(c, err.message, 409)
      }
      throw err
    }
  })

export type AuthRoute = typeof auth
