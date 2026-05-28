import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { member, user } from '../schema'

export type MemberContext = {
  userId: string
  organizationId: string
  role: string
  name: string
  username: string
}

/**
 * The single membership for a user, joined with the user's profile fields the
 * tenant middleware needs. The one-salon-per-user model means a user has at most
 * one `member` row, so we return the first match. Reading name/username from the
 * DB keeps the tenant context authoritative and independent of session inference.
 */
export async function getMemberForUser(userId: string): Promise<MemberContext | undefined> {
  const db = getDb()
  const rows = await db
    .select({
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role,
      name: user.name,
      username: user.username,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.userId, userId))
    .limit(1)
  const row = rows[0]
  if (!row) return undefined
  return { ...row, username: row.username ?? '' }
}
