# Architecture proposal (for discussion)

Status: draft, nothing built yet. Pairs with [PRD.md](PRD.md) and the clickable mock in [`mocks/index.html`](../mocks/index.html).

## Stack

A small TypeScript monorepo (pnpm workspaces). Beginner-friendly: one language, one package manager, and each piece is a well-documented library.

```
prop-mgmt/
├─ apps/
│  ├─ web/          React + Vite + TanStack Router / Query / Table
│  └─ api/          Hono on Node (@hono/node-server)
├─ packages/
│  ├─ core/         the rules: pure functions, no I/O, tested against Julius
│  └─ io/           Yardi adapters (xlsx → flat tables) and writers (xlsx, zip)
├─ fixtures/julius/ golden test set (not committed if confidential; see below)
├─ data/            per-property uploads/ and outputs/ at runtime (git-ignored)
└─ docs/
```

| Piece | Choice | Why |
| --- | --- | --- |
| Frontend routing | **TanStack Router** (file-based routes, typed params) | One route per screen in the mock; type-safe links like `/properties/$code/catalog` |
| Server state | **TanStack Query** | Every screen is "fetch the pipeline result, post an override, refetch". Query does caching and invalidation for us |
| Big tables | **TanStack Table** | Crosswalk (67 rows) and unit mapping (356 rows) need sort/filter; headless, so it uses our own styling |
| Backend | **Hono** + `@hono/zod-validator` | Small, standard, and its RPC client (`hc<AppType>`) gives the frontend typed API calls without codegen |
| Validation | **zod** | One schema for the header form, the API body and the stored settings |
| Database | **SQLite** via **Drizzle ORM** | One file, no server. Holds properties, settings, overrides, acks, change log, approvals. Swap to Postgres later if D1 needs it |
| Files | Local folder `data/properties/<code>/{uploads,outputs}` | Uploads kept unchanged; outputs replaced whole on each run (PRD step 9) |
| Excel read/write | **ExcelJS** | Reads the Yardi exports and the template, writes the mapping workbook, keeps formulas. See risk below |
| Zip | **fflate** or **archiver** | Renamed floor plans zip |
| PDF preview | Browser's built-in viewer (`<iframe src=…>`) | Julius plans are scanned images; no parsing in the MVP |
| Tests | **Vitest** | Same runner for core, io and api |

**Why TanStack Router + Hono rather than TanStack Start?** You asked for a standard Hono backend. Start bundles its own server functions, which would duplicate Hono. A Vite SPA + separate Hono API is the simplest split and keeps the API reusable if this later becomes a FieldOps feature (D1). In dev, Vite proxies `/api` to Hono; in production Hono can serve the built SPA from one process.

## The one design idea that matters: recompute, don't store results

The PRD asks for "re-run of an approved property gives the same outputs" and "an edit re-runs steps 5–8". The easiest way to get both:

```
outputs = runPipeline(uploads, header, catalogConfirmations, overrides, acks)
```

- We **store inputs only**: the uploaded files (by hash), the header, the analyst's catalog confirmations, overrides (A3D → B2, AMI 50% → `a` …), and exception acknowledgements, each with a change-log row.
- The pipeline in `packages/core` is a pure function. It runs on every request; 356 units takes milliseconds.
- **Approval stores a hash of the pipeline result.** If anything changes after approval, the hash no longer matches and gate 1 reopens. That makes "nothing reaches the ETL until a person approved this exact mapping" enforceable, not just a UI rule.
- Exceptions get **stable IDs** derived from their subject (e.g. `no-plan:a3d-1`), so an acknowledgement survives a re-run as long as the same issue is still there.

## Core pipeline (packages/core)

Each PRD step is one small, separately tested module:

| Module | In | Out |
| --- | --- | --- |
| `reconcile` | directory, rent schedule, rent roll tables | ok, or stop with units on each side |
| `catalog` | plan files, prior codes, confirmations | plans with beds/baths/den + conflicts |
| `match` | prior codes, plans, overrides | code → plan with evidence `[L, BB, D, SF, U]`, candidates for exceptions |
| `helpers` | plans + unit SF | `S01…`, `A07+`… (sort by smallest SF, natural-sort ties, den `+`) |
| `regulatory` | regulatory list, AMI table, AMI overrides | reg code per unit, or stop |
| `units` | all of the above | unit mapping rows, floor/line |
| `validate` | everything | the PRD's validation table |

Adapters in `packages/io` turn files into the flat tables `core` expects, so a non-Yardi system later is a new adapter only.

## API sketch (Hono)

```
GET    /api/properties
POST   /api/properties                         header form
PUT    /api/properties/:code/header
POST   /api/properties/:code/uploads           multipart; kind = directory|rentSchedule|rentRoll|plan|regulatory|template
GET    /api/properties/:code/pipeline          full result: reconcile, catalog, matches, helpers, units, exceptions, checks
POST   /api/properties/:code/catalog/:plan     confirm / correct beds, baths, den, SF
POST   /api/properties/:code/overrides         { kind: 'match'|'amiCode'|'exclude'…, subject, value, reason }
POST   /api/properties/:code/exceptions/:id/ack
POST   /api/properties/:code/approve/gate1     stores result hash; runs steps 9–10
GET    /api/properties/:code/outputs/:file     downloads
GET    /api/properties/:code/files/plans/:name PDF preview
POST   /api/properties/:code/approve/gate2     marks complete
```

## Frontend routes (TanStack Router)

Matches the mock one-to-one:

```
/                                   properties list
/properties/$code/setup             steps 1–2
/properties/$code/catalog/$plan?    step 3
/properties/$code/matching          step 4
/properties/$code/review?tab=…      steps 5–8, gate 1
/properties/$code/outputs           steps 9–10, gate 2
```

The left step rail reads the same `GET /pipeline` response, so its badges ("24 of 26 confirmed", "3 blocking") are always in sync.

## Risks to settle early

1. **ExcelJS and the ETL template.** ExcelJS rewrites the whole file and can drop features it doesn't model (some data validation, pivot caches, charts, external links). The PRD says "write only input columns". Plan: spike on the real template in week 1. If anything is lost, write column G and C2–C8 by patching the sheet XML inside the xlsx directly (unzip, edit cells, re-zip), which leaves everything else byte-identical.
2. **Fixtures.** The golden test is the Julius rebuild. Without the real files we can only build against made-up data. Are the files shareable, and can they be committed, or do they stay outside git (e.g. a `fixtures/` path in `.gitignore` plus a local download step)?
3. **"Byte for byte in content."** xlsx files embed timestamps, so we compare cell contents, not file bytes. Worth confirming that's what the PRD means.
4. **D1 (where it lives)** decides auth. For the MVP I'd ship with no auth behind the company network, or a single shared login, and record "who" as a free-text name in the change log until D1 is settled.

## Suggested build order

1. Repo skeleton: web + api + core, `pnpm dev` runs both, one route calling one Hono endpoint (the "hello world" that proves the wiring).
2. `core` + `io` with unit tests on hand-made sample data; Julius golden test as soon as the files arrive.
3. Property + uploads + reconcile (screens 1–2).
4. Catalog, matching, overrides (screens 3–4).
5. Review + gate 1 + mapping workbook writer.
6. Rename/zip + ETL fill + gate 2.

## Questions for you

- OK with SQLite + local files for the MVP, deployed as one Node process? Or is there a target platform (Vercel, an internal VM, Docker)?
- Can we get the Julius files, and may they live in the repo?
- Anything in the mock flow that's wrong for how analysts actually work (e.g. should catalog confirmation come before or after seeing the matches)?
