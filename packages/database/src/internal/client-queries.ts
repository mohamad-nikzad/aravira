import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Client, ClientTag } from '@repo/salon-core/types'
import { normalizePhone } from '@repo/salon-core/phone'
import { getDb } from '../client'
import { clients, clientTags } from '../schema'
import { rowToClient, rowToClientTag } from './row-mappers'

function mapTagsByClient(rows: ClientTag[]): Map<string, ClientTag[]> {
  const byClient = new Map<string, ClientTag[]>()
  for (const tag of rows) {
    const list = byClient.get(tag.clientId) ?? []
    list.push(tag)
    byClient.set(tag.clientId, list)
  }
  return byClient
}

export async function getAllClients(
  salonId: string,
  options: { includePlaceholders?: boolean } = {}
): Promise<Client[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.salonId, salonId),
        options.includePlaceholders ? undefined : eq(clients.isPlaceholder, false)
      )
    )
    .orderBy(asc(clients.name))
  if (rows.length === 0) return []

  const tagRows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), inArray(clientTags.clientId, rows.map((r) => r.id))))
    .orderBy(asc(clientTags.label))
  const tagsByClient = mapTagsByClient(tagRows.map(rowToClientTag))

  return rows.map((row) => ({
    ...rowToClient(row),
    tags: tagsByClient.get(row.id) ?? [],
  }))
}

export async function getClientById(id: string, salonId: string): Promise<Client | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
    .limit(1)
  const row = rows[0]
  return row ? rowToClient(row) : undefined
}

export async function getClientByPhone(
  phone: string,
  salonId: string
): Promise<Client | undefined> {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.salonId, salonId), eq(clients.phone, normalized)))
    .limit(1)
  const row = rows[0]
  return row ? rowToClient(row) : undefined
}

/** Accepts caller-provided UUIDs for offline-first entities (must be a valid UUID v4 string). */
export function isClientProvidedEntityId(id: string | undefined): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(id)
  )
}

export async function createClient(
  input: {
    salonId: string
    id?: string
    name: string
    phone?: string | null
    notes?: string
    isPlaceholder?: boolean
  }
): Promise<Client> {
  const db = getDb()
  const values: typeof clients.$inferInsert = {
    salonId: input.salonId,
    name: input.name,
    phone: input.phone ? normalizePhone(input.phone) : null,
    isPlaceholder: input.isPlaceholder ?? false,
    notes: input.notes,
  }
  if (isClientProvidedEntityId(input.id)) {
    values.id = input.id
  }
  const [row] = await db.insert(clients).values(values).returning()
  return rowToClient(row)
}

export async function updateClient(
  id: string,
  salonId: string,
  data: Partial<Pick<Client, 'name' | 'phone' | 'notes' | 'isPlaceholder'>>
): Promise<Client | undefined> {
  const db = getDb()
  const patch: Partial<typeof clients.$inferInsert> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.phone !== undefined) patch.phone = data.phone ? normalizePhone(data.phone) : null
  if (data.notes !== undefined) patch.notes = data.notes
  if (data.isPlaceholder !== undefined) patch.isPlaceholder = data.isPlaceholder

  const [row] = await db
    .update(clients)
    .set(patch)
    .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
    .returning()
  return row ? rowToClient(row) : undefined
}

export async function deleteClient(id: string, salonId: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
    .returning({ id: clients.id })
  return deleted.length > 0
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-800 border-amber-200',
  'حساسیت': 'bg-rose-100 text-rose-800 border-rose-200',
  'رنگ خاص': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'نیاز به پیگیری': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'بدقول': 'bg-orange-100 text-orange-800 border-orange-200',
}

export async function getClientTags(clientId: string, salonId: string): Promise<ClientTag[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), eq(clientTags.clientId, clientId)))
    .orderBy(asc(clientTags.label))
  return rows.map(rowToClientTag)
}

export async function getClientTagsForClients(
  clientIds: string[],
  salonId: string
): Promise<Map<string, ClientTag[]>> {
  if (clientIds.length === 0) return new Map()
  const db = getDb()
  const rows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), inArray(clientTags.clientId, clientIds)))
    .orderBy(asc(clientTags.label))
  return mapTagsByClient(rows.map(rowToClientTag))
}

export async function setClientTags(
  clientId: string,
  salonId: string,
  labels: string[]
): Promise<ClientTag[]> {
  const db = getDb()
  const normalized = [...new Set(labels.map((l) => l.trim()).filter(Boolean))].slice(0, 8)

  await db.transaction(async (tx) => {
    await tx
      .delete(clientTags)
      .where(and(eq(clientTags.salonId, salonId), eq(clientTags.clientId, clientId)))

    if (normalized.length > 0) {
      await tx.insert(clientTags).values(
        normalized.map((label) => ({
          salonId,
          clientId,
          label,
          color: tagColors[label] ?? 'bg-muted text-foreground border-border',
        }))
      )
    }
  })

  return getClientTags(clientId, salonId)
}
