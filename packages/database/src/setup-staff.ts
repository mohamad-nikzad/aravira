import { and, asc, eq, isNull } from 'drizzle-orm'
import { getDb } from './client'
import {
  member,
  appointmentRequests,
  appointments,
  salonMember,
  staffProfiles,
  staffSchedules,
  staffServices,
  user,
} from './schema'

export type SetupStaffScheduleInput = {
  dayOfWeek: number
  active: boolean
  workingStart: string
  workingEnd: string
}

export type CreateSetupStaffProfileInput = {
  salonId: string
  name: string
  phone: string
  color: string
  active: boolean
  schedule: SetupStaffScheduleInput[]
  serviceIds: string[] | null
}

export async function listSetupStaffProfiles(salonId: string) {
  const db = getDb()
  const profiles = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.salonId, salonId))
    .orderBy(asc(staffProfiles.name))

  if (profiles.length === 0) return []
  const [schedules, capabilities] = await Promise.all([
    db
      .select()
      .from(staffSchedules)
      .where(eq(staffSchedules.salonId, salonId))
      .orderBy(asc(staffSchedules.dayOfWeek)),
    db
      .select({
        staffId: staffServices.staffUserId,
        serviceId: staffServices.serviceId,
      })
      .from(staffServices)
      .where(eq(staffServices.salonId, salonId)),
  ])

  return profiles.map((profile) => ({
    ...profile,
    claimed: profile.userId !== null,
    schedule: schedules.filter((row) => row.staffId === profile.id),
    serviceIds: capabilities
      .filter((row) => row.staffId === profile.id)
      .map((row) => row.serviceId),
  }))
}

export async function createSetupStaffProfile(
  input: CreateSetupStaffProfileInput,
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(staffProfiles)
      .values({
        salonId: input.salonId,
        name: input.name,
        phone: input.phone,
        color: input.color,
        active: input.active,
      })
      .returning()
    if (!profile) throw new Error('staff profile creation failed')

    if (input.schedule.length > 0) {
      await tx.insert(staffSchedules).values(
        input.schedule.map((row) => ({
          salonId: input.salonId,
          staffId: profile.id,
          ...row,
        })),
      )
    }
    if (input.serviceIds && input.serviceIds.length > 0) {
      await tx.insert(staffServices).values(
        input.serviceIds.map((serviceId) => ({
          salonId: input.salonId,
          staffUserId: profile.id,
          serviceId,
        })),
      )
    }

    return profile
  })
}

export type StaffProfileClaimResult =
  | { status: 'none' }
  | { status: 'claimed'; profileId: string; salonId: string }
  | {
      status: 'rejected'
      reason: 'ambiguous' | 'already_claimed' | 'ineligible' | 'phone_mismatch'
    }

type ClaimCandidate = typeof staffProfiles.$inferSelect

export function evaluateStaffProfileClaim(input: {
  identity:
    | { phoneNumber: string | null; username: string | null; verified: boolean }
    | undefined
  phone: string
  userId: string
  matches: ClaimCandidate[]
  membershipSalonIds: string[]
}):
  | { status: 'candidate'; profile: ClaimCandidate }
  | Exclude<StaffProfileClaimResult, { status: 'claimed' }> {
  if (
    !input.identity?.verified ||
    (input.identity.phoneNumber !== input.phone &&
      input.identity.username !== input.phone)
  ) {
    return { status: 'rejected', reason: 'phone_mismatch' }
  }
  if (input.matches.length === 0) return { status: 'none' }
  if (input.matches.length > 1) {
    return { status: 'rejected', reason: 'ambiguous' }
  }
  const profile = input.matches[0]!
  if (profile.userId && profile.userId !== input.userId) {
    return { status: 'rejected', reason: 'already_claimed' }
  }
  if (input.membershipSalonIds.some((salonId) => salonId !== profile.salonId)) {
    return { status: 'rejected', reason: 'ineligible' }
  }
  return { status: 'candidate', profile }
}

export async function claimStaffProfile(input: {
  userId: string
  phone: string
}): Promise<StaffProfileClaimResult> {
  const db = getDb()
  return db.transaction(async (tx) => {
    const identityRows = await tx
      .select({
        phoneNumber: user.phoneNumber,
        username: user.username,
        verified: user.phoneNumberVerified,
      })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1)
    const identity = identityRows[0]
    const matches = await tx
      .select()
      .from(staffProfiles)
      .where(
        and(
          eq(staffProfiles.phone, input.phone),
          eq(staffProfiles.active, true),
        ),
      )
    const memberships = await tx
      .select({ salonId: member.organizationId })
      .from(member)
      .where(eq(member.userId, input.userId))
    const decision = evaluateStaffProfileClaim({
      identity,
      phone: input.phone,
      userId: input.userId,
      matches,
      membershipSalonIds: memberships.map((row) => row.salonId),
    })
    if (decision.status !== 'candidate') return decision
    const { profile } = decision

    if (!profile.userId) {
      const [claimed] = await tx
        .update(staffProfiles)
        .set({
          userId: input.userId,
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(staffProfiles.id, profile.id),
            eq(staffProfiles.phone, input.phone),
            isNull(staffProfiles.userId),
          ),
        )
        .returning({ id: staffProfiles.id })
      if (!claimed) return { status: 'rejected', reason: 'already_claimed' }
    }

    if (!memberships.some((row) => row.salonId === profile.salonId)) {
      await tx.insert(member).values({
        organizationId: profile.salonId,
        userId: input.userId,
        role: 'member',
      })
    }
    await tx
      .insert(salonMember)
      .values({
        organizationId: profile.salonId,
        userId: input.userId,
        displayName: profile.name,
        color: profile.color,
        active: profile.active,
      })
      .onConflictDoUpdate({
        target: [salonMember.userId, salonMember.organizationId],
        set: {
          displayName: profile.name,
          color: profile.color,
          active: profile.active,
        },
      })

    // Preserve compatibility with existing manager-created staff by switching
    // operational references to the verified identity in the same transaction.
    await Promise.all([
      tx
        .update(staffSchedules)
        .set({ staffId: input.userId, updatedAt: new Date() })
        .where(eq(staffSchedules.staffId, profile.id)),
      tx
        .update(staffServices)
        .set({ staffUserId: input.userId })
        .where(eq(staffServices.staffUserId, profile.id)),
      tx
        .update(appointments)
        .set({ staffId: input.userId, updatedAt: new Date() })
        .where(eq(appointments.staffId, profile.id)),
      tx
        .update(appointmentRequests)
        .set({ staffId: input.userId, updatedAt: new Date() })
        .where(eq(appointmentRequests.staffId, profile.id)),
    ])

    return {
      status: 'claimed',
      profileId: profile.id,
      salonId: profile.salonId,
    }
  })
}

export async function getStaffProfileForUser(userId: string) {
  const rows = await getDb()
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, userId))
    .limit(1)
  return rows[0]
}
