import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { healthQuery, walkthroughQuery } from '../lib/api'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const health = useQuery(healthQuery)
  const walkthrough = useQuery(walkthroughQuery)
  const minutes = walkthrough.data?.steps.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <main className="page">
      <h1>Unit Types Onboarding</h1>
      <p className="muted lede">
        An analyst uploads a new property's files, reviews one mapping, and downloads the unit type
        mapping workbook, the filled ETL workbook and the floor plans renamed to Rose names.
      </p>

      <div className="cards">
        <Link to="/walkthrough" className="card card-link">
          <span className="eyebrow">For the customer session</span>
          <h2>Customer walkthrough</h2>
          <p className="muted">
            The interactive mock beside an agenda: what to show on each screen and which open
            decisions to ask about. Notes you type are kept in this browser.
          </p>
          <span className="faint">
            {walkthrough.data
              ? `${walkthrough.data.steps.length} steps · about ${minutes} minutes`
              : 'Loading agenda…'}
          </span>
        </Link>

        <a href="/mock/index.html" target="_blank" rel="noreferrer" className="card card-link">
          <span className="eyebrow">Interactive mock</span>
          <h2>Open the mock full screen ↗</h2>
          <p className="muted">
            Every MVP screen: uploads, floor plan catalog, matching, review (gate 1) and outputs
            (gate 2). Illustrative data; state lives in the page only.
          </p>
        </a>
      </div>

      <section className="status">
        <h3>Starter app status</h3>
        <ul>
          <li>
            API:{' '}
            {health.isPending ? (
              <span className="badge">checking…</span>
            ) : health.isError ? (
              <span className="badge bad">not reachable — is `npm run dev` running?</span>
            ) : (
              <span className="badge ok">connected</span>
            )}
          </li>
          <li>Frontend: React + TanStack Router + TanStack Query (apps/web)</li>
          <li>Backend: Hono on Node (apps/api)</li>
        </ul>
      </section>
    </main>
  )
}
