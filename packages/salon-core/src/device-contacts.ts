import { canonicalSalonPhone, IRANIAN_MOBILE_PHONE_RE } from './phone'
import type { Client } from './types'
import type { VcfDraftContact } from './vcf'

export type DeviceContactPickerRow = {
  name?: string[]
  tel?: string[]
}

export type ResolvedDeviceContact =
  | { kind: 'ready'; name: string; phone: string }
  | { kind: 'choose-phone'; name: string; phones: string[] }
  | { kind: 'invalid'; name: string }

export function composeDeviceContactName(name?: string[]): string {
  return name?.[0]?.trim() ?? ''
}

export function stripDeviceContactTel(raw: string): string {
  return raw.trim().replace(/^tel:/i, '')
}

export function normalizeDeviceContactMobile(raw: string): string | null {
  const stripped = stripDeviceContactTel(raw)
  if (stripped.length === 0) return null

  const canonical = canonicalSalonPhone(stripped)
  if (canonical.length === 0 || !IRANIAN_MOBILE_PHONE_RE.test(canonical)) {
    return null
  }

  return canonical
}

export function collectDeviceContactPhones(tels?: string[]): string[] {
  if (!tels || tels.length === 0) return []

  const seen = new Set<string>()
  const phones: string[] = []

  for (const raw of tels) {
    const canonical = normalizeDeviceContactMobile(raw)
    if (canonical == null || seen.has(canonical)) continue

    seen.add(canonical)
    phones.push(canonical)
  }

  return phones
}

export function chooseDeviceContactPhone(
  tels?: string[] | undefined,
): string | null {
  return collectDeviceContactPhones(tels)[0] ?? null
}

export function resolveSingleDeviceContact(
  row: DeviceContactPickerRow,
): ResolvedDeviceContact {
  const name = composeDeviceContactName(row.name)
  const phones = collectDeviceContactPhones(row.tel)

  if (phones.length === 0) {
    return { kind: 'invalid', name }
  }

  if (phones.length === 1) {
    return { kind: 'ready', name, phone: phones[0]! }
  }

  return { kind: 'choose-phone', name, phones }
}

export function findClientByCanonicalPhone(
  clients: Client[],
  phone: string,
): Client | undefined {
  const target = canonicalSalonPhone(phone)
  return clients.find(
    (client) =>
      client.phone != null && canonicalSalonPhone(client.phone) === target,
  )
}

export function mapDeviceContactsToDrafts(
  contacts: DeviceContactPickerRow[],
): VcfDraftContact[] {
  return contacts.map((row) => ({
    localId: crypto.randomUUID(),
    name: composeDeviceContactName(row.name),
    phone: chooseDeviceContactPhone(row.tel),
  }))
}
