'use client';

/**
 * ConnectionsClient — renders source connections and correspondents
 * from the local trace store. Derivation is pure and tested in
 * lib/new-loom/source-connections; this component only loads, maps,
 * and renders the links.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
      <article style={{ width: '100%', maxWidth: '44rem' }}>
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
            Connections / Correspondents
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Where sources meet.
          </h1>
          <p style={{ color: 'var(--fg-secondary)', lineHeight: 1.65, marginTop: '0.8rem' }}>
            Every source came from someone or somewhere. Two sources that share a
            correspondent are connected; cross-origin links — a web capture meeting a local
            file — are shown first. Material comes in through{' '}
            <Link href="/sources" style={{ color: 'var(--accent)' }}>Sources</Link> and a
            connection worth keeping continues in{' '}
            <Link href="/draft" style={{ color: 'var(--accent)' }}>Draft</Link>.
          </p>
        </header>

        <section aria-label="Correspondents" style={{ marginBottom: '2.2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.7rem',
            }}
          >
            Correspondents
          </h2>
          {connectionMap.correspondents.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              No correspondents yet. As sources accumulate, the people and places they came
              from appear here.
            </p>
          ) : (
            <ul
              style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}
            >
              {connectionMap.correspondents.map((correspondent) => (
                <li
                  key={correspondent.name}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: '0.9rem' }}
                >
                  <strong>{correspondent.name}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                    {correspondent.sources.length} source
                    {correspondent.sources.length === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Cross-origin connections">
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.7rem',
            }}
          >
            Connections, cross-origin first
          </h2>
          {connectionMap.connections.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              No connections yet. When two sources share a correspondent, the link shows up
              here — cross-origin pairs first.
            </p>
          ) : (
            <ul
              style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}
            >
              {[
                ...connectionMap.crossOriginConnections,
                ...connectionMap.connections.filter((link) => !link.crossOrigin),
              ].map((link) => (
                <li
                  key={link.id}
                  style={{
                    border: 'var(--hairline)',
                    borderRadius: 8,
                    padding: '0.7rem 1rem',
                    background: 'color-mix(in srgb, var(--fg) 2%, var(--bg))',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', marginBottom: 2 }}>
                    {link.from.title} ↔ {link.to.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      color: 'var(--muted)',
                      fontSize: '0.8rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      via {link.via} · {link.from.origin} ↔ {link.to.origin}
                      {link.crossOrigin ? ' · cross-origin' : ''}
                    </span>
                    {!publicWorkingMode && (
                      <Link
                        href={sourceConnectionDraftHref(link)}
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
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
  );
}
