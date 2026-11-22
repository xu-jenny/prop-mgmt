# prop-mgmt

Unit Types Onboarding: an analyst uploads a new property's files, reviews one mapping, and downloads the unit type mapping workbook, the filled ETL workbook and the floor plans renamed to Rose names.

Status: starter app plus an interactive mock for the customer walkthrough. The onboarding rules are not built yet.

- [docs/PRD.md](docs/PRD.md): product requirements (MVP)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): proposed design and open questions

## Run it

Needs Node 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. This starts two processes:

- **web** (Vite, port 5173): the React app. It forwards `/api/*` to the API.
- **api** (Hono, port 3001): restarts on file changes.

To run as one process, the way it would be deployed:

```bash
npm run build
```

```bash
npm start
```

Then open http://localhost:3001. Hono serves both the API and the built React app.

## Customer walkthrough

Open **Customer walkthrough** in the app (`/walkthrough`). The agenda and talking points are on the left, and the live mock is on the right.

- Use **Next** or the ← → keys to move between steps. The mock jumps to the matching screen and keeps its state, so exceptions you resolve stay resolved.
- Each step lists what to show and which open PRD decisions (D1–D13) to ask about.
- Notes typed in the panel are saved in that browser only. **Copy all notes** copies them as Markdown for the meeting summary.
- **Reset mock** starts the mock over. **Open full screen** opens the mock on its own.
- Links like `/walkthrough?step=catalog` open a given step.

The mock is a single static file, [`apps/web/public/mock/index.html`](apps/web/public/mock/index.html). It works without the app too: open it directly in a browser. Its data is illustrative; only the totals and overrides quoted in the PRD are real.

To change the agenda, edit [`apps/api/src/walkthrough.ts`](apps/api/src/walkthrough.ts).

## Project layout

```
apps/
  api/                    Hono backend
    src/app.ts            routes; exports AppType for the typed client
    src/server.ts         Node server (also serves the built web app in production)
    src/walkthrough.ts    walkthrough agenda data
  web/                    React frontend (Vite)
    src/routes/           TanStack Router file-based routes
      __root.tsx          layout and top nav
      index.tsx           home
      walkthrough.tsx     presenter view: agenda + embedded mock
    src/lib/api.ts        typed Hono client + TanStack Query options
    public/mock/          the interactive HTML mock
docs/                     PRD and architecture
```

**Adding a page:** create a file in `apps/web/src/routes/`, for example `about.tsx` for `/about`. The TanStack Router Vite plugin regenerates `src/routeTree.gen.ts`; don't edit that file by hand.

**Adding an API endpoint:** chain another `.get(...)` or `.post(...)` onto the app in `apps/api/src/app.ts`. The web app sees it through `api.api.<path>.$get()` with types, no codegen.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API + web with reload |
| `npm run build` | Build the web app into `apps/web/dist` |
| `npm start` | Serve API + built web app on port 3001 (`PORT` to change) |
| `npm run typecheck` | TypeScript check for both apps |
