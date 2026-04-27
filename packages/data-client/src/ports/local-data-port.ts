export interface LocalDataPort {
  /** `undefined` means cache miss; `null` is a valid stored value when `T` allows it */
  get<T>(collection: string, key: string): Promise<T | undefined>
  set<T>(collection: string, key: string, value: T): Promise<void>
  delete(collection: string, key: string): Promise<void>
  clearCollection(collection: string): Promise<void>
  /** Returns logical keys for the collection (not compound storage keys). */
  listKeys(collection: string): Promise<string[]>
  /** Runs all local writes in one storage transaction when the adapter supports it. */
  transaction<T>(fn: (tx: LocalDataPort) => Promise<T>): Promise<T>
}

export class NullLocalDataPort implements LocalDataPort {
  async get<T>(): Promise<T | undefined> {
    return undefined
  }

  async set(): Promise<void> {}

  async delete(): Promise<void> {}

  async clearCollection(): Promise<void> {}

  async listKeys(): Promise<string[]> {
    return []
  }

  async transaction<T>(fn: (tx: LocalDataPort) => Promise<T>): Promise<T> {
    return fn(this)
  }
}
