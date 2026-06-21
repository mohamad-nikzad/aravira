import { describe, expect, it } from 'vitest'
import { and } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'

import {
  MANAGER_SUPPORT_NAME,
  adminListConditions,
  escapedLikePattern,
  hasUnread,
  managerSupportTicketScope,
  normalizeSupportTicketPage,
  projectManagerSupportMessage,
  projectManagerSupportTicket,
  ticketUpdateAfterMessage,
} from './support-ticket-queries'

describe('Support Ticket query semantics', () => {
  const dialect = new PgDialect()

  it('normalizes list pagination to the shared defaults and hard limit', () => {
    expect(normalizeSupportTicketPage({})).toEqual({
      page: 1,
      pageSize: 25,
      offset: 0,
    })
    expect(normalizeSupportTicketPage({ page: 3, pageSize: 500 })).toEqual({
      page: 3,
      pageSize: 100,
      offset: 200,
    })
  })

  it('escapes every ILIKE wildcard and the escape character itself', () => {
    expect(escapedLikePattern('50%_off\\today')).toBe('%50\\%\\_off\\\\today%')
  })

  it('builds manager detail/write predicates with both ticket and salon scope', () => {
    const query = dialect.sqlToQuery(
      managerSupportTicketScope({
        ticketId: 'ticket-a',
        salonId: 'salon-a',
      }),
    )
    expect(query.sql).toContain('"support_tickets"."id" = $1')
    expect(query.sql).toContain('"support_tickets"."salon_id" = $2')
    expect(query.params).toEqual(['ticket-a', 'salon-a'])
  })

  it('defaults admin lists to unresolved and composes filters with escaped search', () => {
    const defaultQuery = dialect.sqlToQuery(and(...adminListConditions({}))!)
    expect(defaultQuery.sql).toContain('"support_tickets"."status" <> $1')
    expect(defaultQuery.params).toEqual(['resolved'])

    const filteredQuery = dialect.sqlToQuery(
      and(
        ...adminListConditions({
          status: 'resolved',
          scope: 'unresolved',
          category: 'problem',
          salonId: 'salon-a',
          search: '50%_off',
        }),
      )!,
    )
    expect(filteredQuery.sql).toContain('"support_tickets"."status" = $1')
    expect(filteredQuery.sql).not.toContain('"support_tickets"."status" <>')
    expect(filteredQuery.sql).toContain('"support_tickets"."category" = $2')
    expect(filteredQuery.sql).toContain('"support_tickets"."salon_id" = $3')
    expect(filteredQuery.sql).toContain('ilike $4 escape')
    expect(filteredQuery.sql).toContain('ilike $5 escape')
    expect(filteredQuery.params).toEqual([
      'resolved',
      'problem',
      'salon-a',
      '%50\\%\\_off%',
      '%50\\%\\_off%',
    ])
  })

  it('computes shared unread state from the incoming-message and read cursors', () => {
    const messageAt = new Date('2026-06-20T10:00:00Z')
    expect(hasUnread(messageAt, null)).toBe(true)
    expect(hasUnread(messageAt, new Date('2026-06-20T09:59:59Z'))).toBe(true)
    expect(hasUnread(messageAt, messageAt)).toBe(false)
    expect(hasUnread(messageAt, new Date('2026-06-20T10:00:01Z'))).toBe(false)
    expect(hasUnread(null, null)).toBe(false)
  })

  it('builds lifecycle updates without advancing either read cursor', () => {
    const now = new Date('2026-06-20T10:00:00Z')
    const reopened = ticketUpdateAfterMessage({
      currentStatus: 'resolved',
      authorKind: 'platform',
      authorUserId: 'platform-1',
      now,
    })
    expect(reopened).toEqual({
      status: 'open',
      lastActivityAt: now,
      lastPlatformMessageAt: now,
      resolvedAt: null,
      resolvedByUserId: null,
    })
    expect(reopened).not.toHaveProperty('managerLastReadAt')
    expect(reopened).not.toHaveProperty('platformLastReadAt')

    expect(
      ticketUpdateAfterMessage({
        currentStatus: 'open',
        authorKind: 'platform',
        authorUserId: 'platform-1',
        now,
        resolveAfter: true,
      }),
    ).toMatchObject({
      status: 'resolved',
      lastPlatformMessageAt: now,
      resolvedAt: now,
      resolvedByUserId: 'platform-1',
    })
  })

  it('removes platform identity from the manager message projection', () => {
    const projected = projectManagerSupportMessage({
      id: 'message-1',
      ticketId: 'ticket-1',
      authorUserId: 'platform-user-secret',
      authorKind: 'platform',
      authorDisplayNameSnapshot: 'Real Platform Agent',
      body: 'Hello',
      createdAt: new Date('2026-06-20T10:00:00Z'),
    })

    expect(projected).toEqual({
      id: 'message-1',
      authorKind: 'platform',
      authorDisplayName: MANAGER_SUPPORT_NAME,
      body: 'Hello',
      createdAt: new Date('2026-06-20T10:00:00Z'),
    })
    expect(projected).not.toHaveProperty('authorUserId')
    expect(JSON.stringify(projected)).not.toContain('Real Platform Agent')
    expect(JSON.stringify(projected)).not.toContain('platform-user-secret')
  })

  it('retains manager identity in the manager projection', () => {
    expect(
      projectManagerSupportMessage({
        id: 'message-2',
        ticketId: 'ticket-1',
        authorUserId: 'manager-1',
        authorKind: 'manager',
        authorDisplayNameSnapshot: 'Manager Snapshot',
        body: 'Follow-up',
        createdAt: new Date('2026-06-20T10:01:00Z'),
      }),
    ).toMatchObject({
      authorKind: 'manager',
      authorUserId: 'manager-1',
      authorDisplayName: 'Manager Snapshot',
    })
  })

  it('keeps platform resolution identity and cursor internals out of manager tickets', () => {
    const projected = projectManagerSupportTicket({
      id: 'ticket-1',
      salonId: 'salon-1',
      submittedByUserId: 'manager-1',
      category: 'problem',
      subject: 'Subject',
      status: 'resolved',
      lastActivityAt: new Date('2026-06-20T10:00:00Z'),
      lastManagerMessageAt: new Date('2026-06-20T10:00:00Z'),
      lastPlatformMessageAt: new Date('2026-06-20T10:01:00Z'),
      managerLastReadAt: new Date('2026-06-20T10:02:00Z'),
      platformLastReadAt: new Date('2026-06-20T10:03:00Z'),
      resolvedAt: new Date('2026-06-20T10:04:00Z'),
      resolvedByUserId: 'platform-user-secret',
      createdAt: new Date('2026-06-20T10:00:00Z'),
    })

    expect(projected).not.toHaveProperty('resolvedByUserId')
    expect(projected).not.toHaveProperty('managerLastReadAt')
    expect(projected).not.toHaveProperty('platformLastReadAt')
    expect(JSON.stringify(projected)).not.toContain('platform-user-secret')
  })
})
