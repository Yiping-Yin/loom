'use client';

/**
 * HourClient — "live watch, live page, breath bar".
 *
 * The current thinking window: a ticking clock, the minute's progress
 * rendered as a slow breath bar, and the material touched inside this
 * hour. The clock starts null and is set after mount so the server
 * and client never disagree about the time.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAllTraces } from '../../lib/trace';
import { loadPursuitRecords, type LoomPursuitRecord } from '../../lib/loom-pursuit-records';
import {
  browserPublicWorkingStorage,
  isNewLoomPublicWorkingMode,
} from '../../lib/new-loom/public-working-mode';
import {
  buildNewLoomYearOverview,
  currentHourItemsFromYearOverview,
  hourItemDraftHref,
  publicWorkingYearOverview,
  yearItemsFromCaptureEntries,
  yearItemsFromQuestionRecords,
  yearItemsFromTraces,
  type NewLoomYearCaptureEntryLike,
  type NewLoomYearItem,
} from '../../lib/new-loom/year-surface';

function currentDate() {
  return new Date();
}

async function loadNativeCaptureItems(): Promise<NewLoomYearItem[]> {
  try {
    const response = await fetch('loom://native/captures-list.json');
    if (!response.ok) return [];
    const payload = await response.json();
    const entries: NewLoomYearCaptureEntryLike[] = Array.isArray(payload?.entries)
      ? payload.entries
      : [];
    return yearItemsFromCaptureEntries(entries);
  } catch {
    return [];
  }
}

export default function HourClient() {
  const { traces } = useAllTraces();
  const [questionRecords, setQuestionRecords] = useState<LoomPursuitRecord[]>([]);
  const [captureItems, setCaptureItems] = useState<NewLoomYearItem[]>([]);
  const [publicWorkingMode, setPublicWorkingMode] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setPublicWorkingMode(
      isNewLoomPublicWorkingMode(window.location.search, browserPublicWorkingStorage()),
    );
  }, []);

  useEffect(() => {
    setNow(currentDate());
    const tick = window.setInterval(() => setNow(currentDate()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadPursuitRecords().then((records) => {
      if (!cancelled) setQuestionRecords(records);
    });
    void loadNativeCaptureItems().then((items) => {
      if (!cancelled) setCaptureItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentItems = useMemo(() => {
    const built = buildNewLoomYearOverview([
      ...yearItemsFromTraces(traces),
      ...yearItemsFromQuestionRecords(questionRecords),
      ...captureItems,
    ]);
    const overview = publicWorkingMode ? publicWorkingYearOverview(built) : built;
    return currentHourItemsFromYearOverview(overview);
  }, [traces, questionRecords, captureItems, publicWorkingMode]);

  const minuteProgress = now
    ? ((now.getSeconds() * 1000 + now.getMilliseconds()) / 60_000) * 100
    : 0;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 5vw, 4rem)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <article style={{ width: '100%', maxWidth: '40rem' }}>
        <header style={{ marginBottom: '2.2rem' }}>
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.6rem',
            }}
          >
            The Hour
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Current hour, ticking.
          </h1>
        </header>

        <section aria-label="Live watch" style={{ marginBottom: '2.2rem' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'clamp(2.2rem, 6vw, 3rem)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {now
              ? now.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '--:--:--'}
          </div>
          <div
            role="progressbar"
            aria-label="Breath bar — minute progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(minuteProgress)}
            style={{
              marginTop: '0.9rem',
              height: 4,
              borderRadius: 2,
              background: 'color-mix(in srgb, var(--fg) 8%, var(--bg))',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${minuteProgress.toFixed(1)}%`,
                height: '100%',
                background: 'color-mix(in srgb, var(--accent) 70%, var(--bg))',
                transition: 'width 1s linear',
              }}
            />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.6rem' }}>
            The breath bar fills once a minute — {minuteProgress.toFixed(1)}% of this minute is
            gone. No alerts, no badges; the page just breathes with the clock.
          </p>
        </section>

        <section aria-label="Material in the current hour" style={{ marginBottom: '2.2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.7rem',
            }}
          >
            What this hour holds
          </h2>
          {currentItems.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              Nothing touched yet. Read something in Sources or write in Draft and it will
              appear here.
            </p>
          ) : (
            <ul
              style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}
            >
              {currentItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    fontSize: '0.9rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--fg-secondary)' }}>{item.title}</span>
                  {!publicWorkingMode && (
                    <Link
                      href={hourItemDraftHref(item)}
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      Draft this current item
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <nav
          aria-label="The Hour related surfaces"
          style={{ display: 'flex', gap: 16, fontSize: '0.88rem', flexWrap: 'wrap' }}
        >
          <Link href="/sources" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sources
          </Link>
          <Link href="/draft" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Draft
          </Link>
          <Link href="/year" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            The Year
          </Link>
          <Link href="/connections" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Connections
          </Link>
          <Link href="/discipline" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Discipline
          </Link>
        </nav>
      </article>
    </main>
  );
}
