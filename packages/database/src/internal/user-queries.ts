import { and, eq, isNull, or } from 'drizzle-orm'
import type { User } from '@repo/salon-core/types'
import { getDb } from '../client'
import { member, salonMember, user } from '../schema'
import { rowToUser, staffUserSelect } from './row-mappers'

/**
 * Resolve a user by id into the legacy `User` shape, joining the user's single
 * membership (role + salon) and the optional `salon_member` color sidecar.
 * Inactive members (`salon_member.active = false`) are excluded.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb()
  const rows = await db
    .select(staffUserSelect)
    .from(user)
    .innerJoin(member, eq(member.userId, user.id))
    .leftJoin(
      salonMember,
      and(eq(salonMember.userId, user.id), eq(salonMember.organizationId, member.organizationId))
    )
    .where(
      and(
        eq(user.id, id),
        or(isNull(salonMember.active), eq(salonMember.active, true))
      )
    )
    .limit(1)
  const row = rows[0]
  return row ? rowToUser(row) : undefined
}
