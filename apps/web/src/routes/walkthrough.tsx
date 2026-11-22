import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { walkthroughQuery } from '../lib/api'

type Search = { step?: string }

export const Route = createFileRoute('/walkthrough')({
  // ?step=catalog in the URL selects a step, so a link can open a given screen.
  validateSearch: (search: Record<string, unknown>): Search => ({
    step: typeof search.step === 'string' ? search.step : undefined,
  }),
  component: Walkthrough,
})

const MOCK_URL = '/mock/index.html'

// Presenter notes are a per-browser convenience; storage can be unavailable.
const notesKey = (id: string) => `walkthrough-notes:${id}`
function readNotes(id: string) {
  try {
    return localStorage.getItem(notesKey(id)) ?? ''
  } catch {
    return ''
  }
}
function writeNotes(id: string, value: string) {
  try {
    localStorage.setItem(notesKey(id), value)
  } catch {
    /* ignore */
  }
}

function Walkthrough() {
  const { data, isPending, isError } = useQuery(walkthroughQuery)
  const { step: stepParam } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const frame = useRef<HTMLIFrameElement>(null)
  const [frameKey, setFrameKey] = useState(0)
  const [copied, setCopied] = useState(false)

  const steps = data?.steps ?? []
  const index = Math.max(0, steps.findIndex((s) => s.id === stepParam))
  const step = steps[index]

  const [notes, setNotes] = useState('')
  useEffect(() => {
    if (step) setNotes(readNotes(step.id))
  }, [step?.id])

  // Move the mock to the step's screen by changing its hash.
  // The mock keeps its state (approvals, resolved exceptions) across steps.
  useEffect(() => {
    const win = frame.current?.contentWindow
    if (step && win) {
      try {
        win.location.hash = step.mockScreen
      } catch {
        /* frame not ready yet; its src already points at the screen */
      }
    }
  }, [step?.mockScreen, frameKey])

  const goTo = (i: number) => {
    const next = steps[Math.min(Math.max(i, 0), steps.length - 1)]
    if (next) navigate({ search: { step: next.id } })
  }

  // ← / → move between steps, except while typing notes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'ArrowRight') goTo(index + 1)
      if (e.key === 'ArrowLeft') goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const copyAllNotes = async () => {
    const text = steps
      .map((s) => `## ${s.title}\n${readNotes(s.id).trim() || '(no notes)'}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(`# Walkthrough notes\n\n${text}\n`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  if (isPending) return <main className="page">Loading agenda…</main>
  if (isError || !step)
    return (
      <main className="page">
        <h1>Could not load the agenda</h1>
        <p className="muted">The walkthrough agenda comes from the API. Is `npm run dev` running?</p>
      </main>
    )

  const total = steps.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <div className="walk">
      <aside className="walk-panel">
        <ol className="agenda">
          {steps.map((s, i) => (
            <li key={s.id}>
              <Link
                to="/walkthrough"
                search={{ step: s.id }}
                className={i === index ? 'active' : i < index ? 'past' : ''}
              >
                <span className="num">{i + 1}</span>
                <span className="title">{s.title}</span>
                <span className="mins">{s.minutes}m</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="faint small">About {total} minutes · ← → to move between steps</p>

        <section className="step-detail">
          <span className="eyebrow">
            Step {index + 1} of {steps.length}
          </span>
          <h2>{step.title}</h2>
          <p className="goal">{step.goal}</p>

          <h3>Show</h3>
          <ul>
            {step.show.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>Ask the customer</h3>
          <ul className="asks">
            {step.ask.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>
            <label htmlFor="notes">Notes</label>
          </h3>
          <textarea
            id="notes"
            rows={5}
            value={notes}
            placeholder="Answers, decisions, follow-ups…"
            onChange={(e) => {
              setNotes(e.target.value)
              writeNotes(step.id, e.target.value)
            }}
          />
          <div className="row">
            <button className="btn" onClick={() => goTo(index - 1)} disabled={index === 0}>
              ← Back
            </button>
            <button
              className="btn primary"
              onClick={() => goTo(index + 1)}
              disabled={index === steps.length - 1}
            >
              Next →
            </button>
            <span className="spacer" />
            <button className="btn" onClick={copyAllNotes}>
              {copied ? 'Copied' : 'Copy all notes'}
            </button>
          </div>
        </section>
      </aside>

      <section className="walk-stage">
        <div className="stage-bar">
          <span className="faint small">
            Mock screen: <code>#{step.mockScreen}</code>
          </span>
          <span className="spacer" />
          <button className="btn sm" onClick={() => setFrameKey((k) => k + 1)}>
            Reset mock
          </button>
          <a className="btn sm" href={`${MOCK_URL}#${step.mockScreen}`} target="_blank" rel="noreferrer">
            Open full screen ↗
          </a>
        </div>
        <iframe
          key={frameKey}
          ref={frame}
          className="stage-frame"
          title="Unit Types Onboarding mock"
          src={`${MOCK_URL}#${step.mockScreen}`}
        />
      </section>
    </div>
  )
}
