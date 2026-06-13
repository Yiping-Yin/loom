'use client';

/**
 * ConnectionsClient — renders source connections and correspondents
 * from the local trace store. Derivation is pure and tested in
 * lib/new-loom/source-connections; this component only loads, maps,
 * and renders the links.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '../loom-support-page.module.css';
import { LoomSupportNav } from '../LoomSupportNav';
import { useAllTraces, type Trace } from '../../lib/trace';
import {
  browserPublicWorkingStorage,
  isNewLoomPublicWorkingMode,
} from '../../lib/new-loom/public-working-mode';
import {
  deriveNewLoomSourceConnections,
  sourceConnectionDraftHref,
  type NewLoomConnectionSource,
} from '../../lib/new-loom/source-connections';

function originFromHref(href?: string) {
  if (!href || href.startsWith('/')) return 'local';
  try {
    return new URL(href).host || 'local';
  } catch {
    return 'local';
  }
}

function correspondentFromDocId(docId: string) {
  const [head] = docId.split('/');
  const name = head?.trim();
  return name ? name.replace(/[-_]+/g, ' ') : undefined;
}

function connectionSourcesFromTraces(traces: readonly Trace[]): NewLoomConnectionSource[] {
  const byDoc = new Map<string, NewLoomConnectionSource>();
  for (const trace of traces) {
    const docId = trace.source?.docId;
    if (!docId || byDoc.has(docId)) continue;
    const href = trace.source?.href;
    byDoc.set(docId, {
      id: docId,
      title: trace.source?.sourceTitle?.trim() || trace.title?.trim() || docId,
      origin: originFromHref(href),
      href,
      correspondent: correspondentFromDocId(docId),
    });
  }
  return [...byDoc.values()];
}

export default function ConnectionsClient() {
  const { traces } = useAllTraces();
  const [publicWorkingMode, setPublicWorkingMode] = useState(false);

  useEffect(() => {
    setPublicWorkingMode(
      isNewLoomPublicWorkingMode(window.location.search, browserPublicWorkingStorage()),
    );
  }, []);

  const connectionMap = useMemo(
    () => deriveNewLoomSourceConnections(connectionSourcesFromTraces(traces)),
    [traces],
  );

  return (
    <div className={styles.surface}>
      <LoomSupportNav active="/connections" />
      <main
        className={styles.main}
        style={{ padding: 'var(--support-main-padding)' }}
      >
        <article className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>Connections / Correspondents</div>
            <h1 className={styles.title}>Where sources meet.</h1>
            <p className={styles.lead}>
              Every source came from someone or somewhere. Two sources that share a
              correspondent are connected; cross-origin links — a web capture meeting a local
              file — are shown first. Material comes in through{' '}
              <Link href="/sources" className={styles.textLink}>Sources</Link> and a
              connection worth keeping continues in{' '}
              <Link href="/draft" className={styles.textLink}>Draft</Link>.
            </p>
          </div>
          <div className={styles.heroPanel} aria-hidden="true">
            <div className={styles.instrument}>
              <div className={styles.instrumentKicker}>Source relation map</div>
              <div className={styles.instrumentValue}>
                {connectionMap.connections.length.toString().padStart(2, '0')}
              </div>
              <div className={styles.instrumentMeta}>
                Shared correspondents and cross-origin pairs stay visible as quiet relation
                lines, not a social feed.
              </div>
            </div>
          </div>
        </header>

        <section className={styles.sectionCard} aria-label="Correspondents">
          <h2 className={styles.sectionHeading}>Correspondents</h2>
          {connectionMap.correspondents.length === 0 ? (
            <p className={styles.muted} style={{ margin: 0 }}>
              No correspondents yet. As sources accumulate, the people and places they came
              from appear here.
            </p>
          ) : (
            <ul className={styles.plainList}>
              {connectionMap.correspondents.map((correspondent) => (
                <li
                  key={correspondent.name}
                  className={styles.row}
                >
                  <strong>{correspondent.name}</strong>
                  <span className={styles.supportNote}>
                    {correspondent.sources.length} source
                    {correspondent.sources.length === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.sectionCard} aria-label="Cross-origin connections" style={{ marginTop: '1.2rem' }}>
          <h2 className={styles.sectionHeading}>Connections, cross-origin first</h2>
          {connectionMap.connections.length === 0 ? (
            <p className={styles.muted} style={{ margin: 0 }}>
              No connections yet. When two sources share a correspondent, the link shows up
              here — cross-origin pairs first.
            </p>
          ) : (
            <ul className={styles.plainList}>
              {[
                ...connectionMap.crossOriginConnections,
                ...connectionMap.connections.filter((link) => !link.crossOrigin),
              ].map((link) => (
                <li key={link.id} className={styles.thinCard}>
                  <div style={{ fontSize: '0.92rem', marginBottom: 2 }}>
                    {link.from.title} ↔ {link.to.title}
                  </div>
                  <div
                    className={styles.row}
                    style={{ color: 'var(--muted)', fontSize: '0.8rem' }}
                  >
                    <span>
                      via {link.via} · {link.from.origin} ↔ {link.to.origin}
                      {link.crossOrigin ? ' · cross-origin' : ''}
                    </span>
                    {!publicWorkingMode && (
                      <Link
                        href={sourceConnectionDraftHref(link)}
                        className={styles.textLink}
                      >
                        Draft this connection
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </article>
      </main>
    </div>
  );
}
