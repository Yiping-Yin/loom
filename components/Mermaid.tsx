'use client';
import { useEffect, useRef, useState } from 'react';
import diagramMap from '../lib/wiki-diagram-map.json';
import { diagramKey } from '../lib/wiki-diagram-key';

/** Pre-rendered hash for this chart, when scripts/prerender-wiki-diagrams.mjs
 * has seen it. Charts not yet in the map (a growing book) fall back to live
 * mermaid rendering below. */
function prerenderedHash(chart: string): string | undefined {
  return (diagramMap as Record<string, string>)[diagramKey(chart)];
}

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const pre = prerenderedHash(chart);
  useEffect(() => {
    if (pre) return; // static SVGs ship with the page — no client mermaid
    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      const isDark = document.documentElement.classList.contains('dark');
      mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default', securityLevel: 'strict' });
      try {
        const id = 'm' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        if (cancelled) return;
        // Silent degrade: show a quiet "couldn't render" state with the source
        // visible as a code block (so the user still sees what they wrote),
        // and the raw error hidden behind a details toggle.
        setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [chart, pre]);

  if (pre) {
    // Build-time static render (light + dark), visibility flipped by the
    // html.dark class — zero hydration dependency in the staged bundle.
    return (
      <div className="wiki-diagram" style={{ margin: '1.2rem 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/wiki-diagrams/${pre}.svg`} alt="diagram" className="wiki-diagram-light" style={{ maxWidth: '100%' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/wiki-diagrams/${pre}.dark.svg`} alt="diagram" className="wiki-diagram-dark" style={{ maxWidth: '100%' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        margin: '1.2rem 0',
        padding: '0.9rem 1rem',
        borderRadius: 'var(--r-2)',
        border: '0.5px dashed var(--mat-border)',
        background: 'var(--surface-2)',
      }}>
        <div style={{
          color: 'var(--muted)',
          fontSize: '0.78rem',
          fontFamily: 'var(--display)',
          marginBottom: 8,
        }}>
          Diagram source couldn&rsquo;t render. Showing raw code below.
        </div>
        <pre style={{
          margin: 0,
          padding: '0.6rem 0.75rem',
          background: 'var(--code-bg)',
          borderRadius: 'var(--r-1)',
          fontSize: '0.78rem',
          fontFamily: 'var(--mono)',
          lineHeight: 1.5,
          color: 'var(--fg-secondary)',
          overflow: 'auto',
        }}>{chart}</pre>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          style={{
            marginTop: 8,
            background: 'transparent', border: 0, cursor: 'pointer',
            color: 'var(--muted)', fontSize: '0.7rem', padding: 0,
            fontFamily: 'var(--mono)', letterSpacing: '0.04em',
          }}
        >
          {showRaw ? '− hide parser error' : '+ show parser error'}
        </button>
        {showRaw && (
          <pre style={{
            marginTop: 6,
            padding: '6px 10px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--r-1)',
            color: 'var(--tint-red)',
            fontSize: '0.7rem',
            fontFamily: 'var(--mono)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>{error}</pre>
        )}
      </div>
    );
  }

  return <div ref={ref} style={{ margin: '1.2rem 0', textAlign: 'center' }} />;
}
