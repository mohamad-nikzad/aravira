import type { LocalDataPort } from '../../ports/local-data-port'
import { SalonOfflineDexie } from './salon-offline-db'

function compoundKey(collection: string, key: string) {
  return `${collection}\0${key}`
}

export interface IndexedDbLocalDataPortOptions {
  databaseName?: string
}

/**
 * Dexie-backed {@link LocalDataPort} for manager offline cache (Phase 2).
 * Fails open: if IndexedDB is unavailable, reads miss and writes are no-ops.
 */
export class IndexedDbLocalDataPort implements LocalDataPort {
  private readonly db: SalonOfflineDexie
  private openFailed = false

  constructor(options: IndexedDbLocalDataPortOptions = {}) {
    this.db = new SalonOfflineDexie(options.databaseName)
  }

  private async safeOpen(): Promise<boolean> {
    if (this.openFailed) return false
    try {
      await this.db.open()
      return true
    } catch {
      this.openFailed = true
      return false
    }
  }

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    if (!(await this.safeOpen())) return undefined
    try {
      const row = await this.db.kv.get(compoundKey(collection, key))
      if (!row) return undefined
      return row.value as T
    } catch {
      return undefined
    }
  }

  async set<T>(collection: string, key: string, value: T): Promise<void> {
    if (!(await this.safeOpen())) return
    try {
      await this.db.kv.put({
        compoundKey: compoundKey(collection, key),
        collection,
        value,
        updatedAt: Date.now(),
      })
    } catch {
      /* ignore quota / private mode */
    }
  }

  async delete(collection: string, key: string): Promise<void> {
    if (!(await this.safeOpen())) return
    try {
      await this.db.kv.delete(compoundKey(collection, key))
    } catch {
      /* ignore */
    }
  }

  async clearCollection(collection: string): Promise<void> {
    if (!(await this.safeOpen())) return
    try {
      await this.db.kv.where('collection').equals(collection).delete()
    } catch {
      /* ignore */
    }
  }

  async listKeys(collection: string): Promise<string[]> {
    if (!(await this.safeOpen())) return []
    const prefix = `${collection}\0`
    try {
      const rows = await this.db.kv.where('collection').equals(collection).toArray()
      return rows.map((r) => {
        const ck = r.compoundKey
        return ck.startsWith(prefix) ? ck.slice(prefix.length) : ck
      })
    } catch {
      return []
    }
  }

  async transaction<T>(fn: (tx: LocalDataPort) => Promise<T>): Promise<T> {
    if (!(await this.safeOpen())) {
      throw new Error('IndexedDB is unavailable')
    }
    return this.db.transaction('rw', this.db.kv, async () => fn(new IndexedDbTransactionLocalDataPort(this.db)))
  }
}

class IndexedDbTransactionLocalDataPort implements LocalDataPort {
  constructor(private readonly db: SalonOfflineDexie) {}

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    const row = await this.db.kv.get(compoundKey(collection, key))
    return row?.value as T | undefined
  }

  async set<T>(collection: string, key: string, value: T): Promise<void> {
    await this.db.kv.put({
      compoundKey: compoundKey(collection, key),
      collection,
      value,
      updatedAt: Date.now(),
    })
  }

  async delete(collection: string, key: string): Promise<void> {
    await this.db.kv.delete(compoundKey(collection, key))
  }

  async clearCollection(collection: string): Promise<void> {
    await this.db.kv.where('collection').equals(collection).delete()
  }

  async listKeys(collection: string): Promise<string[]> {
    const prefix = `${collection}\0`
    const rows = await this.db.kv.where('collection').equals(collection).toArray()
    return rows.map((r) => {
      const ck = r.compoundKey
      return ck.startsWith(prefix) ? ck.slice(prefix.length) : ck
    })
  }

  async transaction<T>(fn: (tx: LocalDataPort) => Promise<T>): Promise<T> {
    return fn(this)
  }
}
