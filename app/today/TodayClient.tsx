'use client';
/**
 * /today — the daily free-thinking surface.
 *
 * §1, §6, §11 — Loom is not a productivity dashboard. The previous version
 * of this page mounted Apple-Fitness-style daily rings, fire-emoji streaks,
 * GitHub heatmaps, "weak spots" scoring, and three nested hero sections.
 * That entire framing — "close your rings, hit your goals" — is exactly
 * the gamified surveillance UX that §11 forbids and that ChatGPT-style
 * tools mistake for engagement.
 *
 * What /today actually IS: a frictionless capture surface for quick jots
 * and the entry point for today's thinking. Two quiet questions — what was
 * read today, and what is pinned for later — set in Vellum literary type.
 * A day is not a to-do list.
 *
 * Jots are persisted client-side in localStorage via lib/jot/jot-storage so
 * they work identically in dev, the web build, and the static macOS app
 * (loom://bundle, no Node server).
 */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { subscribeLoomMirror } from '../../lib/loom-mirror-store';
import {
  RECENT_RECORDS_KEY,
  loadRecentRecords,
  type LoomRecentRecord,
} from '../../lib/loom-recent-records';
import { readJots, appendJot, type Jot } from '../../lib/jot/jot-storage';

type Row = { href: string; title: string };

function greetingFor(hour: number): string {
  if (hour < 5) return 'Late.';
  if (hour < 12) return 'Morning.';
  if (hour < 18) return 'Afternoon.';
  if (hour < 22) return 'Evening.';
  return 'Late.';
}

function toMs(at: unknown): number {
  if (typeof at === 'number') return at;
  if (typeof at === 'string') { const n = Date.parse(at); return Number.isFinite(n) ? n : 0; }
  return 0;
}

