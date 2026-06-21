import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  statusAfterMessage,
  type SupportMessageAuthorKind,
  type SupportTicketCategory,
  type SupportTicketStatus,
} from '@repo/salon-core/support-tickets'

import { getDb } from '../client'
import {
  member,
  organization,
  salonMember,
  supportMessages,
  supportTickets,
} from '../schema'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MESSAGE_LIMIT = 500
export const MANAGER_SUPPORT_NAME = 'پشتیبانی سالونا'

type TicketRow = typeof supportTickets.$inferSelect
type MessageRow = typeof supportMessages.$inferSelect

export type SupportTicketPagination = {
  page: number
  pageSize: number
  total: number
}

export type SupportTicketPage<T> = {
  items: T[]
  pagination: SupportTicketPagination
}

export type SupportMessagePreview = {
  body: string
  authorKind: SupportMessageAuthorKind
  authorDisplayName: string
}

export type ManagerSupportTicketListItem = Pick<
  TicketRow,
  'id' | 'category' | 'subject' | 'status' | 'lastActivityAt' | 'createdAt'
> & {
  managerHasUnread: boolean
  lastMessage: SupportMessagePreview | null
}

export type ManagerSupportMessage =
  | {
      id: string
      authorKind: 'manager'
      authorUserId: string
      authorDisplayName: string
      body: string
      createdAt: Date
    }
  | {
      id: string
      authorKind: 'platform'
      authorDisplayName: typeof MANAGER_SUPPORT_NAME
      body: string
      createdAt: Date
    }

export type ManagerSupportTicketDetail = {
  ticket: ManagerSupportTicket
  managerHasUnread: boolean
  messages: ManagerSupportMessage[]
  truncated: boolean
}

export type ManagerSupportTicket = Pick<
  TicketRow,
  | 'id'
  | 'salonId'
  | 'submittedByUserId'
  | 'category'
  | 'subject'
  | 'status'
  | 'lastActivityAt'
  | 'resolvedAt'
  | 'createdAt'
>

export type AdminSupportTicketListItem = Pick<
  TicketRow,
  'id' | 'category' | 'subject' | 'status' | 'lastActivityAt' | 'createdAt'
> & {
  salonId: string
  salonName: string
  submittedByUserId: string
  submittedByDisplayName: string
  platformHasUnread: boolean
  lastMessage: SupportMessagePreview | null
}

export type AdminSupportMessage = {
  id: string
  authorKind: SupportMessageAuthorKind
  authorUserId: string
  authorDisplayName: string
  body: string
  createdAt: Date
}

export type AdminSupportTicketDetail = {
  ticket: AdminSupportTicket
  platformHasUnread: boolean
  messages: AdminSupportMessage[]
  truncated: boolean
}

export type AdminSupportTicket = Pick<
  TicketRow,
  | 'id'
  | 'salonId'
  | 'submittedByUserId'
  | 'category'
  | 'subject'
  | 'status'
  | 'lastActivityAt'
  | 'resolvedAt'
  | 'resolvedByUserId'
  | 'createdAt'
> & {
  salonName: string
  submittedByDisplayName: string
}

export type TicketMutationResult = {
  previousStatus: SupportTicketStatus | null
  resultingStatus: SupportTicketStatus
  ticket: TicketRow
  message?: MessageRow
}

export type ResolveSupportTicketResult = TicketMutationResult & {
  changed: boolean
}

export type SupportTicketReadResult = {
  ticketId: string
  readAt: Date
}

