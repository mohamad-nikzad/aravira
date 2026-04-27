import type { LocalDataPort } from '../ports/local-data-port'

export const META_COLLECTION = 'meta'

export function cacheTimestampRecordKey(collection: string, dataKey: string) {
  return `${collection}::${dataKey}::updatedAt`
}

export async function writeCacheTimestamp(
  storage: LocalDataPort,
  collection: string,
  dataKey: string
): Promise<void> {
  await storage.set(META_COLLECTION, cacheTimestampRecordKey(collection, dataKey), new Date().toISOString())
}

export async function readCacheTimestamp(
  storage: LocalDataPort,
  collection: string,
  dataKey: string
): Promise<string | null> {
  const v = await storage.get<string>(META_COLLECTION, cacheTimestampRecordKey(collection, dataKey))
  return v ?? null
}
