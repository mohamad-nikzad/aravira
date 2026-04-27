import type { HttpTransportPort } from '@repo/data-client'
import { createDataClient } from '@repo/data-client'

const transport = {
  json: async () => ({ staff: [] }),
} as unknown as HttpTransportPort

createDataClient({
  persistence: 'memory',
  transport,
})

export const portabilityBundleOk = true
