'use client';

// Loom Workbench — the app's main surface.
// Soul: a lab notebook. Skeleton: an IDE. Center: the manuscript.
// Fed by the typed native snapshot (loom://) inside the app; demo data in a
// stock browser. QBook-style practice grounds mount later as kind-aware tabs.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from './workbench.module.css';
import {
  bookOrder,
  deriveEntries,
  filterPalette,
  heartbeat,
  manuscriptAt,
  openPositions,
  pageGaps,
  paletteIndex,
  passBoundaries,
  type ManuscriptEntry,
  type PaletteItem,
} from './workbenchModel';
import {
  fetchNativeReflectionSnapshot,
  type NativeReflectionCase,
  type NativeTraceRecord,
} from '../reflection/nativeReflectionSnapshot';
import { DEMO_WORKBENCH_CASES } from './workbenchDemo';

type TabKind = 'manuscript' | 'practice';

type WorkbenchTab = {
  kind: TabKind;
  caseID: string;
};

type CommitFocus = 'meaning' | 'question' | 'correction' | 'principle';

type StageKey = 'thick' | 'thin' | 'weave' | 'bind' | 'practice';

const STAGES: Array<{ key: StageKey; glyph: string; label: string }> = [
  { key: 'thick', glyph: '📖', label: '读厚' },
  { key: 'thin', glyph: '✂️', label: '读薄' },
  { key: 'weave', glyph: '🧵', label: '融会' },
  { key: 'bind', glyph: '📕', label: '装订' },
  { key: 'practice', glyph: '⚔️', label: '实战' },
];

const STAGE_KINDS: Partial<Record<StageKey, ManuscriptEntry['kind'][]>> = {
  thick: ['capture'],
  thin: ['meaning', 'correction', 'question'],
  weave: ['principle'],
};

type WorkbenchBridges = {
  commit?: { postMessage: (payload: unknown) => void };
  reveal?: { postMessage: (payload: unknown) => void };
  exportRecord?: { postMessage: (payload: unknown) => void };
};

function bridges(): WorkbenchBridges {
  const handlers = (window as unknown as {
    webkit?: { messageHandlers?: Record<string, { postMessage: (payload: unknown) => void }> };
  }).webkit?.messageHandlers;
  return {
    commit: handlers?.loomWorkbenchCommit,
    reveal: handlers?.loomWorkbenchReveal,
    exportRecord: handlers?.loomWorkbenchExport,
  };
}

function focusForText(text: string, fallback: CommitFocus): CommitFocus {
  if (text.endsWith('?') || text.endsWith('？')) return 'question';
  const lowered = text.toLowerCase();
  if (lowered.startsWith('principle:')) return 'principle';
  if (lowered.startsWith('correction:')) return 'correction';
  if (lowered.startsWith('question:')) return 'question';
  return fallback;
}

