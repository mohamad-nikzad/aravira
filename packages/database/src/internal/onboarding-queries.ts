import { and, count, eq } from 'drizzle-orm'
import { getDb } from '../client'
import {
  appointments,
  businessSettings,
  salonOnboarding,
  salons,
  services,
  users,
} from '../schema'

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

export async function getOnboardingStatus(salonId: string): Promise<OnboardingStatus> {
  const db = getDb()

  const [
    salonRows,
    onboardingRows,
    settingsCount,
    serviceCount,
    staffCount,
    appointmentCount,
  ] = await Promise.all([
    db
      .select({
        id: salons.id,
        name: salons.name,
        slug: salons.slug,
        phone: salons.phone,
        address: salons.address,
      })
      .from(salons)
      .where(eq(salons.id, salonId))
      .limit(1),

    db
      .select()
      .from(salonOnboarding)
      .where(eq(salonOnboarding.salonId, salonId))
      .limit(1),

    db
      .select({ value: count() })
      .from(businessSettings)
      .where(eq(businessSettings.salonId, salonId)),

    db
      .select({ value: count() })
      .from(services)
      .where(and(eq(services.salonId, salonId), eq(services.active, true))),

    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.salonId, salonId), eq(users.role, 'staff'), eq(users.active, true))),

    db
      .select({ value: count() })
      .from(appointments)
      .where(eq(appointments.salonId, salonId)),
  ])

  const onboarding = onboardingRows[0]

  return {
    salon: salonRows[0] ?? null,
    steps: {
      profileConfirmed: !!onboarding?.profileConfirmedAt,
      businessHoursSet: (settingsCount[0]?.value ?? 0) > 0,
      servicesAdded: (serviceCount[0]?.value ?? 0) > 0,
      staffAdded: (staffCount[0]?.value ?? 0) > 0,
      firstAppointmentCreated: (appointmentCount[0]?.value ?? 0) > 0,
    },
    completedAt: onboarding?.completedAt ?? null,
    skippedAt: onboarding?.skippedAt ?? null,
  }
}

export async function updateOnboardingState(
  salonId: string,
  action: OnboardingAction
): Promise<OnboardingStatus> {
  const db = getDb()
  const now = new Date()

  if (action === 'reopen') {
    await db
      .insert(salonOnboarding)
      .values({
        salonId,
        completedAt: null,
        skippedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: salonOnboarding.salonId,
        set: {
          completedAt: null,
          skippedAt: null,
          updatedAt: now,
        },
      })
    return getOnboardingStatus(salonId)
  }

  await db
    .insert(salonOnboarding)
    .values({
      salonId,
      profileConfirmedAt: action === 'confirm-profile' ? now : null,
      completedAt: action === 'complete' ? now : null,
      skippedAt: action === 'skip' ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: salonOnboarding.salonId,
      set: {
        ...(action === 'confirm-profile' ? { profileConfirmedAt: now } : {}),
        ...(action === 'complete' ? { completedAt: now, skippedAt: null } : {}),
        ...(action === 'skip' ? { skippedAt: now, completedAt: null } : {}),
        updatedAt: now,
      },
    })

  return getOnboardingStatus(salonId)
}
