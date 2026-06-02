import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type OnboardingStatus = {
  salon: {
    id: string
    name: string
    slug: string
    phone: string | null
    address: string | null
  } | null
  steps: {
    businessHoursSet: boolean
    servicesAdded: boolean
    staffAdded: boolean
    presenceSet: boolean
    publicPageConfigured: boolean
    notificationsConfigured: boolean
  }
  completedAt: Date | null
  skippedAt: Date | null
}

export type OnboardingAction =
  | 'complete'
  | 'skip'
  | 'reopen'
  | 'set-manager-staff'
  | 'confirm-business-hours'

export type OnboardingResponse = {
  onboarding: OnboardingStatus
}

export function createOnboardingApi(client: ApiClient) {
  return {
    get(opts: { signal?: AbortSignal } = {}) {
      return client.request<OnboardingResponse>(endpoints.onboarding, {
        signal: opts.signal,
      })
    },
    update(action: OnboardingAction, opts: { signal?: AbortSignal } = {}) {
      return client.request<OnboardingResponse>(endpoints.onboarding, {
        method: 'PATCH',
        body: { action },
        signal: opts.signal,
      })
    },
  }
}

export type OnboardingApi = ReturnType<typeof createOnboardingApi>
