import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type { User } from '@repo/salon-core/types'
import { normalizePhone } from '@repo/salon-core/phone'
import { getDb } from '../client'
import { users } from '../schema'
import { rowToUser } from './row-mappers'

export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, normalized), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  return row ? rowToUser(row) : undefined
}

export async function getUserWithPasswordByPhone(
  phone: string
): Promise<(User & { passwordHash: string }) | undefined> {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, normalized), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  if (!row) return undefined
  return { ...rowToUser(row), passwordHash: row.passwordHash }
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  return row ? rowToUser(row) : undefined
}

export async function createUser(
  input: Omit<User, 'id' | 'createdAt'> & { password: string }
): Promise<User> {
  const db = getDb()
  const normalized = normalizePhone(input.phone)
  const hashedPassword = bcrypt.hashSync(input.password, 10)
  const [row] = await db
    .insert(users)
    .values({
      salonId: input.salonId,
      name: input.name,
      phone: normalized,
      passwordHash: hashedPassword,
      role: input.role,
      color: input.color,
      active: true,
    })
    .returning()
  return rowToUser(row)
}