export default function WorkbenchClient() {
  const [cases, setCases] = useState<NativeReflectionCase[]>(DEMO_WORKBENCH_CASES);
  const [isMirror, setIsMirror] = useState(false);
  const [selectedCaseID, setSelectedCaseID] = useState<string>(DEMO_WORKBENCH_CASES[0]!.id);
  const [tabs, setTabs] = useState<WorkbenchTab[]>([{ kind: 'manuscript', caseID: DEMO_WORKBENCH_CASES[0]!.id }]);
  const [stage, setStage] = useState<StageKey | null>(null);
  const [recall, setRecall] = useState(false);
  const [timeTravel, setTimeTravel] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteActive, setPaletteActive] = useState(0);
  const [composerFocus, setComposerFocus] = useState<CommitFocus>('meaning');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Local workbench');
  const [caughtID, setCaughtID] = useState<string | null>(null);
  const [panelsOpen, setPanelsOpen] = useState<Record<string, boolean>>({ outline: true, timeline: false, principles: false });
  const knownRecordIDs = useRef<Set<string>>(new Set());

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseID) ?? cases[0] ?? null,
    [cases, selectedCaseID],
  );

  const refresh = useCallback(async (announceCatch: boolean) => {
    const snapshot = await fetchNativeReflectionSnapshot();
    if (!snapshot) return;
    setIsMirror(true);
    setCases(snapshot.cases);
    if (announceCatch) {
      // The catch: a record we have never seen means ⌘⇧U just filed
      // something into the book — flash it into place.
      for (const nativeCase of snapshot.cases) {
        for (const record of nativeCase.traceRecords ?? []) {
          if (!knownRecordIDs.current.has(record.id)) {
            setCaughtID(record.id);
            setSelectedCaseID(nativeCase.id);
            setTabs((current) =>
              current.some((tab) => tab.caseID === nativeCase.id)
                ? current
                : [...current, { kind: 'manuscript', caseID: nativeCase.id }],
            );
            setStatus('Caught — filed into the book');
          }
        }
      }
    }
    const ids = new Set<string>();
    for (const nativeCase of snapshot.cases) {
      for (const record of nativeCase.traceRecords ?? []) ids.add(record.id);
    }
    knownRecordIDs.current = ids;
    setSelectedCaseID((current) =>
      snapshot.cases.some((item) => item.id === current) ? current : snapshot.selectedCaseID);
  }, []);

  useEffect(() => {
    void refresh(false);
    const onWake = () => void refresh(true);
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    const poll = window.setInterval(onWake, 8000);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
      window.clearInterval(poll);
    };
  }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setPaletteOpen(true);
        setPaletteQuery('');
        setPaletteActive(0);
      }
      if (event.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const allEntries = useMemo(
    () => (selectedCase ? deriveEntries(selectedCase) : []),
    [selectedCase],
  );
  const boundaries = useMemo(() => passBoundaries(allEntries), [allEntries]);
  const travelled = useMemo(
    () => (timeTravel === null ? allEntries : manuscriptAt(allEntries, timeTravel)),
    [allEntries, timeTravel],
  );
  const visibleEntries = useMemo(() => {
    const ordered = bookOrder(travelled);
    const kinds = stage ? STAGE_KINDS[stage] : undefined;
    return kinds ? ordered.filter((entry) => kinds.includes(entry.kind)) : ordered;
  }, [travelled, stage]);
  const gaps = useMemo(() => pageGaps(travelled), [travelled]);
  const positions = useMemo(() => openPositions(travelled), [travelled]);
  const pulse = useMemo(() => heartbeat(cases), [cases]);
  const palette = useMemo(() => paletteIndex(cases), [cases]);
  const paletteResults = useMemo(
    () => filterPalette(palette, paletteQuery),
    [palette, paletteQuery],
  );

  const anchoredPrecision = useMemo(() => {
    const anchored = travelled.filter((entry) => entry.page !== null).length;
    if (travelled.length === 0) return 'no traces yet';
    if (anchored === 0) return 'anchors: pending';
    return `anchors: ${anchored}/${travelled.length} page-precise`;
  }, [travelled]);

  const openProject = useCallback((caseID: string) => {
    setSelectedCaseID(caseID);
    setTimeTravel(null);
    setStage(null);
    setTabs((current) =>
      current.some((tab) => tab.caseID === caseID) ? current : [...current, { kind: 'manuscript', caseID }],
    );
  }, []);

  const closeTab = useCallback((caseID: string) => {
    setTabs((current) => {
      const next = current.filter((tab) => tab.caseID !== caseID);
      if (caseID === selectedCaseID && next.length > 0) setSelectedCaseID(next[next.length - 1]!.caseID);
      return next.length > 0 ? next : current;
    });
  }, [selectedCaseID]);

  const revealPage = useCallback((entry: ManuscriptEntry) => {
    const bridge = bridges().reveal;
    if (bridge && selectedCase) {
      bridge.postMessage({ caseID: selectedCase.id, sourceAnchor: entry.sourceAnchor, page: entry.page });
      setStatus(`Opening the original at p.${entry.page ?? '?'}…`);
    } else {
      setStatus('Page reveal works inside the Loom app');
    }
  }, [selectedCase]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || !selectedCase) return;
    const focus = focusForText(text, composerFocus);
    const bridge = bridges().commit;
    if (bridge) {
      bridge.postMessage({ caseID: selectedCase.id, text, focus });
      setStatus('Committed — filing into the book');
      window.setTimeout(() => void refresh(true), 450);
    } else {
      // Browser demo: optimistic local record so the manuscript stays alive.
      const record: NativeTraceRecord = {
        schemaVersion: 1,
        id: `local-${Math.random().toString(36).slice(2)}`,
        kind: 'captured',
        traceType: 'user trace',
        sourceAnchor: selectedCase.sources[0]?.label ?? selectedCase.title,
        focus: focus === 'meaning' ? 'user meaning' : focus,
        text,
        evidence: [],
        legacyItem: `Captured user trace from ${selectedCase.sources[0]?.label ?? selectedCase.title} [${focus === 'meaning' ? 'user meaning' : focus}]: ${text}`,
      };
      setCases((current) =>
        current.map((item) =>
          item.id === selectedCase.id
            ? { ...item, traceRecords: [...(item.traceRecords ?? []), record] }
            : item,
        ),
      );
      setCaughtID(record.id);
      setStatus('Committed (demo store)');
    }
    setDraft('');
    setComposerFocus('meaning');
  }, [draft, selectedCase, composerFocus, refresh]);

  const exportRecord = useCallback(() => {
    const bridge = bridges().exportRecord;
    if (bridge && selectedCase) {
      bridge.postMessage({ caseID: selectedCase.id });
      setStatus('Binding the Learning Record…');
    } else {
      setStatus('Binding (⌘⇧E) works inside the Loom app');
    }
  }, [selectedCase]);

  const runPaletteItem = useCallback((item: PaletteItem) => {
    setPaletteOpen(false);
    openProject(item.caseID);
    if (item.type === 'page' && item.page != null) {
      const entry = deriveEntries(cases.find((c) => c.id === item.caseID) ?? cases[0]!)
        .find((candidate) => candidate.id === item.entryID);
      if (entry) revealPage(entry);
    } else if (item.entryID) {
      setCaughtID(item.entryID);
      window.setTimeout(() => {
        document.getElementById(`wb-entry-${item.entryID}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  }, [cases, openProject, revealPage]);

  const provenanceLine = useMemo(() => {
    if (!selectedCase) return '';
    const sources = Math.max(selectedCase.sources.length, 1);
    const anchored = travelled.filter((entry) => entry.page !== null).length;
    const review = travelled.filter((entry) => ['question', 'correction', 'principle'].includes(entry.kind)).length;
    const parts = [
      `${sources} source${sources === 1 ? '' : 's'}`,
      `${travelled.length} anchored trace${travelled.length === 1 ? '' : 's'}`,
      anchored > 0 ? `${anchored} page-anchored` : 'page anchors pending',
    ];
    if (review > 0) parts.push(`${review} review entr${review === 1 ? 'y' : 'ies'}`);
    parts.push(`updated ${selectedCase.updatedAt}`);
    return parts.join(' · ');
  }, [selectedCase, travelled]);

  const scopeLine = useMemo(() => {
    const pages = travelled.map((entry) => entry.page).filter((page): page is number => page !== null);
    if (pages.length === 0 || !selectedCase) return null;
    const low = Math.min(...pages);
    const high = Math.max(...pages);
    const span = low === high ? `p.${low}` : `p.${low}–p.${high}`;
    return `Covers ${span} of ${selectedCase.sources[0]?.label ?? selectedCase.title}. Claims stay within the captured material.`;
  }, [travelled, selectedCase]);

  const composerPlaceholder = useMemo(() => {
    switch (composerFocus) {
      case 'question': return "What's unclear? Add “closes when: …” to set the open condition";
      case 'correction': return 'What did you get wrong — and what is right now?';
      case 'principle': return 'What holds beyond this file?';
      default: return 'Add your meaning…';
    }
  }, [composerFocus]);

  if (!selectedCase) {
    return (
      <div className={styles.shell}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>No projects yet</div>
          <div>Capture from any file with ⌘⇧U to start a learning project.</div>
        </div>
      </div>
    );
  }

  const documentTitle = selectedCase.title.replace(/\.(pdf|docx?|xlsx?|csv|pptx?|key)$/i, '');

  return (
    <div className={styles.shell}>
      <nav className={styles.stageRail} aria-label="Learning stages">
        <div className={styles.stageMoon} aria-hidden="true" />
        {STAGES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.stageButton} ${stage === item.key ? styles.stageButtonActive : ''}`}
            onClick={() => {
              if (item.key === 'bind') {
                exportRecord();
                return;
              }
              if (item.key === 'practice') {
                setStatus('Practice grounds — QBook mounts here next');
                return;
              }
              setStage((current) => (current === item.key ? null : item.key));
            }}
            title={item.label}
          >
            <span className={styles.stageGlyph} aria-hidden="true">{item.glyph}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <aside className={styles.explorer}>
        <div className={styles.explorerHead}>
          <span>PROJECTS</span>
          <button type="button" title="Quick open (⌘P)" onClick={() => setPaletteOpen(true)}>⌘P</button>
        </div>
        <div className={styles.tree}>
          {cases.map((item) => {
            const itemPositions = openPositions(deriveEntries(item)).length;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.projectRow} ${item.id === selectedCase.id ? styles.projectRowActive : ''}`}
                onClick={() => openProject(item.id)}
              >
                <span className={styles.projectTitle}>{item.title}</span>
                <span className={styles.projectMeta}>
                  <span>{item.project === 'Learning pass' ? 'Learning' : 'Reflection'}</span>
                  {itemPositions > 0 && <span>{itemPositions} open</span>}
                </span>
              </button>
            );
          })}
        </div>

        <section className={styles.panelSection}>
          <button
            type="button"
            className={styles.panelHeader}
            onClick={() => setPanelsOpen((current) => ({ ...current, outline: !current.outline }))}
          >
            <span className={`${styles.panelChevron} ${panelsOpen.outline ? styles.panelChevronOpen : ''}`}>▶</span>
            OUTLINE
          </button>
          {panelsOpen.outline && (
            <div className={styles.panelBody}>
              {bookOrder(travelled).slice(0, 24).map((entry, index) => (
                <span key={entry.id}>
                  <button
                    type="button"
                    className={styles.outlineRow}
                    onClick={() => {
                      setCaughtID(entry.id);
                      document.getElementById(`wb-entry-${entry.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <span className={styles.outlinePage}>{entry.page ? `p.${entry.page}` : '·'}</span>
                    <span className={styles.outlineText}>{entry.text}</span>
                  </button>
                  {gaps.map((gap) =>
                    entry.page !== null && gap.from === entry.page + 1 && index < travelled.length ? (
                      <span key={`${gap.from}-${gap.to}`} className={styles.outlineGap}>
                        p.{gap.from}–p.{gap.to} unread
                      </span>
                    ) : null,
                  )}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panelSection}>
          <button
            type="button"
            className={styles.panelHeader}
            onClick={() => setPanelsOpen((current) => ({ ...current, timeline: !current.timeline }))}
          >
            <span className={`${styles.panelChevron} ${panelsOpen.timeline ? styles.panelChevronOpen : ''}`}>▶</span>
            TIMELINE
          </button>
          {panelsOpen.timeline && (
            <div className={styles.panelBody}>
              <input
                type="range"
                className={styles.timelineSlider}
                min={0}
                max={boundaries.total}
                step={1}
                value={timeTravel ?? boundaries.total}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setTimeTravel(value >= boundaries.total ? null : value);
                }}
                aria-label="Time travel through the manuscript"
              />
              <div className={styles.timelineLabel}>
                <span>start</span>
                <span>{timeTravel === null ? 'now' : `commit ${timeTravel}/${boundaries.total}`}</span>
              </div>
              <div className={styles.timelineLabel}>
                <span>first pass ends @ {boundaries.firstPassEnd}</span>
                <span>{positions.length} open</span>
              </div>
            </div>
          )}
        </section>
      </aside>

      <main className={styles.main}>
        <div className={styles.tabStrip}>
          {tabs.map((tab) => {
            const tabCase = cases.find((item) => item.id === tab.caseID);
            if (!tabCase) return null;
            const active = tab.caseID === selectedCase.id;
            return (
              <button
                key={`${tab.kind}:${tab.caseID}`}
                type="button"
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={() => setSelectedCaseID(tab.caseID)}
              >
                {tabCase.title}
                {tabs.length > 1 && (
                  <span
                    className={styles.tabClose}
                    role="button"
                    aria-label="Close tab"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.caseID);
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.manuscriptScroll}>
          <article className={styles.manuscript}>
            <h1 className={styles.msTitle}>{documentTitle}</h1>
            <p className={styles.msProvenance}>{provenanceLine}</p>
            {scopeLine && <p className={styles.msScope}>{scopeLine}</p>}
            <hr className={styles.msRule} />
            {visibleEntries.map((entry) => (
              <section
                key={entry.id}
                id={`wb-entry-${entry.id}`}
                className={`${styles.entry} ${entry.id === caughtID ? styles.entryCaught : ''}`}
              >
                <div className={styles.entryHead}>
                  <span className={styles.entryLabel}>{entry.label}</span>
                  {(entry.kind === 'question' || entry.kind === 'capture' || entry.isWeakAnchor) && (
                    <span
                      className={`${styles.entryDot} ${entry.kind === 'question' || entry.isWeakAnchor ? styles.dotOpen : styles.dotGrounded}`}
                      aria-label={entry.isWeakAnchor ? 'weak anchor' : entry.kind}
                    />
                  )}
                  {entry.page !== null && (
                    <button type="button" className={styles.entryAnchor} onClick={() => revealPage(entry)}>
                      p.{entry.page} ↗
                    </button>
                  )}
                </div>
                {entry.supersededText && <p className={styles.entrySuperseded}>{entry.supersededText}</p>}
                <p className={`${styles.entryText} ${entry.text.split(/\s+/).length <= 6 && entry.kind === 'capture' ? styles.entryTextStrong : ''}`}>
                  {recall && entry.kind === 'meaning' ? (
                    <span className={styles.entryRecallBlank}>{entry.text}</span>
                  ) : (
                    entry.text
                  )}
                </p>
                {entry.kind === 'question' && (
                  <p className={styles.entryFooter}>
                    {entry.openCondition ? `Open — closes when: ${entry.openCondition}` : 'Open — what would close this question?'}
                  </p>
                )}
                {entry.kind === 'capture' && !recall && (
                  <p className={styles.entryFooter}>Explain it in your own words</p>
                )}
              </section>
            ))}
            {visibleEntries.length === 0 && (
              <div className={styles.empty} style={{ height: 'auto', padding: '48px 0' }}>
                <div className={styles.emptyTitle}>{stage ? 'Nothing at this stage yet' : 'An empty manuscript'}</div>
                <div>Select in any native file and press ⌘⇧U — it files itself into the book.</div>
              </div>
            )}
          </article>
        </div>

        <div className={styles.composer}>
          <div className={styles.chips}>
            {(['meaning', 'question', 'correction', 'principle'] as CommitFocus[]).map((focus) => (
              <button
                key={focus}
                type="button"
                className={`${styles.chip} ${composerFocus === focus ? styles.chipActive : ''}`}
                onClick={() => setComposerFocus(focus)}
              >
                {focus[0]!.toUpperCase() + focus.slice(1)}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.chip} ${recall ? styles.chipActive : ''}`}
              style={{ marginLeft: 'auto' }}
              onClick={() => setRecall((current) => !current)}
              title="Blank out your meanings and recall them"
            >
              Recall
            </button>
          </div>
          <div className={styles.composerRow}>
            <textarea
              className={styles.composerInput}
              value={draft}
              placeholder={composerPlaceholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-label="Commit input"
            />
            <button
              type="button"
              className={styles.composerSend}
              onClick={submit}
              disabled={draft.trim().length === 0}
              aria-label="Commit"
            >
              ➤
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.statusBar}>
        <span>⌘⇧U captures from the frontmost file</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span
            className={styles.statusDot}
            style={{ background: anchoredPrecision.includes('pending') || anchoredPrecision.includes('no ') ? '#d9a03f' : '#4bc5de' }}
          />
          {anchoredPrecision}
        </span>
        <span>today {pulse.captures} captures · {pulse.meanings} meanings</span>
        {positions.length > 0 && <span>{positions.length} open position{positions.length === 1 ? '' : 's'}</span>}
        {!isMirror && <span>demo store</span>}
        <span className={styles.statusMessage}>{status}</span>
      </footer>

      {paletteOpen && (
        <div className={styles.paletteScrim} role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <div className={styles.palette} role="dialog" aria-label="Quick open" onMouseDown={(event) => event.stopPropagation()}>
            <input
              autoFocus
              className={styles.paletteInput}
              value={paletteQuery}
              placeholder="Jump to a project, an entry, or a page of the original…"
              onChange={(event) => {
                setPaletteQuery(event.target.value);
                setPaletteActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setPaletteActive((current) => Math.min(current + 1, paletteResults.length - 1));
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setPaletteActive((current) => Math.max(current - 1, 0));
                }
                if (event.key === 'Enter' && paletteResults[paletteActive]) {
                  runPaletteItem(paletteResults[paletteActive]!);
                }
              }}
            />
            <div className={styles.paletteList}>
              {paletteResults.map((item, index) => (
                <button
                  key={`${item.type}:${item.caseID}:${item.entryID ?? ''}:${item.page ?? ''}`}
                  type="button"
                  className={`${styles.paletteItem} ${index === paletteActive ? styles.paletteItemActive : ''}`}
                  onMouseEnter={() => setPaletteActive(index)}
                  onClick={() => runPaletteItem(item)}
                >
                  <span className={styles.paletteKind}>{item.type}</span>
                  <span className={styles.paletteTitle}>{item.title}</span>
                  <span className={styles.paletteSubtitle}>{item.subtitle}</span>
                </button>
              ))}
              {paletteResults.length === 0 && (
                <div className={styles.paletteItem}>
                  <span className={styles.paletteSubtitle}>No matches</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
