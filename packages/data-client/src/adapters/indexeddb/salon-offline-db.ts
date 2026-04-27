import Dexie, { type Table } from 'dexie'

export type KvRow = {
  compoundKey: string
  collection: string
  value: unknown
  updatedAt: number
}

export class SalonOfflineDexie extends Dexie {
  kv!: Table<KvRow, string>

  constructor(databaseName = 'aravira-manager-offline') {
    super(databaseName)
    this.version(1).stores({
      kv: '&compoundKey, collection',
    })
  }
}
