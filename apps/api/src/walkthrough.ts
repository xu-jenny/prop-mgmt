// Agenda for the customer walkthrough of the MVP mock.
// Each step points at a screen of the mock (apps/web/public/mock/index.html)
// via its URL hash, and lists what to demo and which open PRD decisions to raise.

export type WalkthroughStep = {
  id: string
  title: string
  /** Hash route inside the mock, e.g. "catalog" → /mock/index.html#catalog */
  mockScreen: string
  minutes: number
  goal: string
  show: string[]
  ask: string[]
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'context',
    title: 'Context and goal',
    mockScreen: 'properties',
    minutes: 5,
    goal: 'Agree on the problem: the analyst reviews the mapping instead of building it, and nothing reaches the ETL without approval.',
    show: [
      'Julius as the example: 356 units, 67 Yardi codes that collapse into 26 floor plans and 30 final types.',
      'The property list: each property keeps its uploads, settings and approvals, so a re-run reproduces the result.',
      'The mock uses illustrative data. Only the totals and overrides quoted in the PRD are real.',
    ],
    ask: [
      'D1: where does the tool live — a FieldOps feature, its own product, or an internal tool? Who signs in?',
      'Is "about 1 hour of review per property" the right target?',
    ],
  },
  {
    id: 'setup',
    title: 'Header and uploads',
    mockScreen: 'setup',
    minutes: 8,
    goal: 'Confirm the inputs and the stop rule when unit counts disagree.',
    show: [
      'The property header fills rows 2–8 of the ETL Final tab. Zip is kept as text (06901).',
      'Six uploads, each with a one-line summary of what was read from it.',
      'Unit counts reconciled across directory, rent schedule and rent roll.',
      'Turn on "Preview the stop state": one unit missing from the rent roll stops the run and names the unit.',
    ],
    ask: [
      'Is the rent roll always available, or only sometimes?',
      'Regulatory list template: is Unit / Regulatory Status / AMI % enough?',
      'Are the Yardi report names and layouts stable across properties?',
    ],
  },
  {
    id: 'catalog',
    title: 'Floor plan catalog',
    mockScreen: 'catalog',
    minutes: 10,
    goal: 'Agree that the analyst confirms each plan against its drawing in the MVP, and that the drawing wins.',
    show: [
      'Plan A2D: prior data says 1 bath, drawing says 2. The conflict is recorded and the plan wins.',
      'Plan B2: file name has no D, but the drawing shows 1 bed + den.',
      'Each proposed value says where it came from (file name or prior data).',
      'Confirm B9 and B10 to clear the "plan unconfirmed" exception.',
    ],
    ask: [
      'D2: den decided by the drawing, not the prior label?',
      'D11: B2 treated as 1 bed + den (A11+)?',
      'Is confirming ~26 plans by hand acceptable until automatic drawing reading (phase 2)?',
    ],
  },
  {
    id: 'matching',
    title: 'Matching prior codes',
    mockScreen: 'matching',
    minutes: 10,
    goal: 'Walk through the evidence order and how the tool asks instead of guessing.',
    show: [
      'Evidence chips per code: label, beds/baths, den, SF, units. Green agreed, red disagreed, grey not available.',
      'The A3D codes name no plan, so they become a blocking exception with ranked candidates.',
      'Pick B2. The choice is saved as an override and written to the change log.',
    ],
    ask: [
      'Is the evidence order (label → beds/baths → den → SF → units) right?',
      'How close is "near" for SF when a unit falls just outside a plan\'s range?',
    ],
  },
  {
    id: 'review',
    title: 'Review and gate 1',
    mockScreen: 'review',
    minutes: 15,
    goal: 'Show that approval is only possible once every exception is handled, and agree on who approves.',
    show: [
      'Exceptions tab: three blocking, four review. Approve stays disabled until all are handled.',
      'Save AMI code "a" for the 50% tier, then acknowledge the four review items.',
      'Plan summary tab: helpers S01…B10+, numbered by smallest SF, den plans with "+".',
      'Validation tab: checks turn green as exceptions are resolved.',
      'Change log tab: every override with old value, new value and reason.',
      'Approve the mapping.',
    ],
    ask: [
      'D5: should the template\'s AMI tab gain a 50% row, so "a" is not hand-entered?',
      'D10: affordable codes always from the AMI tab, with "a" only as a fallback?',
      'D9: what SF spread counts as "wide" (A6 ran 661–715)?',
      'Does gate 1 need a second reviewer, or can the analyst approve their own mapping?',
    ],
  },
  {
    id: 'outputs',
    title: 'Outputs and gate 2',
    mockScreen: 'outputs',
    minutes: 10,
    goal: 'Confirm the deliverables, file names and the final Excel check.',
    show: [
      'Four downloads: mapping workbook, filled ETL workbook, renamed floor plans zip, exceptions list.',
      'Floor plan files are copied to Rose names, one per helper. The sources are never renamed.',
      'ETL check: 131 rows were missing the column H formula and were restored.',
      'The analyst confirms they opened the workbook in Excel, then marks the property complete.',
    ],
    ask: [
      'D8: restore missing column H formulas (proposed), refuse the template, or write values?',
      'D12: which rent fills the ETL — directory, market, or rent roll actual?',
      'D7: should the ETL Bed/Bath description include "+ Den"?',
      'Are the output file names exactly what the team expects?',
    ],
  },
  {
    id: 'next',
    title: 'Next steps',
    mockScreen: 'properties',
    minutes: 5,
    goal: 'Leave with owners and dates for what unblocks the build.',
    show: [
      'Recap the decisions taken today.',
      'Build order: skeleton → rules engine with Julius as the golden test → screens in the order shown.',
    ],
    ask: [
      'Who sends the Julius files (three Yardi exports, 26 plan PDFs, regulatory list, template, approved mapping)?',
      'Where will this run, and who needs access?',
    ],
  },
]
