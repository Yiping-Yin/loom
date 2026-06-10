/* eslint-disable react/no-unescaped-entities */
/**
 * /help · Loom's usage guide.
 *
 * Explains the two primary workspaces — Sources and Draft — and the
 * support surfaces around them.
 *
 * Access paths:
 *   - /help (direct URL)
 *   - Shuttle: ⌘K
 *   - KeyboardHelpOverlay footer: "/help" link
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageFrame } from '../../components/PageFrame';

export const metadata = { title: 'Help · Loom' };

export default function HelpPage() {
  return (
    <article className="prose-notion" style={{ paddingTop: '4.5rem', paddingBottom: 'var(--space-9)' }}>
      <PageFrame
        eyebrow="Help"
        title="Usage Guide."
        description={
          <>
            Loom is a reading-and-thinking environment where source-bound understanding
            becomes durable memory.{' '}
            <Link href="/about" style={{ color: 'var(--accent)' }}>/about</Link>
          </>
        }
      >
      <h2>Two workspaces</h2>
      <p>Everything in Loom happens in one of two places:</p>
      <ul>
        <li>
          <Link href="/sources">/sources</Link> - add, capture, and review source material.
          Web captures and local files sit on the same shelf, and original files stay
          read-only.
        </li>
        <li>
          <Link href="/draft">/draft</Link> - write with your sources beside you. Marked
          passages attach as references, and citations point back to the exact passage
          they came from.
        </li>
      </ul>

      <Callout>
        <strong>Quick start:</strong> open Sources, read, mark a passage, then switch to
        Draft and write with the passage attached. That's the whole loop.
      </Callout>

      <h2>The core loop</h2>
      <ol>
        <li>
          <strong>Bring material in.</strong> Capture a page from the web or point Loom at
          a local file in Sources.
        </li>
        <li>
          <strong>Read and mark.</strong> Select a passage to note it, or hold a question
          in place for later.
        </li>
        <li>
          <strong>Write in Draft.</strong> Your marked passages travel with you as attached
          references beside the text.
        </li>
      </ol>
      <p>
        That's it: <strong>read → mark → write</strong>. Everything else in Loom supports
        this loop.
      </p>

      <h2>Getting around</h2>
      <ul>
        <li>
          <strong>Shuttle</strong> — press <Kbd>⌘K</Kbd> to jump anywhere: a source, a
          draft, or any support surface.
        </li>
        <li>
          <strong>Home</strong> — the quiet start surface. It shows current work and recent
          threads; it is not a feed.
        </li>
      </ul>

      <h2>Support surfaces</h2>
      <ul>
        <li>
          <Link href="/system">/system</Link> — how the loop fits together, on one sheet
        </li>
        <li>
          <Link href="/discipline">/discipline</Link> — the six product refusals, written
          down
        </li>
        <li>
          <Link href="/year">/year</Link> — the annual review: twelve months of material,
          by weight
        </li>
        <li>
          <Link href="/hour">/hour</Link> — the current thinking window, ticking
        </li>
        <li>
          <Link href="/connections">/connections</Link> — correspondents and cross-origin
          links between sources
        </li>
      </ul>

      <h2>Where your data lives</h2>
      <ul>
        <li>
          <strong>Locally.</strong> Notes and drafts live on this machine; nothing is
          uploaded on its own.
        </li>
        <li>
          <strong>AI runs through local runtimes</strong> — and only when you ask. It never
          speaks first.
        </li>
        <li>
          <strong>Original files are never modified</strong> — your notes are a separate
          layer kept alongside the sources.
        </li>
        <li>
          <strong>History is append-only</strong> — edits and removals hide things from
          view; nothing is destroyed.
        </li>
      </ul>

      <h2>Troubleshooting</h2>

      <Trouble
        symptom="AI is unavailable"
        fix="Loom runs through local AI runtimes on this machine. Open Settings and check the preferred AI runtime."
      />
      <Trouble
        symptom="Can't find a feature"
        fix="Press ⌘K to open the Shuttle and search by keyword. Or press ? to see the full keyboard shortcuts list."
      />
      <Trouble
        symptom="Removed a note and want it back"
        fix="Removal only hides the note from view — history is append-only, and JSON export shows everything."
      />

      <h2>North star</h2>
      <p style={{ fontStyle: 'italic', color: 'var(--fg-secondary)' }}>
        Notes are a byproduct of learning, not the object of learning. Time spent filing
        thoughts is time not spent learning.
      </p>
      <p>
        Your only job is to <strong>read, mark, and write</strong>. Leave the rest to Loom.
      </p>
      </PageFrame>
    </article>
  );
}

// ── components ───────────────────────────────────────────────────────────

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        padding: '1px 6px',
        fontSize: '0.82em',
        fontFamily: 'var(--mono)',
        background: 'var(--code-bg)',
        border: 'var(--hairline)',
        borderRadius: 4,
        color: 'var(--fg)',
      }}
    >
      {children}
    </kbd>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '0.6rem 0 0.6rem 1rem',
        borderLeft: '1px solid color-mix(in srgb, var(--accent) 55%, transparent)',
        background: 'transparent',
        borderRadius: 0,
        margin: '1.2rem 0',
        fontStyle: 'italic',
        color: 'var(--fg)',
        fontSize: '0.92rem',
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function Trouble({ symptom, fix }: { symptom: string; fix: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        marginBottom: 8,
        borderLeft: '2px solid var(--muted)',
        background: 'color-mix(in srgb, var(--fg) 3%, var(--bg))',
        borderRadius: '0 6px 6px 0',
        fontSize: '0.86rem',
        lineHeight: 1.55,
      }}
    >
      <div
        className="loom-smallcaps"
        style={{
          fontFamily: 'var(--serif)',
          fontSize: '0.86rem',
          color: 'var(--muted)',
          fontWeight: 500,
          marginBottom: 3,
        }}
      >
        {symptom}
      </div>
      <div style={{ color: 'var(--fg)' }}>{fix}</div>
    </div>
  );
}
