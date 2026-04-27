import type { LocalDataPort } from '../../ports/local-data-port'

function compoundKey(collection: string, key: string) {
  return `${collection}\0${key}`
}

export class MemoryLocalDataPort implements LocalDataPort {
  private readonly store = new Map<string, unknown>()

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    const k = compoundKey(collection, key)
    if (!this.store.has(k)) return undefined
    return this.store.get(k) as T
  }

  async set<T>(collection: string, key: string, value: T): Promise<void> {
    this.store.set(compoundKey(collection, key), value)
  }

  async delete(collection: string, key: string): Promise<void> {
    this.store.delete(compoundKey(collection, key))
  }

  async clearCollection(collection: string): Promise<void> {
    const prefix = `${collection}\0`
    for (const k of [...this.store.keys()]) {
      if (k.startsWith(prefix)) this.store.delete(k)
    }
  }

  async listKeys(collection: string): Promise<string[]> {
    const prefix = `${collection}\0`
    const out: string[] = []
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) out.push(k.slice(prefix.length))
    }
    return out
  }

  async transaction<T>(fn: (tx: LocalDataPort) => Promise<T>): Promise<T> {
    const snapshot = new Map(this.store)
    try {
      return await fn(this)
    } catch (err) {
      this.store.clear()
      for (const [key, value] of snapshot) this.store.set(key, value)
      throw err
    }
  }
}
