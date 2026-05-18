import { Hono } from 'hono'
import type { AppEnv } from '../factory'

export const health = new Hono<AppEnv>()
  .get('/', (c) => c.json({ ok: true }))
  .get('/ready', (c) => c.json({ ok: true }))
