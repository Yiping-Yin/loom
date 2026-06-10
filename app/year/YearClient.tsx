'use client';

/**
 * YearClient — hydrates The Year with real material: traces from the
 * local store, question records, and native captures (web + local
 * files) from the bundle bridge. Pure derivation lives in
 * lib/new-loom/year-surface; this component only loads and renders.
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
  publicWorkingYearOverview,
  yearItemDraftHref,
  yearItemsFromCaptureEntries,
  yearItemsFromQuestionRecords,
  yearItemsFromTraces,
  type NewLoomYearCaptureEntryLike,
  type NewLoomYearItem,
} from '../../lib/new-loom/year-surface';

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
    <div style={{ display: 'grid', gap: '2.2rem' }}>
      <section aria-label="The Year material by month">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            gap: 6,
            alignItems: 'end',
            minHeight: 120,
          }}
        >
          {overview.months.map((column) => (
            <div
              key={column.month}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div
                title={`${column.month} ${overview.year} · weight ${column.weight}`}
                style={{
                  width: '100%',
                  height: Math.round((column.weight / maxWeight) * 96) + 4,
                  borderRadius: 3,
                  background:
                    column.weight > 0
                      ? 'color-mix(in srgb, var(--accent) 55%, var(--bg))'
                      : 'color-mix(in srgb, var(--fg) 8%, var(--bg))',
                }}
              />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--muted)' }}>
                {column.month}
              </span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.6rem' }}>
          Twelve months of {overview.year}, by weight. Sources and Draft work both count;
          heavier columns mean heavier thinking, not more clicks.
        </p>
      </section>

      <section aria-label="The Year wintering buckets">
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1.15rem',
            fontWeight: 600,
            marginBottom: '0.7rem',
          }}
        >
          The wintering ribbon
        </h2>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {(
            [
              { key: 'active', label: 'Active', note: 'touched recently' },
              { key: 'wintering', label: 'Wintering', note: 'cooling — kept, not deleted' },
              { key: 'archived', label: 'Archived', note: 'settled until the next return' },
            ] as const
          ).map((bucket) => {
            const items = overview.ribbon[bucket.key];
            return (
              <div key={bucket.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <strong style={{ fontSize: '0.92rem' }}>{bucket.label}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                    {items.length} · {bucket.note}
                  </span>
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '0.4rem 0 0',
                    padding: 0,
                    display: 'grid',
                    gap: '0.3rem',
                  }}
                >
                  {items.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                        fontSize: '0.88rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'var(--fg-secondary)' }}>{item.title}</span>
                      {!publicWorkingMode && (
                        <Link
                          href={yearItemDraftHref(item)}
                          style={{ color: 'var(--accent)', textDecoration: 'none' }}
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

      <section aria-label="The Year question containers">
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1.15rem',
            fontWeight: 600,
            marginBottom: '0.7rem',
          }}
        >
          Question containers
        </h2>
        {overview.questionContainers.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            No open questions gathered material this year. Hold a question while reading in
            Sources and it will appear here.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
            {overview.questionContainers.map((container) => (
              <li
                key={container.id}
                style={{
                  border: 'var(--hairline)',
                  borderRadius: 8,
                  padding: '0.7rem 1rem',
                  background: 'color-mix(in srgb, var(--fg) 2%, var(--bg))',
                }}
              >
                <div style={{ fontSize: '0.92rem', marginBottom: 2 }}>{container.question}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
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
