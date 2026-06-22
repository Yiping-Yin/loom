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
import styles from '../loom-support-page.module.css';
import { LoomSupportNav } from '../LoomSupportNav';
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

function canReadNativeCaptureBridge() {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') return false;
  return true;
}

async function loadNativeCaptureItems(): Promise<NewLoomYearItem[]> {
  if (!canReadNativeCaptureBridge()) return [];

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
    <div className={styles.surface}>
      <LoomSupportNav active="/hour" />
      <main className={styles.main}>
        <article className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>The Hour</div>
            <h1 className={styles.title}>Current hour, ticking.</h1>
            <p className={styles.lead}>
              A live thinking window: time stays visible, the minute breathes, and recent
              material gathers without demanding attention.
            </p>
          </div>
          <section className={styles.heroPanel} aria-label="Live watch">
            <div className={styles.instrument}>
              <div className={styles.instrumentKicker}>Live watch</div>
              <div className={styles.instrumentValue}>
                {now
                  ? now.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '--:--:--'}
              </div>
              <div
                className={styles.breathBar}
                role="progressbar"
                aria-label="Breath bar — minute progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(minuteProgress)}
              >
                <div
                  className={styles.breathFill}
                  style={{
                    width: `${minuteProgress.toFixed(1)}%`,
                  }}
                />
              </div>
              <div className={styles.instrumentMeta}>
                {minuteProgress.toFixed(1)}% of this minute is gone. No alerts, no badges; the
                page just breathes with the clock.
              </div>
            </div>
          </section>
        </header>

        <section className={styles.sectionCard} aria-label="Material in the current hour">
          <h2 className={styles.sectionHeading}>What this hour holds</h2>
          {currentItems.length === 0 ? (
            <p className={styles.emptyCopy}>
              Nothing touched yet. Read something in Sources or write in Draft and it will
              appear here.
            </p>
          ) : (
            <ul className={styles.plainList}>
              {currentItems.map((item) => (
                <li
                  key={item.id}
                  className={styles.row}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  {!publicWorkingMode && (
                    <Link
                      href={hourItemDraftHref(item)}
                      className={styles.textLink}
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
          className={styles.linkRail}
        >
          <Link href="/sources">Sources</Link>
          <Link href="/digital-me?edit=new">Draft</Link>
          <Link href="/year">The Year</Link>
          <Link href="/connections">Connections</Link>
          <Link href="/discipline">Discipline</Link>
        </nav>
        </article>
      </main>
    </div>
  );
}
