import { describe, expect, it } from 'vitest'

import { parseClientCsv } from './csv'

describe('parseClientCsv', () => {
  it('reads named columns, quoted commas, Persian phones, and ignores extras', () => {
    expect(
      parseClientCsv(
        'email,phone,name,notes\na@example.com,۰۹۱۲۳۴۵۶۷۸۹,"رضا، کریمی",vip',
      ),
    ).toEqual([
      {
        localId: 'csv-1',
        name: 'رضا، کریمی',
        phone: '۰۹۱۲۳۴۵۶۷۸۹',
      },
    ])
  })

  it('accepts headerless name-and-phone rows', () => {
    expect(parseClientCsv('Ali,+98 912 123 4567\nSara,09121111111')).toEqual([
      { localId: 'csv-1', name: 'Ali', phone: '+98 912 123 4567' },
      { localId: 'csv-2', name: 'Sara', phone: '09121111111' },
    ])
  })

  it('keeps missing fields visible for preview validation', () => {
    expect(parseClientCsv('name,phone\nNo phone,\n,09121111111')).toEqual([
      { localId: 'csv-1', name: 'No phone', phone: null },
      { localId: 'csv-2', name: '', phone: '09121111111' },
    ])
  })
})
