'use client';
/**
 * /quizzes — every quiz attempt, by source.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { isWeak, useQuizResults } from '../../lib/use-quiz';
import { fetchSearchIndex } from '../../lib/search-index-client';
import styles from './QuizzesPage.module.css';

type IndexDoc = { id: string; title: string; href: string; category: string };

const CHECK_DATE_FORMATTER = new Intl.DateTimeFormat('en-AU', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

let _idxCache: IndexDoc[] | null = null;
async function loadDocs(): Promise<IndexDoc[]> {
  if (_idxCache) return _idxCache;
  try {
    const r = await fetchSearchIndex();
    if (!r.ok) return [];
    const payload = await r.json();
    const stored = payload.index?.storedFields ?? {};
    const docIds = payload.index?.documentIds ?? {};
    const out: IndexDoc[] = [];
    for (const [internal, fields] of Object.entries<any>(stored)) {
      if (!fields?.href || !fields?.title) continue;
      out.push({
        id: String(docIds[internal] ?? internal),
        title: fields.title,
        href: fields.href,
        category: fields.category ?? '',
      });
    }
    _idxCache = out;
    return out;
  } catch { return []; }
}

function prettifyId(id: string): string {
  return id.replace(/^wiki\//, '').replace(/^.*__/, '').replace(/-/g, ' ');
}

function formatPercent(score: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((score / total) * 100)}%`;
}

function formatAttemptedAt(attemptedAt: number): string {
  try {
    return CHECK_DATE_FORMATTER.format(new Date(attemptedAt));
  } catch {
    return 'recently';
  }
}

export default function QuizzesClient() {
  const [results] = useQuizResults();
  const [docs, setDocs] = useState<IndexDoc[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); loadDocs().then(setDocs); }, []);

  const docsById = useMemo(() => {
    const m = new Map<string, IndexDoc>();
    for (const d of docs) m.set(d.id, d);
    return m;
  }, [docs]);

  const items = useMemo(() => {
    return [...results]
      .sort((a, b) => b.attemptedAt - a.attemptedAt)
      .map((r) => {
        const wiki = docsById.get(r.docId);
        const know = docsById.get(`know/${r.docId}`);
        const meta = wiki ?? know ?? null;
        const title = meta?.title ?? prettifyId(r.docId);
        return {
          key: r.docId + r.attemptedAt,
          docId: meta?.id ?? (wiki ? r.docId : `know/${r.docId}`),
          title,
          href: meta?.href ?? `/sources?search=${encodeURIComponent(title)}`,
          score: r.score,
          total: r.total,
          weak: isWeak(r),
          attemptedAt: r.attemptedAt,
        };
      });
  }, [results, docsById]);

  const stats = useMemo(() => {
    const scoreTotal = results.reduce((sum, result) => sum + result.score, 0);
    const pointTotal = results.reduce((sum, result) => sum + result.total, 0);
    const weakTotal = results.filter(isWeak).length;

    return {
      attempts: results.length,
      weakTotal,
      accuracy: formatPercent(scoreTotal, pointTotal),
    };
  }, [results]);

  return (
    <>
      <LoomGlobalNav activeHref="/sources" ariaLabel="Source checks navigation" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>Source checks</p>
            <h1 className={styles.title}>Source checks.</h1>
            <p className={styles.lead}>
              Review every check taken from source chapters. Weak scores stay visible so
              the next reading session starts in the right place.
            </p>
          </header>

          <section className={styles.statRail} aria-label="Source check summary">
            <div className={styles.stat}>
              <span className={styles.statValue}>{mounted ? stats.attempts : '—'}</span>
              <span className={styles.statLabel}>Attempts</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{mounted ? stats.weakTotal : '—'}</span>
              <span className={styles.statLabel}>Needs review</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{mounted ? stats.accuracy : '—'}</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
          </section>

          <section className={styles.panel} aria-label="Past source checks">
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Past checks</h2>
              <span className={styles.panelMeta}>Newest first</span>
            </div>

            {!mounted ? null : items.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyOrb} aria-hidden="true">
                  <CheckCircle2 size={22} strokeWidth={1.55} />
                </div>
                <div>
                  <h3 className={styles.emptyTitle}>No checks yet.</h3>
                  <p className={styles.emptyCopy}>
                    Open a source chapter, read the material, then take its check. Results
                    will appear here without turning this page into a separate workspace.
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link className={styles.primaryAction} href="/sources">
                    Open Sources
                    <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
                  </Link>
                  <Link className={styles.secondaryAction} href="/llm-wiki">
                    Open built-in references
                    <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
                  </Link>
                </div>
              </div>
            ) : (
              <ul className={styles.list}>
                {items.map((it) => {
                  const Icon = it.weak ? CircleAlert : CheckCircle2;

                  return (
                    <li key={it.key}>
                      <Link className={styles.rowLink} href={it.href}>
                        <span className={styles.rowMain}>
                          <span className={styles.rowTitle}>{it.title}</span>
                          <span className={styles.rowMeta}>{formatAttemptedAt(it.attemptedAt)}</span>
                        </span>
                        <span
                          className={`${styles.score} ${it.weak ? styles.scoreWeak : styles.scoreStrong}`}
                        >
                          <Icon aria-hidden="true" size={15} strokeWidth={1.75} />
                          {it.score}/{it.total}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
