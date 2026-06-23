import { canonicalSalonPhone } from './phone'

export type VcfDraftContact = {
  localId: string
  name: string
  phone: string | null
}

type ParsedProperty = {
  name: string
  params: string[]
  value: string
}

const VCARD_BLOCK_RE = /BEGIN:VCARD[\s\S]*?END:VCARD/gi

function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r?\n/)
  const lines: string[] = []

  for (const line of rawLines) {
    if (
      line.length > 0 &&
      (line[0] === ' ' || line[0] === '\t') &&
      lines.length > 0
    ) {
      lines[lines.length - 1] += line.slice(1)
      continue
    }
    lines.push(line)
  }

  return lines
}

function getParam(params: string[], key: string): string | null {
  const upperKey = key.toUpperCase()
  for (const param of params) {
    const match = param.match(/^([^=]+)=(.+)$/)
    if (match && match[1]?.toUpperCase() === upperKey) {
      return match[2] ?? null
    }
  }
  return null
}

function hasQuotedPrintableEncoding(params: string[]): boolean {
  if (getParam(params, 'ENCODING')?.toUpperCase() === 'QUOTED-PRINTABLE') {
    return true
  }
  return params.some((param) => param.toUpperCase() === 'QUOTED-PRINTABLE')
}

function decodeQuotedPrintable(input: string): Uint8Array {
  const bytes: number[] = []
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (char !== '=') {
      bytes.push(char.charCodeAt(0))
      continue
    }

    const next = input[index + 1]
    const afterNext = input[index + 2]

    if (next === '\r' && afterNext === '\n') {
      index += 2
      continue
    }
    if (next === '\n') {
      index += 1
      continue
    }

    const hex = input.slice(index + 1, index + 3)
    if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(Number.parseInt(hex, 16))
      index += 2
      continue
    }

    bytes.push(char.charCodeAt(0))
  }

  return new Uint8Array(bytes)
}

function decodePropertyValue(params: string[], value: string): string {
  if (!hasQuotedPrintableEncoding(params)) return value

  const bytes = decodeQuotedPrintable(value)
  const charset = getParam(params, 'CHARSET') ?? 'utf-8'

  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function parsePropertyLine(line: string): ParsedProperty | null {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return null

  const left = line.slice(0, colonIndex)
  const value = line.slice(colonIndex + 1)
  const segments = left.split(';')
  const name = segments[0]?.trim().toUpperCase() ?? ''
  const params = segments
    .slice(1)
    .map((segment) => segment.trim().toUpperCase())

  if (!name) return null
  return { name, params, value: decodePropertyValue(params, value) }
}

function composeStructuredName(value: string): string {
  const parts = value.split(';')
  const family = parts[0]?.trim() ?? ''
  const given = parts[1]?.trim() ?? ''
  return [given, family].filter(Boolean).join(' ').trim()
}

function stripTelPrefix(raw: string): string {
  return raw.trim().replace(/^tel:/i, '')
}

const MOBILE_TYPE_PARAMS = new Set(['CELL', 'MOBILE', 'IPHONE'])

function isTelProperty(name: string): boolean {
  if (name === 'TEL') return true
  return /^ITEM\d+\.TEL$/.test(name)
}

function hasMobileType(params: string[]): boolean {
  return params.some((param) => {
    const upper = param.toUpperCase()
    if (MOBILE_TYPE_PARAMS.has(upper)) return true

    const typeMatch = param.match(/^TYPE=(.+)$/i)
    if (!typeMatch) return false
    const types = typeMatch[1]
      .split(',')
      .map((type) => type.trim().toUpperCase())
    return types.some((type) => MOBILE_TYPE_PARAMS.has(type))
  })
}

function chooseTel(properties: ParsedProperty[]): string | null {
  const telEntries = properties.filter((property) =>
    isTelProperty(property.name),
  )
  if (telEntries.length === 0) return null

  const mobile = telEntries.find((entry) => hasMobileType(entry.params))
  return stripTelPrefix((mobile ?? telEntries[0]).value)
}

function parseCardName(properties: ParsedProperty[]): string {
  const fn = properties.find((property) => property.name === 'FN')
  if (fn) {
    const trimmed = fn.value.trim()
    if (trimmed.length > 0) return trimmed
  }

  const structuredName = properties.find((property) => property.name === 'N')
  if (structuredName) return composeStructuredName(structuredName.value)

  return ''
}

function parseCard(block: string, localId: string): VcfDraftContact {
  const properties = unfoldLines(block)
    .map(parsePropertyLine)
    .filter((property): property is ParsedProperty => property != null)

  const name = parseCardName(properties)

  const tel = chooseTel(properties)
  const phone =
    tel == null || tel.trim().length === 0
      ? null
      : canonicalSalonPhone(tel) || null

  return {
    localId,
    name,
    phone: phone && phone.length > 0 ? phone : null,
  }
}

export function parseVcfFile(
  text: string,
  localIdFactory: (index: number) => string = () => crypto.randomUUID(),
): VcfDraftContact[] {
  const matches = text.match(VCARD_BLOCK_RE)
  if (!matches || matches.length === 0) return []

  const drafts: VcfDraftContact[] = []
  for (const [index, block] of matches.entries()) {
    drafts.push(parseCard(block, localIdFactory(index)))
  }
  return drafts
}
