import type { VcfDraftContact } from './vcf'

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === ',' && !quoted) {
      row.push(field)
      field = ''
      continue
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim().length > 0)) rows.push(row)
      row = []
      field = ''
      continue
    }
    field += char
  }

  row.push(field)
  if (row.some((value) => value.trim().length > 0)) rows.push(row)
  return rows
}

function normalizedHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
}

const NAME_HEADERS = new Set([
  'name',
  'full name',
  'client name',
  'نام',
  'نام مشتری',
])
const PHONE_HEADERS = new Set([
  'phone',
  'mobile',
  'phone number',
  'شماره',
  'شماره تماس',
  'موبایل',
])

/** Parses only name and phone. Extra CSV columns are deliberately ignored. */
export function parseClientCsv(text: string): VcfDraftContact[] {
  const rows = parseCsvRows(text)
  if (rows.length === 0) return []

  const headers = rows[0]?.map(normalizedHeader) ?? []
  const nameIndex = headers.findIndex((header) => NAME_HEADERS.has(header))
  const phoneIndex = headers.findIndex((header) => PHONE_HEADERS.has(header))
  const hasHeader = nameIndex >= 0 || phoneIndex >= 0
  const resolvedNameIndex = nameIndex >= 0 ? nameIndex : 0
  const resolvedPhoneIndex = phoneIndex >= 0 ? phoneIndex : 1
  const dataRows = hasHeader ? rows.slice(1) : rows

  return dataRows.map((values, index) => {
    const rawPhone = values[resolvedPhoneIndex]?.trim() ?? ''
    return {
      localId: `csv-${index + 1}`,
      name: values[resolvedNameIndex]?.trim() ?? '',
      phone: rawPhone || null,
    }
  })
}
