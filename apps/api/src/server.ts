import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { app } from './app'

const port = Number(process.env.PORT ?? 3001)

// In production one process serves both the API and the built web app
// (apps/web/dist, created by `npm run build`). In dev, Vite serves the web app.
if (process.env.NODE_ENV === 'production') {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const webDist = path.relative(process.cwd(), path.resolve(here, '../../web/dist'))
  app.use('/*', serveStatic({ root: webDist }))
  // Any other path is a client-side route: hand it to the React app.
  app.get('*', serveStatic({ path: path.join(webDist, 'index.html') }))
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
