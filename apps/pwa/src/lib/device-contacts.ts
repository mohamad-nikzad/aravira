export type { DeviceContactPickerRow } from '@repo/salon-core/device-contacts'

import type { DeviceContactPickerRow } from '@repo/salon-core/device-contacts'
import { toast } from '@repo/ui/use-toast'

export const CONTACT_PICK_BLOCKED_TOAST = {
  variant: 'destructive' as const,
  title: 'دسترسی به مخاطبین فعال نیست',
  description:
    'اگر سالونا را در فهرست برنامه‌ها نمی‌بینید، از تنظیمات مرورگر یا Chrome > Site settings > Contacts، دسترسی app.saluna.ir را روی Allow بگذارید.',
}

export function isDeviceContactPickerSupported(): boolean {
  return (
    'contacts' in navigator && typeof navigator.contacts?.select === 'function'
  )
}

async function isContactsPermissionDenied(): Promise<boolean> {
  if (!('permissions' in navigator)) return false

  try {
    const status = await navigator.permissions.query({
      name: 'contacts' as PermissionName,
    })
    return status.state === 'denied'
  } catch {
    return false
  }
}

function notifyContactPickBlocked() {
  toast(CONTACT_PICK_BLOCKED_TOAST)
}

function mapPickerRows(
  rows: Array<{ name?: string[]; tel?: string[] }>,
): DeviceContactPickerRow[] {
  return rows.map((row) => ({
    name: row.name ?? [],
    tel: row.tel ?? [],
  }))
}

export async function pickDeviceContacts(options: {
  multiple: boolean
}): Promise<DeviceContactPickerRow[] | null> {
  if (!isDeviceContactPickerSupported()) return null

  const contacts = navigator.contacts
  if (!contacts) return null

  if (await isContactsPermissionDenied()) {
    notifyContactPickBlocked()
    return null
  }

  try {
    const rows = await contacts.select(['name', 'tel'], {
      multiple: options.multiple,
    })
    if (!rows || rows.length === 0) {
      if (await isContactsPermissionDenied()) {
        notifyContactPickBlocked()
      }
      return null
    }
    return mapPickerRows(rows)
  } catch {
    notifyContactPickBlocked()
    return null
  }
}
