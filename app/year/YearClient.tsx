'use client';

/**
 * YearClient — hydrates The Year with real material: traces from the
 * local store, question records, and native captures (web + local
 * files) from the bundle bridge. Pure derivation lives in
 * lib/new-loom/year-surface; this component only loads and renders.
 */

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import styles from '../loom-support-page.module.css';
import { useAllTraces } from '../../lib/trace';
import { loadPursuitRecords, type LoomPursuitRecord } from '../../lib/loom-pursuit-records';
import {
  browserPublicWorkingStorage,
  isNewLoomPublicWorkingMode,
} from '../../lib/new-loom/public-working-mode';
import {
  buildNewLoomYearOverview,
  publicWorkingYearOverview,
  yearItemDraftHref,
  yearItemsFromCaptureEntries,
  yearItemsFromQuestionRecords,
  yearItemsFromTraces,
  type NewLoomYearCaptureEntryLike,
  type NewLoomYearItem,
} from '../../lib/new-loom/year-surface';

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

export function YearClient() {
  const { traces } = useAllTraces();
  const [questionRecords, setQuestionRecords] = useState<LoomPursuitRecord[]>([]);
  const [captureItems, setCaptureItems] = useState<NewLoomYearItem[]>([]);
  const [publicWorkingMode, setPublicWorkingMode] = useState(false);

  useEffect(() => {
    setPublicWorkingMode(
      isNewLoomPublicWorkingMode(window.location.search, browserPublicWorkingStorage()),
    );
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

  const overview = useMemo(() => {
    const built = buildNewLoomYearOverview([
      ...yearItemsFromTraces(traces),
      ...yearItemsFromQuestionRecords(questionRecords),
      ...captureItems,
    ]);
    return publicWorkingMode ? publicWorkingYearOverview(built) : built;
  }, [traces, questionRecords, captureItems, publicWorkingMode]);

  const maxWeight = Math.max(1, ...overview.months.map((column) => column.weight));

  return (
    <div className={styles.sectionGrid}>
      <section className={styles.sectionCard} aria-label="The Year material by month">
        <div className={styles.yearChart}>
          {overview.months.map((column) => (
            <div
              key={column.month}
              className={styles.monthColumn}
            >
              <div
                className={`${styles.monthBar} ${column.weight === 0 ? styles.monthBarEmpty : ''}`}
                title={`${column.month} ${overview.year} · weight ${column.weight}`}
                style={{
                  height: Math.round((column.weight / maxWeight) * 96) + 4,
                } as CSSProperties}
              />
              <span className={styles.monthLabel}>
                {column.month}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.yearCaption}>
          Twelve months of {overview.year}, by weight. Sources and Draft work both count;
          heavier columns mean heavier thinking, not more clicks.
        </p>
      </section>

      <section className={styles.sectionCard} aria-label="The Year wintering buckets">
        <h2 className={styles.sectionHeading}>The wintering ribbon</h2>
        <div className={styles.sectionGrid}>
          {(
            [
              { key: 'active', label: 'Active', note: 'touched recently' },
              { key: 'wintering', label: 'Wintering', note: 'cooling — kept, not deleted' },
              { key: 'archived', label: 'Archived', note: 'settled until the next return' },
            ] as const
          ).map((bucket) => {
            const items = overview.ribbon[bucket.key];
            return (
              <div key={bucket.key} className={styles.thinCard}>
                <div className={styles.bucketHeader}>
                  <strong className={styles.bucketTitle}>{bucket.label}</strong>
                  <span className={styles.supportNote}>
                    {items.length} · {bucket.note}
                  </span>
                </div>
                <ul className={`${styles.plainList} ${styles.bucketList}`}>
                  {items.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className={styles.row}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      {!publicWorkingMode && (
                        <Link
                          href={yearItemDraftHref(item)}
                          className={styles.textLink}
                        >
                          Draft this item
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.sectionCard} aria-label="The Year question containers">
        <h2 className={styles.sectionHeading}>Question containers</h2>
        {overview.questionContainers.length === 0 ? (
          <p className={styles.emptyCopy}>
            No open questions gathered material this year. Hold a question while reading in
            Sources and it will appear here.
          </p>
        ) : (
          <ul className={styles.plainList}>
            {overview.questionContainers.map((container) => (
              <li key={container.id} className={styles.thinCard}>
                <div className={styles.questionTitle}>{container.question}</div>
                <div className={styles.supportNote}>
                  {container.items.length} linked item{container.items.length === 1 ? '' : 's'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