function readJson(key: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function rowsReadToday(records: LoomRecentRecord[]): Row[] {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const threshold = start.getTime();
  const rows: Row[] = [];
  for (const r of records) {
    if (toMs(r.at) < threshold) continue;
    rows.push({ href: r.href, title: r.title });
    if (rows.length >= 5) break;
  }
  return rows;
}

async function loadToday(): Promise<Row[]> {
  return rowsReadToday(await loadRecentRecords());
}

function relativeTime(at: number): string {
  const diff = Date.now() - at;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  return `${days}d ago`;
}

function readPinned(): Row[] {
  const rows: Row[] = [];
  for (const entry of readJson('loom.pinned.v1')) {
    const r = entry as { href?: unknown; title?: unknown };
    if (typeof r?.href !== 'string' || typeof r?.title !== 'string') continue;
    rows.push({ href: r.href, title: r.title });
  }
  return rows;
}

export function TodayClient(_props: { totalDocs: number; docsLite: unknown[]; daily: unknown; recentCoworks?: unknown[]; embedded?: boolean }) {
  const { embedded = false } = _props;
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Morning.');
  const [read, setRead] = useState<Row[]>([]);
  const [pinned, setPinned] = useState<Row[]>([]);
  const [jots, setJots] = useState<Jot[]>([]);
  const [jotInput, setJotInput] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const jotRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const rows = await loadToday();
      if (!cancelled) setRead(rows);
    };
    setGreeting(greetingFor(new Date().getHours()));
    void hydrate();
    setPinned(readPinned());
    setJots(readJots());
    setMounted(true);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const rows = await loadToday();
      if (!cancelled) setRead(rows);
    };
    const dispose = subscribeLoomMirror(RECENT_RECORDS_KEY, 'loom-recents-updated', () => {
      void refresh();
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  const submitJot = () => {
    const jot = appendJot(jotInput);
    if (!jot) return;
    setJots(readJots());
    setJotInput('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
    // Restore focus so the user can keep typing without re-clicking.
    setTimeout(() => jotRef.current?.focus(), 0);
  };

  const handleJotKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitJot();
    }
  };

  const Container = embedded ? 'section' : 'main';
  const className = embedded ? 'loom-today loom-today--embedded' : 'loom-today';

  if (!mounted) return <Container className={className} />;

  const go = (href: string) => { window.location.href = href; };
  const isQuiet = read.length === 0 && pinned.length === 0;

  return (
    <Container className={className}>
      <p className="loom-today-greeting">{greeting}</p>

      {/* Jot capture — frictionless quick-thought input */}
      <section className="loom-today-section" style={{ marginBottom: '2rem' }}>
        <p className="loom-today-section-label">What are you thinking?</p>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={jotRef}
            value={jotInput}
            aria-label="Quick jot"
            placeholder="Type a thought and press Enter…"
            rows={1}
            onChange={(e) => {
              setJotInput(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(160, el.scrollHeight) + 'px';
            }}
            onKeyDown={handleJotKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--mat-border)',
              borderRadius: 0,
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--serif)',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--fg)',
              padding: '0.25rem 0 0.35rem',
              minHeight: 32,
              maxHeight: 160,
              overflowY: 'hidden',
            }}
          />
          {savedFlash && (
            <span
              aria-live="polite"
              style={{
                position: 'absolute',
                right: 0,
                bottom: '0.4rem',
                fontSize: '0.78rem',
                color: 'var(--accent)',
                fontFamily: 'var(--display)',
                letterSpacing: '0.02em',
                pointerEvents: 'none',
                opacity: savedFlash ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              Saved
            </span>
          )}
        </div>
      </section>

      {/* Recent jots */}
      {jots.length > 0 && (
        <section className="loom-today-section">
          <p className="loom-today-section-label">Recent.</p>
          <ul className="loom-today-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {jots.slice(0, 20).map((j) => (
              <li key={j.id} style={{ marginBottom: '0.6rem' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--serif)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    color: 'var(--fg)',
                  }}
                >
                  {j.text}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--display)',
                    fontSize: '0.72rem',
                    color: 'var(--fg-secondary)',
                    marginTop: '0.15rem',
                    letterSpacing: '0.01em',
                  }}
                >
                  {relativeTime(j.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section label="What you have read today." rows={read} emptyLabel="Nothing yet." onGo={go} />
      <Section label="What you have pinned for later." rows={pinned} emptyLabel="A day is not a to-do list." onGo={go} />

      {/* Actions adapt to state. On a completely quiet day (fresh
          install or nothing read), only "Open a source" makes sense —
          "Return to the warp thread" implies prior work, "Set it down"
          implies something to set down. Showing all three on empty is
          dead chrome. Re-expand once the user has any reading or
          pinned material to warrant the other actions. */}
      <div className="loom-today-actions">
        {isQuiet ? (
          <LiteraryAction
            label="Open your first source"
            icon={<ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
            onClick={() => go('/sources')}
          />
        ) : (
          <>
            <LiteraryAction
              label="Return to the warp thread"
              icon={<ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
              onClick={() => go('/')}
            />
            <LiteraryAction
              label="Open a new book"
              icon={<ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
              onClick={() => go('/sources')}
            />
            <LiteraryAction label="Set it down for today" onClick={() => go('/')} />
          </>
        )}
      </div>
    </Container>
  );
}

function Section({ label, rows, emptyLabel, onGo }: { label: string; rows: Row[]; emptyLabel: string; onGo: (href: string) => void }) {
  return (
    <section className="loom-today-section">
      <p className="loom-today-section-label">{label}</p>
      {rows.length === 0 ? (
        <p className="loom-today-empty">{emptyLabel}</p>
      ) : (
        <ul className="loom-today-list">
          {rows.map((r) => (
            <li key={r.href}>
              <a className="loom-today-item" href={r.href} onClick={(e) => { e.preventDefault(); onGo(r.href); }}>
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LiteraryAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.38rem',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid',
        borderBottomColor: hover ? 'var(--accent)' : 'transparent',
        padding: '0 0 2px 0',
        margin: 0,
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontSize: '1rem',
        lineHeight: 1.4,
        color: hover ? 'var(--accent-text)' : 'var(--fg-secondary)',
        cursor: 'pointer',
        transition: 'color 160ms ease, border-bottom-color 160ms ease',
      }}
    >
      {label}
      {icon}
    </button>
  );
}
