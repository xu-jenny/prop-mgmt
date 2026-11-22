# Unit Types Onboarding PRD (MVP)

Date: 2026-11-22
Status: proposal. Not built; where it lives (FieldOps feature, its own product, or an internal tool) is an open question ([D1](#open-decisions)).
Source: *Units & Unit Types Creation — Process and Automation Requirements*, v1.0, 2026-11-11 (Financial & Strategic Solutions). Section numbers below written "source §N" point there.

An analyst uploads a new property's files, reviews one mapping, and downloads every report the onboarding needs: the unit type mapping workbook, the filled ETL workbook and the floor plans renamed to Rose names.

## Problem and goal

When Rose Associates takes over a property, every apartment has to be given a Rose unit type code (for example `194mA07+`) and loaded through the Units & Unit Types ETL workbook. An analyst does this by hand today: reads the prior manager's reports, compares them with the architect's floor plans, names each plan, and fills the workbook row by row.

It is slow and easy to get wrong:

- Prior systems create a new code for every SF variation. At Julius, 67 Yardi codes collapsed into 26 floor plans; plan A6 alone had 10.
- Prior labels are often wrong. Yardi's "1 Bed/2 Bath Den-A3D" was the developer's plan B2, and "Studio Den-S3" was plan S4.
- The ETL template itself had gaps: 131 of 356 rows were missing the Final Unit Type formula, so the type count read 29 instead of 30.

**Goal:** the analyst uploads the files and reviews the result instead of building it, and nothing reaches the ETL until a person has approved the mapping.

| Success measure | Target (proposed) |
| --- | --- |
| Julius rebuilt from its files | Exactly the source §6 result: 356 units, 67 codes → 26 helpers, 30 final types, 26 renamed plans |
| Analyst time per property | Review only, about 1 hour, down from building by hand (baseline to measure) |
| Decisions the tool guessed instead of asking | 0: every unsure call is on the exceptions list |
| Units in the ETL workbook without a helper or final code | 0 |
| Re-run of an approved property | Same outputs, byte for byte in content, from the saved settings and overrides |

## Users

| User | What they do |
| --- | --- |
| Onboarding analyst | Uploads the files, fills the property header, works the exceptions list, approves the mapping, downloads the outputs, checks the ETL workbook |
| Reviewer (may be the same person) | Approves gate 1 when a second pair of eyes is required |

## MVP scope

The MVP is **upload → organize → review → download**. It does not connect to Yardi or to Rose's systems and does not run the ETLs.

### In

- Uploads: Yardi ResAnalytics unit directory, market rent schedule and rent roll; one floor plan PDF per plan; a regulatory list; the ETL workbook template; a property header form.
- Parsing and reconciling the three Yardi reports (source §3.1).
- A **floor plan catalog the analyst confirms**: plan name from the file name, bedrooms, baths and den PROPOSED from the prior data and the file name, shown beside the drawing for the analyst to confirm or correct. Drawing data wins over prior data whenever they disagree.
- Matching prior codes to plans by the source §5 Step 4 evidence order, with the evidence recorded for every match.
- Rose helper naming, regulatory codes and final codes (source §4, §6), including C/D letters and several AMI tiers.
- The unit-level mapping, floor and line.
- An exceptions list, analyst overrides and a change log.
- Approval gate 1 (mapping) and gate 2 (ETL check).
- All five deliverables (source §2) plus the exceptions list.
- Every validation check in source §9 that can be judged without Excel (see [Validation](#validation)).
- Saved per-property settings so a re-run reproduces the approved result.

### Out (later phases)

| Deferred | Why | Phase |
| --- | --- | --- |
| Reading the drawings automatically (OCR or an image model) | Julius's PDFs are scanned images with no text layer; it is the riskiest piece and the analyst-confirmed catalog covers it until then | 2 |
| Prior systems other than Yardi | One input adapter per system; the rest of the pipeline is unchanged | 3 |
| New construction with no prior system (developer's unit schedule only) | The schedule's format is not specified yet | 3 |
| Combined floor plan PDFs and marketing brochures | Needs page splitting by detected plan title | 3 |
| Writing to Rose's system or running the ETLs | Out of this tool's job; the analyst runs the ETLs | n/a |

## Inputs

| Upload | Required | MVP handling |
| --- | --- | --- |
| Unit directory (`ResAnalytics_Unit_Directory_<code>.xlsx`) | Yes | Headers in row 3 (Unit, Address, Unit Type, Rent, Deposit, Sqft, Room, Baths, Notes), units from row 5. Drop Total and Grand Total rows. Unit numbers as text. `Room` is bedrooms (0 = studio). `Baths` arrives as text like `"1.000000"` and becomes a number. |
| Market rent schedule (`ResAnalytics_Market_Rent_Schedule_<code>.xlsx`) | Yes | Three-row header (rows 4–6), data from row 7, drop Grand Total. Split each description `bed/bath text-plan label (code)` into its three parts, trimming spaces around the dash (`Den -A3D`, `Den- A3D`). |
| Rent roll with lease charges (`ResAnalytics_Rent_Roll_with_Lease_Charges_<code>.xlsx`) | Recommended | Collapse unit line + charge lines to one row per unit across the resident sections; skip the summary blocks. Used only to reconcile the count and flag non-revenue or down units. |
| Floor plans (one PDF or image per plan) | Yes in the MVP | Plan name from the file name (at Julius, the token after `Toll Brothers_`, e.g. `A1D`). A `D` suffix proposes a den. The drawing is shown in the catalog for the analyst to confirm. |
| Regulatory list | Yes if any unit is affordable | MVP defines an upload template: `Unit`, `Regulatory Status`, `AMI %`. A prior code with an `m` prefix (Julius's convention) is a signal to confirm against this list, never the rule. |
| ETL workbook template (`<code> - <name> - Units & Unit Types.xlsx`) | Yes | Read for the AMI & Regulatory Status table and the Final tab layout; written in Step 10. |
| Property header (form) | Yes | Rose property code, name, street, city, state, zip, country. Zip stored as text (`06901`). |

## How it works

The ten steps of source §5, as the tool runs them. Steps marked **stop** halt the run with the reason on screen.

1. **Property header.** The analyst fills the form. It fills rows 2–8 of the Final tab.
2. **Parse and reconcile.** Parse the three Yardi reports into flat tables. The unit count must agree across the directory, the rent schedule's Grand Total and the rent roll. **Stop** if they disagree, listing the units on each side.
3. **Floor plan catalog.** One row per uploaded plan: name, bedrooms, baths, den, drawing SF (optional). The tool proposes values; the analyst confirms each plan. A file name that says den when the analyst marks no den (or the reverse) is recorded as a conflict.
4. **Match prior codes to plans.** Each prior code maps to exactly one plan. Evidence, in order: (1) label matches a plan name, (2) beds and baths match, (3) den matches, (4) unit SF inside or near the plan's SF, (5) unit numbers or stacks, if the plan lists them. The tool records which pieces agreed. A code whose label names no plan, or whose label and bed/bath/SF evidence disagree, goes to the exceptions list with the best-fitting candidates; the analyst picks.
5. **Name helpers.** Group plans by bedroom letter (S, A, B, C, D), sort by the smallest unit SF in the plan, ties by natural sort of the plan name, number from 01, add `+` to den plans. Den plans take their place by SF in the same sequence, so `A01` and `A01+` never both exist. A first use of C or D is a review item.
6. **Regulatory status and AMI.** Mark each unit market or affordable from the regulatory list. Market is `m`. An affordable unit's code comes from the template's AMI & Regulatory Status tab (40% `af`, 60% `as`, 80% `ae`, 100% `ah`, 110% `aq`, 120% `ar`, 130% 421a `an`, 421a MIRP `am`). **Stop** on an AMI % with no code until the analyst supplies one ([D5](#open-decisions)).
7. **Unit-level mapping.** Join every unit to its plan, helper, regulatory code and final code (`<property code><reg code><helper>`, e.g. `194mS01`, `194aS01`). Unit-level property code (column B) is the property code plus `r` (Residential, Rent Controlled, Stabilized DHCR) or `a` (Affordable, Affordable DHCR). Floor and line from the unit number: 3 digits → floor = first digit; 4 digits → floor = first two; line = last two. Any other unit number shape is an exception for the analyst to fill.
8. **Mapping workbook — approval gate 1.** Write the mapping workbook and show it on screen. Nothing downstream runs until the analyst approves. Approval needs every blocking exception resolved and every review item acknowledged. An edit to a helper or a match re-runs Steps 5–8 and adds a change log row (old, new, reason, who, when).
9. **Rename floor plans** (after approval only). Copy each source file to its Rose name in a fresh output folder and zip it. Never rename the sources. A re-run replaces the folder and zip whole, so no stale name survives.
10. **Fill the ETL workbook — approval gate 2.** Write the helper into column G of the Final tab, matched by unit number, never by row position. Write only input columns. Then run the validation checks again and hand the workbook to the analyst to open and check before the ETLs run. The analyst marks the property complete.

## Outputs

All outputs go to a per-property output folder; the uploads are kept unchanged.

### 1. Unit Type Mapping workbook — `<code> - <name> - Unit Type Mapping.xlsx`

| Tab | One row per | Columns |
| --- | --- | --- |
| Plan Summary | Floor plan | Helper, plan name, prior plan labels, prior codes, beds, baths, den, SF min, SF max, market units, affordable units, final codes, provisional? |
| Prior Code Crosswalk | Prior code | Prior code, description, parsed label, bed/bath text, unit count, SF, market rent, matched plan, helper, evidence agreed (label/beds-baths/den/SF/units), confidence, overridden? |
| Unit Mapping | Unit | Unit, prior code, plan, helper, regulatory status, AMI %, reg code, final code, unit property code, floor, line, SF, beds, baths, rent |
| Settings | Setting | Property header, market code, AMI table used, approved overrides |
| Floor Plan Files | Plan file | Source file name → Rose file name |
| Exceptions | Exception | ID, severity (blocking / review), kind, subject, detail, resolution, resolved by |
| Change Log | Change | When, who, field, old, new, reason |

The Prior Code Crosswalk is deliverable 2 and the Unit Mapping tab is deliverable 3 of source §2.

### 2. Filled ETL workbook — `<code> - <name> - Units & Unit Types.xlsx`

The uploaded template with column G (Helper) filled from row 11, plus the header inputs C2–C8. Formula columns (H Final Unit Type, M Bed/Bath, O Reg Code) are left as formulas. Where a row is missing the column H formula, the tool restores it from the template's pattern and lists the row as an exception ([D8](#open-decisions)).

### 3. Renamed floor plans

- Folder: `<name> Floor Plans - Rose Names/`, one file per helper (not per final code: market and affordable units share a drawing), e.g. `194 - Julius - A07+.pdf`.
- Zip: `<code> - <name> - Floor Plans (Rose Names).zip`.

### 4. Exceptions list

On screen and in the mapping workbook. **Blocking** exceptions stop approval: unit counts disagree, a prior code matches no plan, a plan is unconfirmed, an AMI % has no code, a unit number has no floor or line. **Review** exceptions need acknowledgement: label disagrees with the matched plan, bath count disagrees with the plan, den disagrees with the file name, a plan's SF spread is wide (A6 ran 661–715), first use of C or D, a unit that looks like a non-apartment, a restored column H formula.

## Situations the MVP handles

| Situation | Handling |
| --- | --- |
| Many prior codes per plan | Group to the plan; never one Rose type per prior code |
| Prior label disagrees with the plan | The plan wins; review exception |
| Same plan, slightly different SF | One plan; review exception when the spread is wide ([D9](#open-decisions) sets "wide") |
| Den plans | Analyst confirms on the drawing; `+` and interleaved by SF |
| Bath count disagrees | The plan wins; review exception |
| Affordable units | Same helper as the market plan; code from the AMI tab; stop on a missing tier |
| Several affordable tiers | One final code per tier per plan, e.g. `194afA06` and `194asA06` |
| Floor plan missing for a prior code | The analyst can create a provisional plan from the prior label with bed/bath/SF; its helper is marked provisional |
| Units that are not apartments | Flagged (rent roll non-revenue, no beds/baths, commercial-looking code); the analyst excludes them from residential types |
| Combined or converted units | Analyst assigns the current layout; review exception |
| 3- and 4-bedroom units | C and D letters; review exception on first use |
| Unit counts do not reconcile | Stop before Step 5 and report the differences |

## Validation

Run after gate 1 and again after Step 10. Any failure blocks completion.

| Check | Rule | Julius |
| --- | --- | --- |
| Unit count | Mapped units = directory units = rent roll units | 356 = 356 |
| Every unit has a helper | No blank helper or final code | 0 blanks |
| Every prior code mapped | Each prior code → exactly one helper | 67 of 67 |
| Market/affordable split | Matches the regulatory list | 334 / 22 |
| Final type count | Distinct final codes = market codes + affordable codes | 26 + 4 = 30 |
| Sequence integrity | Each letter numbers 01..n, no gaps or duplicates | S01–S04, A01–A12, B01–B10 |
| Den rule | No number both with and without `+` | Pass |
| SF order | Helper numbers rise with the plan's smallest SF | Pass |
| Consistency within a helper | Same beds, baths and den for every unit | Pass |
| Code format | Property code + known reg code + helper | Pass |
| Floor plan files | One file per helper; every name matches a helper | 26 / 26 |
| ETL workbook | Every unit row has the column H formula; column G matches the mapping by unit number | Failed at first: 131 rows missing |

**Limit:** the tool checks that each formula is present and computes what column H should read, but it does not evaluate Excel formulas. "No formula errors" is confirmed by the analyst opening the workbook at gate 2.

## Acceptance: the Julius rebuild

The MVP is done when Julius's files, uploaded as-is, with the analyst confirming the catalog and making only the overrides listed below, produce:

- Helpers exactly as source §6: Studio S01 = S2 (472), S02 = S1, S03 = S3, S04 = S4; 1 bed A01 = A1 (584) … A07+ = A1D (681) … A11+ = B2 (973), A12+ = A2D (1,049); 2 bed B01 = B1 (966) … B10+ = B1D (1,468).
- 356 units (334 market, 22 affordable at 50% AMI, only in S01, S04, A06, B01), 67 codes → 26 helpers, 30 final types.
- Every unit row of the ETL workbook with column G filled and a column H formula, including the 131 rows that lacked one.
- 26 renamed PDFs and their zip.
- Every validation check passing.

Overrides the analyst is expected to make at Julius, because the MVP does not read drawings: the "A3D" codes → plan B2, entered as 1 bed + den; "Studio Den-S3" → plan S4, no den; A2D baths = 2; the 50% AMI code `a`. Each is saved in Settings, so a re-run needs none of them again.

**Fixtures needed:** the Julius files (three Yardi exports, 26 plan PDFs, the regulatory list, the template, and the approved mapping workbook as the expected answer). They are the golden test set.

## Shape (suggested, not decided)

- **Core (pure, no I/O):** parsed tables in → catalog, matches, helpers, codes, unit mapping, exceptions, check results out. Every rule above lives here and is tested against the Julius fixtures.
- **Input adapters:** one per source report layout (Yardi ResAnalytics first), each producing the same flat tables.
- **Writers:** mapping workbook, ETL workbook fill, renamed copies and zip.
- **Screens:** upload, property header, catalog confirmation, exceptions and mapping review (gate 1), downloads and completion (gate 2).
- **Saved per property:** settings, overrides, change log, approval records.

## Open decisions

D2–D8 are the source's own §11 questions with the Julius answer proposed as the standing rule. D1 and D9–D13 are gaps found while writing this PRD.

| # | Question | Proposed answer |
| --- | --- | --- |
| D1 | Where does the tool live: a FieldOps feature, its own product, or an internal tool? | Open. Decides auth, storage and who can sign in |
| D2 | Den decided by the drawing or by the prior label? | The drawing (S3 "Studio Den" → S04, no `+`) |
| D3 | Letters above 2 bedrooms | C = 3, D = 4; review on first use |
| D4 | Tie-break on equal smallest SF | Plan name, natural order |
| D5 | Code for an AMI tier not on the AMI tab (50% at Julius) | Stop and ask; the analyst's answer is saved for the property. Should the template's AMI tab gain a 50% row? |
| D6 | Baths disagree between plan and prior data | The plan (A2D = 2 baths) |
| D7 | ETL Bed/Bath description includes "+ Den"? | Not today (column M formula); the mapping workbook says "+ Den" |
| D8 | Missing column H formulas in the template | Restore them and list the rows (proposed), or refuse the template, or write values |
| D9 | Which SF orders the helpers: the unit directory's smallest unit SF or the drawing's SF? Source §6 uses the directory | The directory's smallest unit SF, as source §6 |
| D10 | Affordable regulatory code: always the AMI tab's code (`af`, `as` …) with `a` only as Julius's hand-entered fallback? | Yes |
| D11 | A plan labelled 2-bed but built as 1 bed + den (B2) | 1 bed + den (A11+), pending confirmation |
| D12 | Which rent fills the ETL: directory rent, market rent, or rent roll actual? | Directory rent |
| D13 | The Floor formula bug (`LEFT(2)` instead of `LEFT(C11,2)`) for 4-digit units | Review exception when any unit has 4 digits; fixing the template is Rose's call |

Not yet covered by the source and deferred past the MVP: multi-building properties (Final tab column F), unit numbers that are not 3 or 4 digits beyond manual entry, and the `Available_Date` / `Date_Ready` fixed at 12/31/2024 on the CommUnits tab.