export function normalizeSupportTicketPage(input: {
  page?: number
  pageSize?: number
}) {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
  )
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function escapedLikePattern(value: string) {
  return `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
}

export function hasUnread(
  lastIncomingMessageAt: Date | null,
  lastReadAt: Date | null,
) {
  return (
    lastIncomingMessageAt !== null &&
    (lastReadAt === null || lastReadAt < lastIncomingMessageAt)
  )
}

export function ticketUpdateAfterMessage(input: {
  currentStatus: SupportTicketStatus
  authorKind: SupportMessageAuthorKind
  authorUserId: string
  now: Date
  resolveAfter?: boolean
}) {
  const status = input.resolveAfter
    ? ('resolved' as const)
    : statusAfterMessage(input.currentStatus, input.authorKind)
  return {
    status,
    lastActivityAt: input.now,
    ...(input.authorKind === 'manager'
      ? { lastManagerMessageAt: input.now }
      : { lastPlatformMessageAt: input.now }),
    resolvedAt: input.resolveAfter ? input.now : null,
    resolvedByUserId: input.resolveAfter ? input.authorUserId : null,
  }
}

function unreadSql(lastMessageAt: AnyPgColumn, lastReadAt: AnyPgColumn) {
  return sql<boolean>`${lastMessageAt} is not null and (${lastReadAt} is null or ${lastReadAt} < ${lastMessageAt})`
}

export function managerSupportTicketScope(input: {
  salonId: string
  ticketId: string
}) {
  return and(
    eq(supportTickets.id, input.ticketId),
    eq(supportTickets.salonId, input.salonId),
  )!
}

export function projectManagerSupportMessage(
  row: MessageRow,
): ManagerSupportMessage {
  if (row.authorKind === 'platform') {
    return {
      id: row.id,
      authorKind: 'platform',
      authorDisplayName: MANAGER_SUPPORT_NAME,
      body: row.body,
      createdAt: row.createdAt,
    }
  }
  return {
    id: row.id,
    authorKind: 'manager',
    authorUserId: row.authorUserId,
    authorDisplayName: row.authorDisplayNameSnapshot,
    body: row.body,
    createdAt: row.createdAt,
  }
}

export function projectManagerSupportTicket(
  row: TicketRow,
): ManagerSupportTicket {
  return {
    id: row.id,
    salonId: row.salonId,
    submittedByUserId: row.submittedByUserId,
    category: row.category,
    subject: row.subject,
    status: row.status,
    lastActivityAt: row.lastActivityAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
  }
}

function adminMessageProjection(row: MessageRow): AdminSupportMessage {
  return {
    id: row.id,
    authorKind: row.authorKind,
    authorUserId: row.authorUserId,
    authorDisplayName: row.authorDisplayNameSnapshot,
    body: row.body,
    createdAt: row.createdAt,
  }
}

function preview(row: MessageRow | undefined, redactPlatform: boolean) {
  if (!row) return null
  return {
    body: Array.from(row.body).slice(0, 160).join(''),
    authorKind: row.authorKind,
    authorDisplayName:
      redactPlatform && row.authorKind === 'platform'
        ? MANAGER_SUPPORT_NAME
        : row.authorDisplayNameSnapshot,
  }
}

async function latestMessages(ticketIds: string[]) {
  if (ticketIds.length === 0) return new Map<string, MessageRow>()
  const db = getDb()
  const rows = await db
    .selectDistinctOn([supportMessages.ticketId])
    .from(supportMessages)
    .where(inArray(supportMessages.ticketId, ticketIds))
    .orderBy(
      supportMessages.ticketId,
      desc(supportMessages.createdAt),
      desc(supportMessages.id),
    )
  const byTicket = new Map<string, MessageRow>()
  for (const row of rows) {
    if (!byTicket.has(row.ticketId)) byTicket.set(row.ticketId, row)
  }
  return byTicket
}

async function firstMessages(ticketIds: string[]) {
  if (ticketIds.length === 0) return new Map<string, MessageRow>()
  const db = getDb()
  const rows = await db
    .selectDistinctOn([supportMessages.ticketId])
    .from(supportMessages)
    .where(inArray(supportMessages.ticketId, ticketIds))
    .orderBy(
      supportMessages.ticketId,
      asc(supportMessages.createdAt),
      asc(supportMessages.id),
    )
  const byTicket = new Map<string, MessageRow>()
  for (const row of rows) {
    if (!byTicket.has(row.ticketId)) byTicket.set(row.ticketId, row)
  }
  return byTicket
}

export async function createSupportTicket(input: {
  salonId: string
  submittedByUserId: string
  submittedByDisplayName: string
  category: SupportTicketCategory
  subject: string
  body: string
}): Promise<TicketMutationResult> {
  const db = getDb()
  return db.transaction(async (tx) => {
    const now = new Date()
    const [ticket] = await tx
      .insert(supportTickets)
      .values({
        salonId: input.salonId,
        submittedByUserId: input.submittedByUserId,
        category: input.category,
        subject: input.subject,
        status: 'open',
        lastActivityAt: now,
        lastManagerMessageAt: now,
        managerLastReadAt: now,
        createdAt: now,
      })
      .returning()
    if (!ticket) throw new Error('Support Ticket could not be created')
    const [message] = await tx
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        authorUserId: input.submittedByUserId,
        authorKind: 'manager',
        authorDisplayNameSnapshot: input.submittedByDisplayName,
        body: input.body,
        createdAt: now,
      })
      .returning()
    if (!message)
      throw new Error('Initial Support Message could not be created')
    return {
      previousStatus: null,
      resultingStatus: 'open',
      ticket,
      message,
    }
  })
}

export async function listSalonSupportTickets(input: {
  salonId: string
  page?: number
  pageSize?: number
}): Promise<SupportTicketPage<ManagerSupportTicketListItem>> {
  const db = getDb()
  const { page, pageSize, offset } = normalizeSupportTicketPage(input)
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.salonId, input.salonId))
      .orderBy(desc(supportTickets.lastActivityAt), desc(supportTickets.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(supportTickets)
      .where(eq(supportTickets.salonId, input.salonId)),
  ])
  const latest = await latestMessages(rows.map((row) => row.id))
  return {
    items: rows.map((row) => ({
      id: row.id,
      category: row.category,
      subject: row.subject,
      status: row.status,
      lastActivityAt: row.lastActivityAt,
      createdAt: row.createdAt,
      managerHasUnread: hasUnread(
        row.lastPlatformMessageAt,
        row.managerLastReadAt,
      ),
      lastMessage: preview(latest.get(row.id), true),
    })),
    pagination: { page, pageSize, total: totals[0]?.value ?? 0 },
  }
}

export async function getSalonSupportTicketDetail(input: {
  salonId: string
  ticketId: string
}): Promise<ManagerSupportTicketDetail | undefined> {
  const db = getDb()
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(managerSupportTicketScope(input))
    .limit(1)
  if (!ticket) return undefined
  const messages = (
    await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticket.id))
      .orderBy(desc(supportMessages.createdAt), desc(supportMessages.id))
      .limit(MESSAGE_LIMIT)
  ).reverse()
  return {
    ticket: projectManagerSupportTicket(ticket),
    managerHasUnread: hasUnread(
      ticket.lastPlatformMessageAt,
      ticket.managerLastReadAt,
    ),
    messages: messages.map(projectManagerSupportMessage),
    truncated: messages.length === MESSAGE_LIMIT,
  }
}

export async function getSalonSupportTicketSummary(salonId: string) {
  const db = getDb()
  const rows = await db
    .select({ value: count() })
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.salonId, salonId),
        unreadSql(
          supportTickets.lastPlatformMessageAt,
          supportTickets.managerLastReadAt,
        ),
      ),
    )
  return { unreadCount: rows[0]?.value ?? 0 }
}

export async function markSupportTicketReadByManager(input: {
  salonId: string
  ticketId: string
  readAt?: Date
}) {
  const db = getDb()
  const readAt = input.readAt ?? new Date()
  const [result] = await db
    .update(supportTickets)
    .set({
      managerLastReadAt: sql`greatest(coalesce(${supportTickets.managerLastReadAt}, '-infinity'::timestamptz), ${readAt.toISOString()}::timestamptz)`,
    })
    .where(managerSupportTicketScope(input))
    .returning({
      ticketId: supportTickets.id,
      readAt: supportTickets.managerLastReadAt,
    })
  return result?.readAt
    ? { ticketId: result.ticketId, readAt: result.readAt }
    : undefined
}

export async function addManagerSupportMessage(input: {
  salonId: string
  ticketId: string
  authorUserId: string
  authorDisplayName: string
  body: string
}): Promise<TicketMutationResult | undefined> {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(supportTickets)
      .where(managerSupportTicketScope(input))
      .limit(1)
      .for('update')
    if (!current) return undefined
    const now = new Date()
    const resultingStatus = statusAfterMessage(current.status, 'manager')
    const ticketUpdate = ticketUpdateAfterMessage({
      currentStatus: current.status,
      authorKind: 'manager',
      authorUserId: input.authorUserId,
      now,
    })
    const [message] = await tx
      .insert(supportMessages)
      .values({
        ticketId: current.id,
        authorUserId: input.authorUserId,
        authorKind: 'manager',
        authorDisplayNameSnapshot: input.authorDisplayName,
        body: input.body,
        createdAt: now,
      })
      .returning()
    const [ticket] = await tx
      .update(supportTickets)
      .set(ticketUpdate)
      .where(
        managerSupportTicketScope({
          ticketId: current.id,
          salonId: input.salonId,
        }),
      )
      .returning()
    if (!ticket || !message)
      throw new Error('Support Message could not be created')
    return {
      previousStatus: current.status,
      resultingStatus,
      ticket,
      message,
    }
  })
}

export type AdminSupportTicketListInput = {
  page?: number
  pageSize?: number
  status?: SupportTicketStatus
  category?: SupportTicketCategory
  salonId?: string
  search?: string
  scope?: 'unresolved' | 'all'
}

export function adminListConditions(input: AdminSupportTicketListInput): SQL[] {
  const conditions: SQL[] = []
  if (input.status) conditions.push(eq(supportTickets.status, input.status))
  else if ((input.scope ?? 'unresolved') === 'unresolved') {
    conditions.push(ne(supportTickets.status, 'resolved'))
  }
  if (input.category)
    conditions.push(eq(supportTickets.category, input.category))
  if (input.salonId) conditions.push(eq(supportTickets.salonId, input.salonId))
  const search = input.search?.trim()
  if (search) {
    const pattern = escapedLikePattern(search)
    conditions.push(
      or(
        sql`${supportTickets.subject} ilike ${pattern} escape '\\'`,
        sql`${organization.name} ilike ${pattern} escape '\\'`,
      )!,
    )
  }
  return conditions
}

export async function listAdminSupportTickets(
  input: AdminSupportTicketListInput = {},
): Promise<SupportTicketPage<AdminSupportTicketListItem>> {
  const db = getDb()
  const { page, pageSize, offset } = normalizeSupportTicketPage(input)
  const conditions = adminListConditions(input)
  const where = conditions.length ? and(...conditions) : undefined
  const [rows, totals] = await Promise.all([
    db
      .select({
        ticket: supportTickets,
        salonName: organization.name,
      })
      .from(supportTickets)
      .innerJoin(organization, eq(organization.id, supportTickets.salonId))
      .where(where)
      .orderBy(desc(supportTickets.lastActivityAt), desc(supportTickets.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(supportTickets)
      .innerJoin(organization, eq(organization.id, supportTickets.salonId))
      .where(where),
  ])
  const ticketIds = rows.map(({ ticket }) => ticket.id)
  const [latest, first] = await Promise.all([
    latestMessages(ticketIds),
    firstMessages(ticketIds),
  ])
  return {
    items: rows.map(({ ticket, salonName }) => ({
      id: ticket.id,
      salonId: ticket.salonId,
      salonName,
      submittedByUserId: ticket.submittedByUserId,
      submittedByDisplayName:
        first.get(ticket.id)?.authorDisplayNameSnapshot ?? '',
      category: ticket.category,
      subject: ticket.subject,
      status: ticket.status,
      lastActivityAt: ticket.lastActivityAt,
      createdAt: ticket.createdAt,
      platformHasUnread: hasUnread(
        ticket.lastManagerMessageAt,
        ticket.platformLastReadAt,
      ),
      lastMessage: preview(latest.get(ticket.id), false),
    })),
    pagination: { page, pageSize, total: totals[0]?.value ?? 0 },
  }
}

export async function getAdminSupportTicketDetail(
  ticketId: string,
): Promise<AdminSupportTicketDetail | undefined> {
  const db = getDb()
  const [row] = await db
    .select({
      ticket: supportTickets,
      salonName: organization.name,
    })
    .from(supportTickets)
    .innerJoin(organization, eq(organization.id, supportTickets.salonId))
    .where(eq(supportTickets.id, ticketId))
    .limit(1)
  if (!row) return undefined
  const [messagesDescending, initialMessages] = await Promise.all([
    db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(desc(supportMessages.createdAt), desc(supportMessages.id))
      .limit(MESSAGE_LIMIT),
    firstMessages([ticketId]),
  ])
  const messages = messagesDescending.reverse()
  return {
    ticket: {
      id: row.ticket.id,
      salonId: row.ticket.salonId,
      submittedByUserId: row.ticket.submittedByUserId,
      category: row.ticket.category,
      subject: row.ticket.subject,
      status: row.ticket.status,
      lastActivityAt: row.ticket.lastActivityAt,
      resolvedAt: row.ticket.resolvedAt,
      resolvedByUserId: row.ticket.resolvedByUserId,
      createdAt: row.ticket.createdAt,
      salonName: row.salonName,
      submittedByDisplayName:
        initialMessages.get(ticketId)?.authorDisplayNameSnapshot ?? '',
    },
    platformHasUnread: hasUnread(
      row.ticket.lastManagerMessageAt,
      row.ticket.platformLastReadAt,
    ),
    messages: messages.map(adminMessageProjection),
    truncated: messages.length === MESSAGE_LIMIT,
  }
}

export async function getAdminSupportTicketSummary() {
  const db = getDb()
  const [row] = await db
    .select({
      unresolvedCount:
        sql<number>`count(*) filter (where ${supportTickets.status} <> 'resolved')`.mapWith(
          Number,
        ),
      unreadCount:
        sql<number>`count(*) filter (where ${unreadSql(supportTickets.lastManagerMessageAt, supportTickets.platformLastReadAt)})`.mapWith(
          Number,
        ),
    })
    .from(supportTickets)
  return {
    unresolvedCount: row?.unresolvedCount ?? 0,
    unreadCount: row?.unreadCount ?? 0,
  }
}

export async function markSupportTicketReadByPlatform(input: {
  ticketId: string
  readAt?: Date
}) {
  const db = getDb()
  const readAt = input.readAt ?? new Date()
  const [result] = await db
    .update(supportTickets)
    .set({
      platformLastReadAt: sql`greatest(coalesce(${supportTickets.platformLastReadAt}, '-infinity'::timestamptz), ${readAt.toISOString()}::timestamptz)`,
    })
    .where(eq(supportTickets.id, input.ticketId))
    .returning({
      ticketId: supportTickets.id,
      readAt: supportTickets.platformLastReadAt,
    })
  return result?.readAt
    ? { ticketId: result.ticketId, readAt: result.readAt }
    : undefined
}

export async function addPlatformSupportMessage(input: {
  ticketId: string
  authorUserId: string
  authorDisplayName: string
  body: string
  resolveAfter?: boolean
}): Promise<TicketMutationResult | undefined> {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, input.ticketId))
      .limit(1)
      .for('update')
    if (!current) return undefined
    const now = new Date()
    const resultingStatus = input.resolveAfter
      ? 'resolved'
      : statusAfterMessage(current.status, 'platform')
    const ticketUpdate = ticketUpdateAfterMessage({
      currentStatus: current.status,
      authorKind: 'platform',
      authorUserId: input.authorUserId,
      now,
      resolveAfter: input.resolveAfter,
    })
    const [message] = await tx
      .insert(supportMessages)
      .values({
        ticketId: current.id,
        authorUserId: input.authorUserId,
        authorKind: 'platform',
        authorDisplayNameSnapshot: input.authorDisplayName,
        body: input.body,
        createdAt: now,
      })
      .returning()
    const [ticket] = await tx
      .update(supportTickets)
      .set(ticketUpdate)
      .where(eq(supportTickets.id, current.id))
      .returning()
    if (!ticket || !message)
      throw new Error('Support Message could not be created')
    return {
      previousStatus: current.status,
      resultingStatus,
      ticket,
      message,
    }
  })
}

export async function resolveSupportTicket(input: {
  ticketId: string
  resolvedByUserId: string
}): Promise<ResolveSupportTicketResult | undefined> {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, input.ticketId))
      .limit(1)
      .for('update')
    if (!current) return undefined
    if (current.status === 'resolved') {
      return {
        changed: false,
        previousStatus: current.status,
        resultingStatus: current.status,
        ticket: current,
      }
    }
    const [ticket] = await tx
      .update(supportTickets)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedByUserId: input.resolvedByUserId,
      })
      .where(eq(supportTickets.id, current.id))
      .returning()
    if (!ticket) throw new Error('Support Ticket could not be resolved')
    return {
      changed: true,
      previousStatus: current.status,
      resultingStatus: 'resolved',
      ticket,
    }
  })
}

export async function listActiveSalonManagerUserIds(
  salonId: string,
): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .selectDistinct({ userId: member.userId })
    .from(member)
    .leftJoin(
      salonMember,
      and(
        eq(salonMember.userId, member.userId),
        eq(salonMember.organizationId, member.organizationId),
      ),
    )
    .where(
      and(
        eq(member.organizationId, salonId),
        inArray(member.role, ['owner', 'admin']),
        or(isNull(salonMember.active), eq(salonMember.active, true)),
      ),
    )
  return rows.map(({ userId }) => userId)
}
