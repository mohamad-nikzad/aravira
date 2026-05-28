import Dexie, { type Table } from 'dexie'

export const DEFAULT_OFFLINE_DB_NAME = 'aravira-manager-offline'

export type KvRow = {
  compoundKey: string
  collection: string
  value: unknown
  updatedAt: number
}

export class SalonOfflineDexie extends Dexie {
  kv!: Table<KvRow, string>

  constructor(databaseName = DEFAULT_OFFLINE_DB_NAME) {
    super(databaseName)
    this.version(1).stores({
      kv: '&compoundKey, collection',
    })
  }
}

/**
 * Wipes the entire offline cache (all collections + queued mutations). Call on
 * logout so a subsequent login under a different account never reads the
 * previous user's salon data. Fails open if IndexedDB is unavailable.
 */
export async function clearOfflineDatabase(
  databaseName = DEFAULT_OFFLINE_DB_NAME,
): Promise<void> {
  const db = new SalonOfflineDexie(databaseName)
  try {
    await db.open()
    await db.kv.clear()
  } catch {
    /* ignore — private mode / unavailable IndexedDB */
  } finally {
    db.close()
  }
}
