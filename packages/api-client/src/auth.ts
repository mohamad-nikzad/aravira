import type { User } from '@repo/salon-core/types'
import type { LoginFormPayload, SignupFormPayload } from '@repo/salon-core/forms/auth'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type LoginInput = LoginFormPayload

export type MeResponse = {
  user: User
}

export type LoginResponse = MeResponse

export type SignupInput = SignupFormPayload

export type SignupResponse = {
  user: User
  salon: { id: string; name: string; slug: string }
  redirectTo?: string
}

export function createAuthApi(client: ApiClient) {
  function me(opts: { signal?: AbortSignal } = {}) {
    return client.request<MeResponse>(endpoints.auth.me, { signal: opts.signal })
  }

  return {
    me,
    // Better Auth username sign-in sets the session cookie; we then resolve the
    // full legacy `User` via the `/me` shim so callers keep the old contract.
    async login(input: LoginInput): Promise<LoginResponse> {
      await client.request(endpoints.auth.signIn, {
        method: 'POST',
        body: { username: input.phone, password: input.password },
      })
      return me()
    },
    // The signup wrapper creates the org + sidecars and sets the session cookie;
    // `/me` then yields the full `User` (role/salonId resolved server-side).
    async signup(input: SignupInput): Promise<SignupResponse> {
      const created = await client.request<{
        salon: { id: string; name: string; slug: string }
        redirectTo?: string
      }>(endpoints.auth.signup, { method: 'POST', body: input })
      const { user } = await me()
      return { user, salon: created.salon, redirectTo: created.redirectTo }
    },
    logout() {
      // Better Auth's /sign-out requires a JSON content-type; the client only
      // sets it when a body is present, so send an empty object.
      return client.request<{ success: boolean }>(endpoints.auth.signOut, {
        method: 'POST',
        body: {},
      })
    },
  }
}

export type AuthApi = ReturnType<typeof createAuthApi>
