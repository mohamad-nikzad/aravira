import type { LocalDataPort } from '../ports/local-data-port'
import { META_COLLECTION } from './cache-meta'

export const SYNC_LAST_SUCCESS_KEY = 'sync:lastSuccessAt'
export const SYNC_AUTH_BLOCKED_KEY = 'sync:authBlocked'

export async function readSyncLastSuccessAt(storage: LocalDataPort): Promise<string | null> {
  const v = await storage.get<string>(META_COLLECTION, SYNC_LAST_SUCCESS_KEY)
  return v ?? null
}

export async function writeSyncLastSuccessAt(storage: LocalDataPort, iso: string): Promise<void> {
  await storage.set(META_COLLECTION, SYNC_LAST_SUCCESS_KEY, iso)
}

export async function readSyncAuthBlocked(storage: LocalDataPort): Promise<boolean> {
  return (await storage.get<string>(META_COLLECTION, SYNC_AUTH_BLOCKED_KEY)) === '1'
}

export async function writeSyncAuthBlocked(storage: LocalDataPort, blocked: boolean): Promise<void> {
  if (blocked) await storage.set(META_COLLECTION, SYNC_AUTH_BLOCKED_KEY, '1')
  else await storage.delete(META_COLLECTION, SYNC_AUTH_BLOCKED_KEY)
}
