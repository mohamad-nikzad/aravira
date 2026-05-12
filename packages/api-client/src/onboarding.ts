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
    profileConfirmed: boolean
    businessHoursSet: boolean
    servicesAdded: boolean
    staffAdded: boolean
    firstAppointmentCreated: boolean
  }
  completedAt: Date | null
  skippedAt: Date | null
}

export type OnboardingAction = 'confirm-profile' | 'complete' | 'skip' | 'reopen'

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
