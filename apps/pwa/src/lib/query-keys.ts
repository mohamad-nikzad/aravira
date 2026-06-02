export const dashboardQueryKey = ['dashboard'] as const
export const notificationPreferencesQueryKey = [
  'notification-preferences',
] as const
export const salonPublicSettingsQueryKey = ['salon-public-settings'] as const
export const salonPresenceQueryKey = ['salon-profile', 'presence'] as const
export const onboardingQueryKey = ['onboarding'] as const
export const messagingAccountsQueryKey = ['messaging', 'accounts'] as const

export const managerStaffQueryKey = ['manager', 'staff'] as const
export const managerServicesQueryKey = ['manager', 'services'] as const
export const managerServiceCatalogQueryKey = [
  'manager',
  'service-catalog',
] as const
export const managerBusinessSettingsQueryKey = [
  'manager',
  'business-settings',
] as const
export const managerAddonsQueryKey = ['manager', 'addons'] as const

export function serviceAddonsQueryKey(serviceId: string) {
  return ['services', 'addons', serviceId] as const
}

export function staffScheduleBundleQueryKey(staffId: string) {
  return ['manager', 'staff-schedule-bundle', staffId] as const
}

export function comboComponentsQueryKey(serviceId: string) {
  return ['manager', 'combo-components', serviceId] as const
}

export const catalogPresetsQueryKey = ['catalog-presets'] as const

export function staffBookingAvailabilityQueryKey(params: {
  date: string
  startTime: string
  endTime: string
}) {
  return [
    'staff',
    'booking-availability',
    params.date,
    params.startTime,
    params.endTime,
  ] as const
}
