import { Hono } from 'hono'
import { walkthroughSteps } from './walkthrough'

// Routes are chained so TypeScript can infer the whole API shape.
// The web app imports `AppType` and gets typed calls via `hc<AppType>()`.
export const app = new Hono()
  .get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))
  .get('/api/walkthrough', (c) => c.json({ steps: walkthroughSteps }))

export type AppType = typeof app
