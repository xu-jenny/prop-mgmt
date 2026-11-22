import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="page">
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </main>
  ),
})

function RootLayout() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Unit Types Onboarding
        </Link>
        <nav className="nav">
          <Link to="/" activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/walkthrough">Customer walkthrough</Link>
          <a href="/mock/index.html" target="_blank" rel="noreferrer">
            Mock (full screen) ↗
          </a>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
