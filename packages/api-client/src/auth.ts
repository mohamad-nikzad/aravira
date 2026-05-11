import type { User } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type LoginInput = {
  phone: string
  password: string
}

export type LoginResponse = {
  user: User
  token: string
}

export type SignupInput = {
  salonName: string
  slug: string
  managerName: string
  managerPhone: string
  password: string
}

export type SignupResponse = {
  user: User
  token: string
  salon: { id: string; name: string; slug: string }
  redirectTo?: string
}

export type MeResponse = {
  user: User
}

export function createAuthApi(client: ApiClient) {
  return {
    login(input: LoginInput) {
      return client.request<LoginResponse>(endpoints.auth.login, {
        method: 'POST',
        body: input,
      })
    },
    signup(input: SignupInput) {
      return client.request<SignupResponse>(endpoints.auth.signup, {
        method: 'POST',
        body: input,
      })
    },
    me(opts: { signal?: AbortSignal } = {}) {
      return client.request<MeResponse>(endpoints.auth.me, { signal: opts.signal })
    },
    logout() {
      return client.request<{ success: boolean }>(endpoints.auth.logout, {
        method: 'POST',
      })
    },
  }
}

export type AuthApi = ReturnType<typeof createAuthApi>
