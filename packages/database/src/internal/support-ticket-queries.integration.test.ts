import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const runIntegration = process.env.RUN_DATABASE_INTEGRATION === '1'
const databaseName = `saluna_task2_test_${process.pid}_${Date.now()}`
const adminUrl = 'postgres://postgres:postgres@127.0.0.1:5432/postgres'
const databaseUrl = `postgres://postgres:postgres@127.0.0.1:5432/${databaseName}`
const migrationsFolder = fileURLToPath(
  new URL('../migrations', import.meta.url),
)

type Queries = typeof import('./support-ticket-queries')

let adminSql: Sql | undefined
let testSql: Sql | undefined
let queries: Queries
let databaseCreated = false

const ids = {
  salonA: randomUUID(),
  salonB: randomUUID(),
  managerA: randomUUID(),
  managerB: randomUUID(),
  activeAdmin: randomUUID(),
  inactiveAdmin: randomUUID(),
  employee: randomUUID(),
  platform: randomUUID(),
}

function assertDisposableDatabase(url: string) {
  const parsed = new URL(url)
  if (
    parsed.hostname !== '127.0.0.1' ||
    !parsed.pathname.slice(1).startsWith('saluna_task2_test_')
  ) {
    throw new Error(`Refusing to use non-disposable database: ${url}`)
  }
}

async function pauseForTimestampOrdering() {
  await new Promise((resolve) => setTimeout(resolve, 3))
}

async function createTicket(input: {
  salonId?: string
  managerId?: string
  category?: 'problem' | 'question' | 'feature_request' | 'other'
  subject: string
  body?: string
}) {
  return queries.createSupportTicket({
    salonId: input.salonId ?? ids.salonA,
    submittedByUserId: input.managerId ?? ids.managerA,
    submittedByDisplayName: 'مدیر سالن',
    category: input.category ?? 'problem',
    subject: input.subject,
    body: input.body ?? 'پیام نخست',
  })
}

