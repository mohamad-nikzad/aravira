import { describe, expect, it } from 'vitest'

import {
  adminSupportTicketListQuerySchema,
  createSupportMessageSchema,
  createSupportTicketSchema,
  platformSupportReplySchema,
  resolveSupportTicketParamsSchema,
  statusAfterMessage,
  supportTicketCategories,
  supportTicketListQuerySchema,
} from './support-tickets'

describe('Support Ticket schemas', () => {
  it.each(supportTicketCategories)('accepts the %s category', (category) => {
    expect(
      createSupportTicketSchema.safeParse({
        category,
        subject: 'A subject',
        body: 'The first message',
      }).success,
    ).toBe(true)
  })

  it('rejects unknown categories', () => {
    expect(
      createSupportTicketSchema.safeParse({
        category: 'billing',
        subject: 'A subject',
        body: 'The first message',
      }).success,
    ).toBe(false)
  })

  it('trims subject and body', () => {
    expect(
      createSupportTicketSchema.parse({
        category: 'problem',
        subject: '  A subject  ',
        body: '  The first message  ',
      }),
    ).toEqual({
      category: 'problem',
      subject: 'A subject',
      body: 'The first message',
    })
  })

  it('enforces subject and message length limits after trimming', () => {
    for (const subject of ['   ', 'a'.repeat(121)]) {
      expect(
        createSupportTicketSchema.safeParse({
          category: 'question',
          subject,
          body: 'body',
        }).success,
      ).toBe(false)
    }

    for (const body of ['   ', 'a'.repeat(4_001)]) {
      expect(createSupportMessageSchema.safeParse({ body }).success).toBe(false)
    }

    expect(
      createSupportTicketSchema.safeParse({
        category: 'question',
        subject: '😀'.repeat(120),
        body: '😀'.repeat(4_000),
      }).success,
    ).toBe(true)
    expect(
      createSupportTicketSchema.safeParse({
        category: 'question',
        subject: '😀'.repeat(121),
        body: 'body',
      }).success,
    ).toBe(false)
    expect(
      createSupportMessageSchema.safeParse({
        body: '😀'.repeat(4_001),
      }).success,
    ).toBe(false)
  })

  it('accepts resolveAfter only on platform replies', () => {
    expect(
      platformSupportReplySchema.parse({ body: 'answer', resolveAfter: true }),
    ).toEqual({ body: 'answer', resolveAfter: true })
    expect(
      createSupportMessageSchema.safeParse({
        body: 'answer',
        resolveAfter: true,
      }).success,
    ).toBe(false)
  })

  it('validates resolve params and bounded list filters', () => {
    expect(
      resolveSupportTicketParamsSchema.safeParse({
        ticketId: '3d6f0a40-6ea2-4d13-a11d-a7c335b80b61',
      }).success,
    ).toBe(true)
    expect(
      resolveSupportTicketParamsSchema.safeParse({ ticketId: 'not-an-id' })
        .success,
    ).toBe(false)
    expect(supportTicketListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
    })
    expect(
      adminSupportTicketListQuerySchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false)
    expect(
      adminSupportTicketListQuerySchema.parse({
        page: '2',
        pageSize: '50',
        status: 'open',
        category: 'other',
        scope: 'all',
      }),
    ).toMatchObject({ page: 2, pageSize: 50 })
  })
})

describe('statusAfterMessage', () => {
  it.each(['open', 'waiting_for_manager', 'resolved'] as const)(
    'sets %s to open after a manager message',
    (status) => {
      expect(statusAfterMessage(status, 'manager')).toBe('open')
    },
  )

  it.each(['open', 'waiting_for_manager'] as const)(
    'sets %s to waiting_for_manager after a platform message',
    (status) => {
      expect(statusAfterMessage(status, 'platform')).toBe('waiting_for_manager')
    },
  )

  it('reopens a resolved ticket after a platform message', () => {
    expect(statusAfterMessage('resolved', 'platform')).toBe('open')
  })
})