async function seedIdentityData(sql: Sql) {
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values
      (${ids.managerA}, 'Manager A', 'manager-a@example.test', true, now(), now()),
      (${ids.managerB}, 'Manager B', 'manager-b@example.test', true, now(), now()),
      (${ids.activeAdmin}, 'Active Admin', 'active-admin@example.test', true, now(), now()),
      (${ids.inactiveAdmin}, 'Inactive Admin', 'inactive-admin@example.test', true, now(), now()),
      (${ids.employee}, 'Employee', 'employee@example.test', true, now(), now()),
      (${ids.platform}, 'Platform Agent', 'platform@example.test', true, now(), now())
  `
  await sql`
    insert into organization (id, name, slug)
    values
      (${ids.salonA}, 'Salon 100%_Literal', ${`salon-a-${databaseName}`}),
      (${ids.salonB}, 'Salon B', ${`salon-b-${databaseName}`})
  `
  await sql`
    insert into member (organization_id, user_id, role)
    values
      (${ids.salonA}, ${ids.managerA}, 'owner'),
      (${ids.salonA}, ${ids.activeAdmin}, 'admin'),
      (${ids.salonA}, ${ids.inactiveAdmin}, 'admin'),
      (${ids.salonA}, ${ids.employee}, 'member'),
      (${ids.salonB}, ${ids.managerB}, 'owner')
  `
  await sql`
    insert into salon_member (organization_id, user_id, active)
    values
      (${ids.salonA}, ${ids.activeAdmin}, true),
      (${ids.salonA}, ${ids.inactiveAdmin}, false),
      (${ids.salonA}, ${ids.employee}, true)
  `
}

describe.skipIf(!runIntegration)('support ticket Postgres integration', () => {
  beforeAll(async () => {
    assertDisposableDatabase(databaseUrl)
    adminSql = postgres(adminUrl, { max: 1 })
    await adminSql`create database ${adminSql(databaseName)}`
    databaseCreated = true

    testSql = postgres(databaseUrl, { max: 1 })
    await migrate(drizzle(testSql), { migrationsFolder })
    await seedIdentityData(testSql)

    process.env.DATABASE_URL = databaseUrl
    process.env.DATABASE_URL_DIRECT = databaseUrl
    queries = await import('./support-ticket-queries')
  }, 30_000)

  afterAll(async () => {
    const globals = globalThis as typeof globalThis & {
      __salon_postgres?: Sql
      __salon_drizzle?: unknown
    }
    if (globals.__salon_postgres)
      await globals.__salon_postgres.end({ timeout: 5 })
    delete globals.__salon_postgres
    delete globals.__salon_drizzle
    if (testSql) await testSql.end({ timeout: 5 })

    if (adminSql && databaseCreated) {
      assertDisposableDatabase(databaseUrl)
      await adminSql`drop database if exists ${adminSql(databaseName)} with (force)`
    }
    if (adminSql) await adminSql.end({ timeout: 5 })
  }, 30_000)

  it('creates a ticket and its first message atomically', async () => {
    const result = await createTicket({ subject: 'Creation' })
    expect(result).toMatchObject({
      previousStatus: null,
      resultingStatus: 'open',
    })
    expect(result.ticket).toMatchObject({ salonId: ids.salonA, status: 'open' })
    expect(result.message).toMatchObject({
      ticketId: result.ticket.id,
      authorKind: 'manager',
      authorUserId: ids.managerA,
      body: 'پیام نخست',
    })

    const detail = await queries.getSalonSupportTicketDetail({
      salonId: ids.salonA,
      ticketId: result.ticket.id,
    })
    expect(detail?.messages).toHaveLength(1)
  })

  it('enforces salon isolation on manager reads and writes', async () => {
    const created = await createTicket({ subject: 'Private ticket' })
    const foreignInput = { salonId: ids.salonB, ticketId: created.ticket.id }

    expect(
      await queries.getSalonSupportTicketDetail(foreignInput),
    ).toBeUndefined()
    expect(
      await queries.markSupportTicketReadByManager(foreignInput),
    ).toBeUndefined()
    expect(
      await queries.addManagerSupportMessage({
        ...foreignInput,
        authorUserId: ids.managerB,
        authorDisplayName: 'Manager B',
        body: 'Must not be written',
      }),
    ).toBeUndefined()
    expect(
      (await queries.listSalonSupportTickets({ salonId: ids.salonB })).items,
    ).toEqual([])
  })

  it('persists lifecycle transitions, reopening, reply-and-resolve, and idempotent resolve', async () => {
    const created = await createTicket({ subject: 'Lifecycle' })
    await pauseForTimestampOrdering()
    const platformReply = await queries.addPlatformSupportMessage({
      ticketId: created.ticket.id,
      authorUserId: ids.platform,
      authorDisplayName: 'Secret Agent Name',
      body: 'Platform response',
    })
    expect(platformReply?.resultingStatus).toBe('waiting_for_manager')

    await pauseForTimestampOrdering()
    const managerReply = await queries.addManagerSupportMessage({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
      authorUserId: ids.managerA,
      authorDisplayName: 'مدیر سالن',
      body: 'Manager response',
    })
    expect(managerReply?.resultingStatus).toBe('open')

    await pauseForTimestampOrdering()
    const replyAndResolve = await queries.addPlatformSupportMessage({
      ticketId: created.ticket.id,
      authorUserId: ids.platform,
      authorDisplayName: 'Secret Agent Name',
      body: 'Resolved response',
      resolveAfter: true,
    })
    expect(replyAndResolve?.resultingStatus).toBe('resolved')
    expect(replyAndResolve?.ticket.resolvedByUserId).toBe(ids.platform)

    await pauseForTimestampOrdering()
    const reopened = await queries.addManagerSupportMessage({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
      authorUserId: ids.managerA,
      authorDisplayName: 'مدیر سالن',
      body: 'Please reopen',
    })
    expect(reopened?.resultingStatus).toBe('open')
    expect(reopened?.ticket.resolvedAt).toBeNull()

    const resolved = await queries.resolveSupportTicket({
      ticketId: created.ticket.id,
      resolvedByUserId: ids.platform,
    })
    const resolvedAgain = await queries.resolveSupportTicket({
      ticketId: created.ticket.id,
      resolvedByUserId: ids.platform,
    })
    expect(resolved?.changed).toBe(true)
    expect(resolved?.ticket.lastActivityAt).toEqual(
      reopened?.ticket.lastActivityAt,
    )
    expect(resolvedAgain).toMatchObject({
      changed: false,
      resultingStatus: 'resolved',
    })
  })

  it('keeps read cursors monotonic and returns chronological manager-redacted messages', async () => {
    const created = await createTicket({ subject: 'Unread state' })
    await pauseForTimestampOrdering()
    await queries.addPlatformSupportMessage({
      ticketId: created.ticket.id,
      authorUserId: ids.platform,
      authorDisplayName: 'Private Platform Identity',
      body: 'Incoming',
    })
    expect(
      (await queries.getSalonSupportTicketSummary(ids.salonA)).unreadCount,
    ).toBeGreaterThan(0)

    const later = new Date('2030-01-02T00:00:00.000Z')
    const earlier = new Date('2030-01-01T00:00:00.000Z')
    await queries.markSupportTicketReadByManager({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
      readAt: later,
    })
    const managerRead = await queries.markSupportTicketReadByManager({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
      readAt: earlier,
    })
    expect(managerRead?.readAt).toEqual(later)

    const platformLater = await queries.markSupportTicketReadByPlatform({
      ticketId: created.ticket.id,
      readAt: later,
    })
    const platformEarlier = await queries.markSupportTicketReadByPlatform({
      ticketId: created.ticket.id,
      readAt: earlier,
    })
    expect(platformEarlier?.readAt).toEqual(platformLater?.readAt)

    const detail = await queries.getSalonSupportTicketDetail({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
    })
    expect(detail?.messages.map((message) => message.body)).toEqual([
      'پیام نخست',
      'Incoming',
    ])
    expect(detail?.messages[1]).toEqual(
      expect.objectContaining({
        authorKind: 'platform',
        authorDisplayName: queries.MANAGER_SUPPORT_NAME,
      }),
    )
    expect(detail?.messages[1]).not.toHaveProperty('authorUserId')
    expect(detail?.messages[0]!.createdAt.getTime()).toBeLessThanOrEqual(
      detail?.messages[1]!.createdAt.getTime() ?? 0,
    )
  })

  it('returns the newest 500 messages chronologically without losing the admin submitter snapshot', async () => {
    const created = await queries.createSupportTicket({
      salonId: ids.salonA,
      submittedByUserId: ids.managerA,
      submittedByDisplayName: 'Original Submitter Snapshot',
      category: 'problem',
      subject: 'Long conversation',
      body: 'Oldest initial message',
    })

    await testSql!`
      insert into support_messages (
        ticket_id,
        author_user_id,
        author_kind,
        author_display_name_snapshot,
        body,
        created_at
      )
      select
        ${created.ticket.id},
        ${ids.platform},
        'platform',
        'Private Platform Identity',
        'reply-' || lpad(sequence::text, 3, '0'),
        '2040-01-01T00:00:00Z'::timestamptz + sequence * interval '1 second'
      from generate_series(1, 501) as sequence
    `

    const managerDetail = await queries.getSalonSupportTicketDetail({
      salonId: ids.salonA,
      ticketId: created.ticket.id,
    })
    const adminDetail = await queries.getAdminSupportTicketDetail(
      created.ticket.id,
    )

    expect(managerDetail?.truncated).toBe(true)
    expect(managerDetail?.messages).toHaveLength(500)
    expect(managerDetail?.messages[0]?.body).toBe('reply-002')
    expect(managerDetail?.messages.at(-1)?.body).toBe('reply-501')
    expect(
      managerDetail?.messages.every(
        (message) =>
          message.authorKind !== 'platform' ||
          (message.authorDisplayName === queries.MANAGER_SUPPORT_NAME &&
            !('authorUserId' in message)),
      ),
    ).toBe(true)
    expect(
      managerDetail?.messages.every(
        (message, index, messages) =>
          index === 0 ||
          messages[index - 1]!.createdAt.getTime() <=
            message.createdAt.getTime(),
      ),
    ).toBe(true)

    expect(adminDetail?.truncated).toBe(true)
    expect(adminDetail?.messages).toHaveLength(500)
    expect(adminDetail?.messages[0]?.body).toBe('reply-002')
    expect(adminDetail?.messages.at(-1)?.body).toBe('reply-501')
    expect(adminDetail?.messages[0]).toMatchObject({
      authorUserId: ids.platform,
      authorDisplayName: 'Private Platform Identity',
    })
    expect(adminDetail?.ticket.submittedByDisplayName).toBe(
      'Original Submitter Snapshot',
    )
    expect(
      adminDetail?.messages.every(
        (message, index, messages) =>
          index === 0 ||
          messages[index - 1]!.createdAt.getTime() <=
            message.createdAt.getTime(),
      ),
    ).toBe(true)
    expect(
      adminDetail?.messages.some(
        (message) => message.body === 'Oldest initial message',
      ),
    ).toBe(false)
  })

  it('supports admin ordering, default scope, filters, literal search, and summaries', async () => {
    const older = await createTicket({
      subject: 'Literal 50%_match',
      category: 'feature_request',
    })
    const newer = await createTicket({
      salonId: ids.salonB,
      managerId: ids.managerB,
      subject: 'Newest question',
      category: 'question',
    })
    await queries.resolveSupportTicket({
      ticketId: older.ticket.id,
      resolvedByUserId: ids.platform,
    })
    await testSql!`update support_tickets set last_activity_at = '2026-01-01T00:00:00Z' where id = ${older.ticket.id}`
    await testSql!`update support_tickets set last_activity_at = '2090-01-02T00:00:00Z' where id = ${newer.ticket.id}`

    const defaults = await queries.listAdminSupportTickets()
    expect(defaults.items.some((item) => item.id === older.ticket.id)).toBe(
      false,
    )
    expect(defaults.items[0]?.id).toBe(newer.ticket.id)

    const filtered = await queries.listAdminSupportTickets({
      scope: 'all',
      status: 'resolved',
      category: 'feature_request',
      salonId: ids.salonA,
      search: '50%_match',
    })
    expect(filtered.items.map((item) => item.id)).toEqual([older.ticket.id])
    expect(filtered.items[0]).toMatchObject({
      salonName: 'Salon 100%_Literal',
      submittedByDisplayName: 'مدیر سالن',
    })

    const literalOrganizationSearch = await queries.listAdminSupportTickets({
      scope: 'all',
      search: '100%_Literal',
    })
    expect(literalOrganizationSearch.items.length).toBeGreaterThan(0)

    const summary = await queries.getAdminSupportTicketSummary()
    expect(summary.unresolvedCount).toBeGreaterThan(0)
    expect(summary.unreadCount).toBeGreaterThan(0)
  })

  it('returns only active owner and admin manager IDs', async () => {
    expect(
      new Set(await queries.listActiveSalonManagerUserIds(ids.salonA)),
    ).toEqual(new Set([ids.managerA, ids.activeAdmin]))
  })
})
