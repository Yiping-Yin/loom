'use client';

// Loom Workbench — "The Reading Instrument": VSCode's skeleton, Loom's body.
// Canonical spec: docs/projects/active/2026-07-03-loom-workbench-canonical-spec.md
// Soul: a lab notebook. Skeleton: an IDE. Center: the manuscript.
// Fed by the typed native snapshot (loom://) inside the app; demo data in a
// stock browser. Honest-empty rule: chrome for record kinds that don't exist
// yet renders its empty/derived state — never a fake.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import styles from './workbench.module.css';
import {
  bookOrder,
  deriveEntries,
  groupChapters,
  heartbeat,
  manuscriptAt,
  openPositions,
  pageGaps,
  paletteIndex,
  passBoundaries,
  type ManuscriptChapter,
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
type WorkbenchTab = { kind: TabKind; caseID: string };
type CommitFocus = 'meaning' | 'correction' | 'question' | 'principle';
type LensKey = 'collect' | 'distill' | 'weave';
type EvidenceChannel = 'provenance' | 'details' | 'chain';
type SheetState =
  | { type: 'bind' }
  | { type: 'gate'; statement: string }
  | { type: 'close'; entryID: string }
  | null;

const LENS_KINDS: Record<LensKey, ManuscriptEntry['kind'][]> = {
  collect: ['capture'],
  distill: ['meaning', 'correction', 'question'],
  weave: ['principle'],
};

const KIND_CHIPS: CommitFocus[] = ['meaning', 'correction', 'question', 'principle'];

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

function inferFocus(text: string): CommitFocus | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('?') || trimmed.endsWith('？')) return 'question';
  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith('principle:')) return 'principle';
  if (lowered.startsWith('correction:')) return 'correction';
  if (lowered.startsWith('question:')) return 'question';
  return null;
}

/** Derived learning state — a projection of the log, never a stored field. */
function deriveState(entries: ManuscriptEntry[]): string {
  if (entries.length === 0) return 'Empty';
  const open = openPositions(entries).length;
  const conclusions = entries.filter((entry) => entry.kind === 'principle').length;
  const review = entries.filter((entry) => ['meaning', 'correction', 'question'].includes(entry.kind)).length;
  if (open === 0 && conclusions > 0) return 'Settled';
  if (review > 0) return 'In Review';
  return 'Reading';
}

function ageLabel(createdAtMs: number | null): string | null {
  if (createdAtMs === null) return null;
  const days = Math.floor((Date.now() - createdAtMs) / 86_400_000);
  if (days <= 0) return 'today';
  return `${days}d`;
}

function commitStamp(createdAtMs: number | null): string | null {
  if (createdAtMs === null) return null;
  const date = new Date(createdAtMs);
  return `${date.getDate()} ${date.toLocaleString('en', { month: 'short' })} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** A manuscript row: a chapter head, a spread (quote + attached meanings), or a lone block. */
type ManuscriptRow =
  | { rowType: 'chapter'; chapter: ManuscriptChapter; key: string }
  | { rowType: 'spread'; quote: ManuscriptEntry; meanings: ManuscriptEntry[]; key: string }
  | { rowType: 'block'; entry: ManuscriptEntry; key: string };

function buildRows(chapters: ManuscriptChapter[]): ManuscriptRow[] {
  const rows: ManuscriptRow[] = [];
  for (const chapter of chapters) {
    rows.push({ rowType: 'chapter', chapter, key: `ch-${chapter.index}` });
    let lastSpread: Extract<ManuscriptRow, { rowType: 'spread' }> | null = null;
    for (const entry of chapter.entries) {
      if (entry.kind === 'capture') {
        lastSpread = { rowType: 'spread', quote: entry, meanings: [], key: entry.id };
        rows.push(lastSpread);
      } else if (
        entry.kind === 'meaning' &&
        lastSpread &&
        entry.page !== null &&
        entry.page === lastSpread.quote.page
      ) {
        // 读薄's atomic unit — the meaning joins its quote in one spread row.
        lastSpread.meanings.push(entry);
      } else {
        rows.push({ rowType: 'block', entry, key: entry.id });
        if (entry.kind !== 'meaning') lastSpread = null;
      }
    }
  }
  return rows;
}

function selectableIDs(rows: ManuscriptRow[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    if (row.rowType === 'spread') {
      ids.push(row.quote.id);
      for (const meaning of row.meanings) ids.push(meaning.id);
    } else if (row.rowType === 'block') {
      ids.push(row.entry.id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Drawn glyphs (stroke:currentColor; emoji are banned product-wide)

function RailIcon({ name }: { name: LensKey | 'bind' | 'practice' }) {
  const paths: Record<string, ReactElement> = {
    collect: (
      <>
        <path d="M10 3.5C7.5 2 4.5 2 2.5 3v13c2-1 5-1 7.5.5 2.5-1.5 5.5-1.5 7.5-.5V3c-2-1-5-1-7.5.5Z" />
        <path d="M10 3.5V17" />
      </>
    ),
    distill: (
      <>
        <path d="M13.5 2.5 17 6l-8.5 8.5L4 16l1.5-4.5L14 3Z" />
        <path d="M3 18h14" />
      </>
    ),
    weave: (
      <>
        <path d="M3 5c4 0 4 10 7 10s3-10 7-10" />
        <path d="M3 10c4 0 4-5 7-5s3 5 7 5" />
        <path d="M3 15c4 0 4-5 7-5s3 5 7 5" />
      </>
    ),
    bind: (
      <>
        <rect x="5" y="2.5" width="10" height="15" rx="1.5" />
        <path d="M8 2.5v15" />
        <path d="M10.5 6.5h2.5M10.5 9.5h2.5" />
      </>
    ),
    practice: (
      <>
        <path d="M4 16 15.5 3.5M4 3.5 15.5 16" />
        <path d="M3 13.5 6.5 17M17 13.5 13.5 17" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function GlyphSearch({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="4" />
      <path d="m9.2 9.2 3 3" />
    </svg>
  );
}

function GlyphBook({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 2.8C5.4 1.8 3.4 1.8 2 2.5v8.7c1.4-.7 3.4-.7 5 .3 1.6-1 3.6-1 5-.3V2.5c-1.4-.7-3.4-.7-5 .3Z" />
      <path d="M7 2.8v8.7" />
    </svg>
  );
}

function GlyphFoils({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      <path d="M2.8 11.2 11.2 2.8M2.8 2.8l8.4 8.4" />
    </svg>
  );
}

function GlyphChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={collapsed ? { transform: 'rotate(-90deg)' } : undefined}>
      <path d="M1.5 2.5 4 5.5l2.5-3" />
    </svg>
  );
}

function GlyphCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#4bc5de" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m1.5 5.5 2.5 2.5 4.5-6" />
    </svg>
  );
}

function GlyphCommit() {
  // Arrow-into-page: a filing gesture, never a paper plane.
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 1.5v7M4.2 5.7 7 8.5l2.8-2.8" />
      <path d="M2 12h10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------

export default function WorkbenchClient() {
  const [cases, setCases] = useState<NativeReflectionCase[]>(DEMO_WORKBENCH_CASES);
  const [isMirror, setIsMirror] = useState(false);
  const [selectedCaseID, setSelectedCaseID] = useState<string>(DEMO_WORKBENCH_CASES[0]!.id);
  const [tabs, setTabs] = useState<WorkbenchTab[]>([{ kind: 'manuscript', caseID: DEMO_WORKBENCH_CASES[0]!.id }]);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>({ kind: 'manuscript', caseID: DEMO_WORKBENCH_CASES[0]!.id });
  const [lens, setLens] = useState<LensKey | null>(null);
  const [recall, setRecall] = useState(false);
  const [unblanked, setUnblanked] = useState<Set<string>>(new Set());
  const [timeTravel, setTimeTravel] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteActive, setPaletteActive] = useState(0);
  const [explicitFocus, setExplicitFocus] = useState<CommitFocus | null>(null);
  const [draft, setDraft] = useState('');
  const [anchorEntryID, setAnchorEntryID] = useState<string | null>(null);
  const [transient, setTransientRaw] = useState('');
  const [caughtID, setCaughtID] = useState<string | null>(null);
  const [filedPill, setFiledPill] = useState<{ entryID: string; page: number | null } | null>(null);
  const [selectedBlockID, setSelectedBlockID] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceChannel, setEvidenceChannel] = useState<EvidenceChannel>('provenance');
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [explorerW, setExplorerW] = useState(304);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [weakFilter, setWeakFilter] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [holdsWithin, setHoldsWithin] = useState('');
  const [statusPopover, setStatusPopover] = useState<'capture' | 'store' | null>(null);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [secondPass, setSecondPass] = useState(false);
  const [locus, setLocus] = useState<{ chapter: string; page: number | null } | null>(null);
  const [rulerMarks, setRulerMarks] = useState<Array<{ id: string; top: number; kind: 'evidence' | 'attention' | 'chapter' }>>([]);
  const [viewportBand, setViewportBand] = useState<{ top: number; height: number }>({ top: 0, height: 0 });

  const knownRecordIDs = useRef<Set<string>>(new Set());
  const docScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const transientTimer = useRef<number | null>(null);
  const historyRing = useRef<Array<{ caseID: string; blockID: string }>>([]);
  const historyCursor = useRef(-1);
  const [historyVersion, setHistoryVersion] = useState(0);

  const setTransient = useCallback((message: string) => {
    setTransientRaw(message);
    if (transientTimer.current) window.clearTimeout(transientTimer.current);
    transientTimer.current = window.setTimeout(() => setTransientRaw(''), 6000);
  }, []);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseID) ?? cases[0] ?? null,
    [cases, selectedCaseID],
  );

  // ----- data plumbing (the catch) -----------------------------------------

  const refresh = useCallback(async (announceCatch: boolean) => {
    const snapshot = await fetchNativeReflectionSnapshot();
    if (!snapshot) return;
    setIsMirror(true);
    setCases(snapshot.cases);
    if (announceCatch) {
      for (const nativeCase of snapshot.cases) {
        for (const record of nativeCase.traceRecords ?? []) {
          if (!knownRecordIDs.current.has(record.id)) {
            setCaughtID(record.id);
            setSelectedCaseID(nativeCase.id);
            setTabs((current) =>
              current.some((tab) => tab.caseID === nativeCase.id && tab.kind === 'manuscript')
                ? current
                : [...current, { kind: 'manuscript', caseID: nativeCase.id }],
            );
            setActiveTab({ kind: 'manuscript', caseID: nativeCase.id });
            const page = record.sourceAnchor.match(/page (\d+)/i);
            setTransient(`filed at ${page ? `p.${page[1]}` : 'end matter'} · ${record.focus}`);
            window.setTimeout(() => {
              const el = blockRefs.current.get(record.id);
              const scroller = docScrollRef.current;
              if (el && scroller) {
                const inView =
                  el.offsetTop >= scroller.scrollTop &&
                  el.offsetTop <= scroller.scrollTop + scroller.clientHeight - 80;
                if (!inView) setFiledPill({ entryID: record.id, page: page ? Number(page[1]) : null });
              }
            }, 120);
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
  }, [setTransient]);

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

  // ----- projections --------------------------------------------------------

  const allEntries = useMemo(() => (selectedCase ? deriveEntries(selectedCase) : []), [selectedCase]);
  const boundaries = useMemo(() => passBoundaries(allEntries), [allEntries]);
  // Law: manuscriptAt() THEN pairing — deriveEntries already pairs on the
  // full stream; time-travel re-derives from the truncated stream so
  // corrections un-strike (the model handles this inside manuscriptAt).
  const travelled = useMemo(
    () => (timeTravel === null ? allEntries : manuscriptAt(allEntries, timeTravel)),
    [allEntries, timeTravel],
  );
  const lensed = useMemo(() => {
    const kinds = lens ? LENS_KINDS[lens] : undefined;
    return kinds ? travelled.filter((entry) => kinds.includes(entry.kind)) : travelled;
  }, [travelled, lens]);
  const { chapters, conclusions } = useMemo(() => groupChapters(lensed), [lensed]);
  const rows = useMemo(() => buildRows(chapters), [chapters]);
  const blockIDs = useMemo(() => selectableIDs(rows), [rows]);
  const gaps = useMemo(() => pageGaps(travelled), [travelled]);
  const positions = useMemo(() => openPositions(travelled), [travelled]);
  const pulse = useMemo(() => heartbeat(cases), [cases]);
  const ordered = useMemo(() => bookOrder(travelled), [travelled]);

  const anchoredCount = useMemo(() => travelled.filter((entry) => entry.page !== null && !entry.isWeakAnchor).length, [travelled]);
  const weakCount = useMemo(() => travelled.filter((entry) => entry.isWeakAnchor).length, [travelled]);
  const capturedPages = useMemo(() => {
    const pages = new Set<number>();
    for (const entry of travelled) if (entry.page !== null) pages.add(entry.page);
    return [...pages].sort((a, b) => a - b);
  }, [travelled]);

  const entryByID = useMemo(() => {
    const map = new Map<string, ManuscriptEntry>();
    for (const entry of allEntries) map.set(entry.id, entry);
    return map;
  }, [allEntries]);

  const selectedEntry = selectedBlockID ? entryByID.get(selectedBlockID) ?? null : null;
  const anchorEntry = anchorEntryID ? entryByID.get(anchorEntryID) ?? null : null;
  const derivedState = useMemo(() => deriveState(allEntries), [allEntries]);
  const litFocus: CommitFocus = inferFocus(draft) ?? explicitFocus ?? 'meaning';
  const documentTitle = selectedCase ? selectedCase.title.replace(/\.(pdf|docx?|xlsx?|csv|pptx?|key)$/i, '') : '';
  const sourceLabel = selectedCase?.sources[0]?.label ?? documentTitle;

  const findMatches = useMemo(() => {
    if (!findOpen || !findQuery.trim()) return [];
    const query = findQuery.trim().toLowerCase();
    return blockIDs.filter((id) => {
      const entry = entryByID.get(id);
      return entry ? entry.text.toLowerCase().includes(query) : false;
    });
  }, [findOpen, findQuery, blockIDs, entryByID]);

  // ----- history ring (the ‹ › contract) ------------------------------------

  const applyHistory = useCallback((slot: { caseID: string; blockID: string }) => {
    setSelectedCaseID(slot.caseID);
    setActiveTab({ kind: 'manuscript', caseID: slot.caseID });
    setSelectedBlockID(slot.blockID);
    setEvidenceOpen(true);
    setCaughtID(slot.blockID);
    window.setTimeout(() => {
      blockRefs.current.get(slot.blockID)?.scrollIntoView({ block: 'center' });
    }, 60);
  }, []);

  const pushHistory = useCallback((blockID: string, caseID: string) => {
    const ring = historyRing.current;
    const top = ring[historyCursor.current];
    if (top && top.blockID === blockID && top.caseID === caseID) return;
    ring.splice(historyCursor.current + 1);
    ring.push({ caseID, blockID });
    if (ring.length > 64) ring.shift();
    historyCursor.current = ring.length - 1;
    setHistoryVersion((v) => v + 1);
  }, []);

  const historyStep = useCallback((delta: -1 | 1) => {
    const next = historyCursor.current + delta;
    if (next < 0 || next >= historyRing.current.length) return;
    historyCursor.current = next;
    setHistoryVersion((v) => v + 1);
    applyHistory(historyRing.current[next]!);
  }, [applyHistory]);

  // ----- actions -------------------------------------------------------------

  const openProject = useCallback((caseID: string) => {
    setSelectedCaseID(caseID);
    setTimeTravel(null);
    setLens(null);
    setSelectedBlockID(null);
    setTabs((current) =>
      current.some((tab) => tab.caseID === caseID && tab.kind === 'manuscript')
        ? current
        : [...current, { kind: 'manuscript', caseID }],
    );
    setActiveTab({ kind: 'manuscript', caseID });
  }, []);

  const revealBlock = useCallback((blockID: string, options?: { push?: boolean }) => {
    if (options?.push !== false && selectedCase) pushHistory(blockID, selectedCase.id);
    setSelectedBlockID(blockID);
    setEvidenceOpen(true);
    setCaughtID(blockID);
    blockRefs.current.get(blockID)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [pushHistory, selectedCase]);

  const revealSource = useCallback((entry: Pick<ManuscriptEntry, 'sourceAnchor' | 'page'>) => {
    const bridge = bridges().reveal;
    if (bridge && selectedCase) {
      bridge.postMessage({ caseID: selectedCase.id, sourceAnchor: entry.sourceAnchor, page: entry.page });
      setTransient(`revealing p.${entry.page ?? '?'} in the source`);
    } else {
      setTransient('source reveal works inside the Loom app');
    }
  }, [selectedCase, setTransient]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || !selectedCase || timeTravel !== null) return;
    const focus = litFocus;
    const anchor = anchorEntry
      ? { sourceAnchor: anchorEntry.sourceAnchor, page: anchorEntry.page }
      : null;
    const bridge = bridges().commit;
    if (bridge) {
      bridge.postMessage({ caseID: selectedCase.id, text, focus, anchor });
      setTransient(`committed as ${focus}`);
      window.setTimeout(() => void refresh(true), 450);
    } else {
      const record: NativeTraceRecord = {
        schemaVersion: 1,
        id: `local-${Math.random().toString(36).slice(2)}`,
        kind: 'captured',
        traceType: 'user trace',
        sourceAnchor: anchor?.sourceAnchor ?? sourceLabel,
        focus: focus === 'meaning' ? 'user meaning' : focus,
        text,
        evidence: [],
        legacyItem: `Captured user trace from ${anchor?.sourceAnchor ?? sourceLabel} [${focus === 'meaning' ? 'user meaning' : focus}]: ${text}`,
      };
      setCases((current) =>
        current.map((item) =>
          item.id === selectedCase.id
            ? { ...item, traceRecords: [...(item.traceRecords ?? []), record] }
            : item,
        ),
      );
      setCaughtID(record.id);
      setTransient(`filed ${anchor?.page ? `at p.${anchor.page}` : 'as end matter'} · ${focus} (demo)`);
    }
    setDraft('');
    setExplicitFocus(null);
  }, [draft, selectedCase, litFocus, anchorEntry, sourceLabel, timeTravel, refresh, setTransient]);

  const bindExport = useCallback(() => {
    const bridge = bridges().exportRecord;
    if (bridge && selectedCase) {
      bridge.postMessage({ caseID: selectedCase.id });
      setTransient('binding — exporting the learning record');
    } else {
      setTransient('Bind & export works inside the Loom app');
    }
    setSheet(null);
  }, [selectedCase, setTransient]);

  const closeTab = useCallback((tab: WorkbenchTab) => {
    // The active project's manuscript tab is pinned and refuses to close.
    if (tab.kind === 'manuscript' && tab.caseID === selectedCaseID) return;
    setTabs((current) => {
      const next = current.filter((item) => !(item.caseID === tab.caseID && item.kind === tab.kind));
      return next.length > 0 ? next : current;
    });
    if (activeTab.caseID === tab.caseID && activeTab.kind === tab.kind) {
      setActiveTab({ kind: 'manuscript', caseID: selectedCaseID });
    }
  }, [selectedCaseID, activeTab]);

  const openPractice = useCallback(() => {
    if (!selectedCase) return;
    setTabs((current) =>
      current.some((tab) => tab.caseID === selectedCase.id && tab.kind === 'practice')
        ? current
        : [...current, { kind: 'practice', caseID: selectedCase.id }],
    );
    setActiveTab({ kind: 'practice', caseID: selectedCase.id });
  }, [selectedCase]);

  const cycleOpenPosition = useCallback(() => {
    if (positions.length === 0) return;
    const currentIdx = positions.findIndex((entry) => entry.id === selectedBlockID);
    const next = positions[(currentIdx + 1) % positions.length]!;
    revealBlock(next.id);
  }, [positions, selectedBlockID, revealBlock]);

  const startSecondPass = useCallback(() => {
    setSecondPass(true);
    setRecall(true);
    setLens('distill');
    docScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setTransient('second pass — recall is on (pass records sign in-app)');
  }, [setTransient]);

  const citeIntoComposer = useCallback((blockID: string) => {
    setAnchorEntryID(blockID);
    composerRef.current?.focus();
  }, []);

  const reviseSelection = useCallback((blockID: string) => {
    setAnchorEntryID(blockID);
    setExplicitFocus('correction');
    composerRef.current?.focus();
  }, []);

  // ----- Esc peel stack ------------------------------------------------------

  const peel = useCallback(() => {
    if (sheet) { setSheet(null); return; }
    if (paletteOpen) { setPaletteOpen(false); return; }
    if (findOpen) { setFindOpen(false); return; }
    if (statusPopover || titleMenuOpen) { setStatusPopover(null); setTitleMenuOpen(false); return; }
    if (document.activeElement === composerRef.current) { composerRef.current?.blur(); return; }
    if (evidenceOpen) { setEvidenceOpen(false); setSelectedBlockID(null); return; }
    if (timeTravel !== null) { setTimeTravel(null); return; }
    if (weakFilter) { setWeakFilter(false); return; }
    if (lens !== null) { setLens(null); return; }
    if (recall) { setRecall(false); return; }
  }, [sheet, paletteOpen, findOpen, statusPopover, titleMenuOpen, evidenceOpen, timeTravel, weakFilter, lens, recall]);

  // ----- keyboard map --------------------------------------------------------

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const meta = event.metaKey || event.ctrlKey;

      if (event.key === 'Escape') { peel(); return; }

      if (meta && !event.ctrlKey === event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'p') {
          event.preventDefault();
          setPaletteOpen(true);
          setPaletteQuery(event.shiftKey ? '>' : '');
          setPaletteActive(0);
          return;
        }
        if (key === 'f') { event.preventDefault(); setFindOpen(true); setFindIndex(0); return; }
        if (key === 'b' && event.altKey) { event.preventDefault(); setEvidenceOpen((open) => !open); return; }
        if (key === 'b') { event.preventDefault(); setExplorerVisible((visible) => !visible); return; }
        if (key === '[') { event.preventDefault(); historyStep(-1); return; }
        if (key === ']') { event.preventDefault(); historyStep(1); return; }
        if (key === 'w') { event.preventDefault(); closeTab(activeTab); return; }
        if (/^[1-9]$/.test(event.key) && !event.ctrlKey) {
          const tab = tabs[Number(event.key) - 1];
          if (tab) {
            event.preventDefault();
            setActiveTab(tab);
            setSelectedCaseID(tab.caseID);
          }
          return;
        }
        if (key === 'enter') {
          if (typing && target === composerRef.current) { event.preventDefault(); submit(); return; }
          if (selectedBlockID) { event.preventDefault(); citeIntoComposer(selectedBlockID); return; }
        }
        return;
      }

      if (event.ctrlKey && /^[1-5]$/.test(event.key)) {
        event.preventDefault();
        const index = Number(event.key);
        if (index === 1) setLens((current) => (current === 'collect' ? null : 'collect'));
        if (index === 2) setLens((current) => (current === 'distill' ? null : 'distill'));
        if (index === 3) setLens((current) => (current === 'weave' ? null : 'weave'));
        if (index === 4) setSheet({ type: 'bind' });
        if (index === 5) openPractice();
        return;
      }

      if (event.altKey && /^[1-4]$/.test(event.code.replace('Digit', ''))) {
        event.preventDefault();
        setExplicitFocus(KIND_CHIPS[Number(event.code.replace('Digit', '')) - 1]!);
        return;
      }

      if (typing || paletteOpen || sheet) return;

      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        const index = selectedBlockID ? blockIDs.indexOf(selectedBlockID) : -1;
        const next = event.key === 'j' ? Math.min(index + 1, blockIDs.length - 1) : Math.max(index - 1, 0);
        const id = blockIDs[next];
        if (id) {
          setSelectedBlockID(id);
          setEvidenceOpen(true);
          blockRefs.current.get(id)?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }
      if (event.key === 'Enter' && selectedBlockID) {
        event.preventDefault();
        const entry = entryByID.get(selectedBlockID);
        if (entry) revealSource(entry);
        return;
      }
      if (event.key === 'c' && selectedBlockID) {
        event.preventDefault();
        reviseSelection(selectedBlockID);
        return;
      }
      // Type-to-compose: any printable key with no other focus target.
      if (event.key.length === 1 && !meta && !event.altKey) {
        composerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [peel, historyStep, closeTab, activeTab, tabs, submit, selectedBlockID, blockIDs, entryByID, revealSource, reviseSelection, citeIntoComposer, paletteOpen, sheet, openPractice]);

  // ----- scroll-spy locus + overview ruler ----------------------------------

  const recomputeRuler = useCallback(() => {
    const scroller = docScrollRef.current;
    if (!scroller) return;
    const total = scroller.scrollHeight;
    if (total === 0) return;
    const marks: Array<{ id: string; top: number; kind: 'evidence' | 'attention' | 'chapter' }> = [];
    for (const [id, el] of blockRefs.current) {
      if (!el.isConnected) continue;
      const top = el.offsetTop / total;
      if (id.startsWith('ch-')) marks.push({ id, top, kind: 'chapter' });
      else {
        const entry = entryByID.get(id);
        if (!entry) continue;
        if (entry.kind === 'question' || entry.isWeakAnchor) marks.push({ id, top, kind: 'attention' });
        else if (entry.kind === 'capture') marks.push({ id, top, kind: 'evidence' });
      }
    }
    setRulerMarks(marks);
    setViewportBand({ top: scroller.scrollTop / total, height: scroller.clientHeight / total });
  }, [entryByID]);

  useEffect(() => {
    const scroller = docScrollRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const total = scroller.scrollHeight;
      setViewportBand({ top: scroller.scrollTop / total, height: scroller.clientHeight / total });
      // Locus: the topmost visible block below the sticky band.
      let best: { chapter: string; page: number | null } | null = null;
      let chapterTitle = '';
      for (const row of rows) {
        const el = blockRefs.current.get(row.rowType === 'chapter' ? row.key : row.key);
        if (!el) continue;
        if (row.rowType === 'chapter') {
          if (el.offsetTop <= scroller.scrollTop + 48) chapterTitle = row.chapter.title;
          continue;
        }
        if (el.offsetTop + el.offsetHeight > scroller.scrollTop + 48 && best === null) {
          const entry = row.rowType === 'spread' ? row.quote : row.entry;
          best = { chapter: chapterTitle, page: entry.page };
        }
      }
      setLocus(best);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [rows]);

  useEffect(() => {
    const raf = requestAnimationFrame(recomputeRuler);
    const onResize = () => recomputeRuler();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [recomputeRuler, rows]);

  // ----- explorer resizer ----------------------------------------------------

  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    if (!resizing) return;
    const onMove = (event: PointerEvent) => {
      setExplorerW(Math.min(420, Math.max(240, event.clientX - 64)));
    };
    const onUp = () => setResizing(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [resizing]);

  // ----- palette -------------------------------------------------------------

  type PaletteRow = {
    key: string;
    tag: string;
    title: string;
    detail: string;
    run: () => void;
  };

  const paletteRows: PaletteRow[] = useMemo(() => {
    const query = paletteQuery;
    const sigil = query[0];
    const rest = query.slice(1).trim().toLowerCase();
    const runEntry = (item: PaletteItem) => () => {
      setPaletteOpen(false);
      openProject(item.caseID);
      if (item.entryID) window.setTimeout(() => revealBlock(item.entryID!), 80);
    };

    if (sigil === '>') {
      const actions: Array<{ title: string; detail: string; run: () => void }> = [
        { title: 'Start second pass', detail: 'recall on · scroll to §1', run: () => { setPaletteOpen(false); startSecondPass(); } },
        { title: 'Bind & export', detail: 'freeze this book as evidence', run: () => { setPaletteOpen(false); setSheet({ type: 'bind' }); } },
        { title: 'Toggle Explorer', detail: '⌘B', run: () => { setPaletteOpen(false); setExplorerVisible((visible) => !visible); } },
        { title: 'Toggle Evidence', detail: '⌘⌥B', run: () => { setPaletteOpen(false); setEvidenceOpen((open) => !open); } },
        { title: 'Open practice', detail: 'the ground for this project', run: () => { setPaletteOpen(false); openPractice(); } },
        { title: 'Return to now', detail: 'leave time travel', run: () => { setPaletteOpen(false); setTimeTravel(null); } },
        { title: 'Filter weak anchors', detail: 'dim page-precise blocks', run: () => { setPaletteOpen(false); setWeakFilter((value) => !value); } },
        { title: 'Find in manuscript', detail: '⌘F', run: () => { setPaletteOpen(false); setFindOpen(true); } },
        { title: 'Collapse all sections', detail: 'explorer', run: () => { setPaletteOpen(false); setCollapsed({ projects: true, outline: true, timeline: true, principles: true }); } },
      ];
      return actions
        .filter((action) => !rest || action.title.toLowerCase().includes(rest))
        .map((action, index) => ({ key: `act-${index}`, tag: 'ACT', title: action.title, detail: action.detail, run: action.run }));
    }

    if (sigil === ':') {
      const page = Number(rest);
      if (!Number.isFinite(page) || rest === '') return [];
      const hits = ordered.filter((entry) => entry.page === page);
      if (hits.length > 0) {
        return [{
          key: `pg-${page}`,
          tag: 'PG',
          title: `p.${page}`,
          detail: `${hits.length} trace${hits.length === 1 ? '' : 's'}`,
          run: () => { setPaletteOpen(false); revealBlock(hits[0]!.id); },
        }];
      }
      const before = [...capturedPages].reverse().find((captured) => captured < page);
      const after = capturedPages.find((captured) => captured > page);
      const rows: PaletteRow[] = [{
        key: `pg-${page}-unread`,
        tag: 'PG',
        title: `p.${page} — unread`,
        detail: 'reveal in source ↗',
        run: () => { setPaletteOpen(false); revealSource({ sourceAnchor: `${sourceLabel}, page ${page}`, page }); },
      }];
      if (before !== undefined) rows.push({
        key: `pg-${before}-before`, tag: 'PG', title: `p.${before}`, detail: 'nearest capture before',
        run: () => { setPaletteOpen(false); const hit = ordered.find((entry) => entry.page === before); if (hit) revealBlock(hit.id); },
      });
      if (after !== undefined) rows.push({
        key: `pg-${after}-after`, tag: 'PG', title: `p.${after}`, detail: 'nearest capture after',
        run: () => { setPaletteOpen(false); const hit = ordered.find((entry) => entry.page === after); if (hit) revealBlock(hit.id); },
      });
      return rows;
    }

    if (sigil === '?') {
      const rows: PaletteRow[] = [];
      for (const item of cases) {
        for (const entry of openPositions(deriveEntries(item))) {
          if (rest && !entry.text.toLowerCase().includes(rest)) continue;
          rows.push({
            key: `open-${entry.id}`,
            tag: 'OPEN',
            title: entry.text.replace(/closes when:[\s\S]*$/i, '').trim(),
            detail: `${ageLabel(entry.createdAtMs) ?? ''} · ${item.title}`.replace(/^ · /, ''),
            run: () => { setPaletteOpen(false); openProject(item.id); window.setTimeout(() => revealBlock(entry.id), 80); },
          });
        }
      }
      return rows;
    }

    if (sigil === '#') {
      const rows: PaletteRow[] = [];
      for (const item of cases) {
        for (const entry of deriveEntries(item).filter((candidate) => candidate.kind === 'principle')) {
          if (rest && !entry.text.toLowerCase().includes(rest)) continue;
          rows.push({
            key: `pri-${entry.id}`,
            tag: 'PRI',
            title: entry.text,
            detail: 'candidate',
            run: () => { setPaletteOpen(false); openProject(item.id); window.setTimeout(() => revealBlock(entry.id), 80); },
          });
        }
      }
      return rows;
    }

    if (sigil === '@') {
      return ordered
        .filter((entry) => !rest || entry.text.toLowerCase().includes(rest))
        .map((entry) => ({
          key: `ent-${entry.id}`,
          tag: 'ENT',
          title: entry.text,
          detail: entry.page !== null ? `p.${entry.page}` : 'end matter',
          run: () => { setPaletteOpen(false); revealBlock(entry.id); },
        }));
    }

    // Mixed best-match.
    const index = paletteIndex(cases);
    const lowered = query.trim().toLowerCase();
    const tagFor = (item: PaletteItem) => (item.type === 'project' ? 'PRJ' : item.type === 'page' ? 'PG' : 'ENT');
    return index
      .filter((item) => !lowered || item.title.toLowerCase().includes(lowered) || item.subtitle.toLowerCase().includes(lowered))
      .slice(0, 24)
      .map((item) => ({
        key: `${item.type}-${item.caseID}-${item.entryID ?? ''}-${item.page ?? ''}`,
        tag: tagFor(item),
        title: item.title,
        detail: item.subtitle,
        run: runEntry(item),
      }));
  }, [paletteQuery, cases, ordered, capturedPages, sourceLabel, openProject, revealBlock, revealSource, startSecondPass, openPractice]);

  // ----- render helpers ------------------------------------------------------

  const registerBlock = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) blockRefs.current.set(id, el);
    else blockRefs.current.delete(id);
  }, []);

  const dimForWeakFilter = useCallback(
    (entry: ManuscriptEntry) => weakFilter && !entry.isWeakAnchor && entry.page !== null,
    [weakFilter],
  );

  const anchorChip = (entry: ManuscriptEntry) => (
    <button
      type="button"
      className={`${styles.anchorChip} ${entry.isWeakAnchor ? styles.anchorChipWeak : ''}`}
      onClick={(event) => { event.stopPropagation(); revealSource(entry); }}
      title={entry.isWeakAnchor ? 'window precision — visual context only' : `reveal ${entry.sourceAnchor}`}
    >
      {entry.page !== null ? `p.${entry.page}` : entry.isWeakAnchor ? 'window' : '·'}
      {entry.isWeakAnchor && entry.page !== null && <span className={styles.anchorChipSecond}>window</span>}
    </button>
  );

  const selRule = (id: string, paired?: boolean) =>
    selectedBlockID === id
      ? <span className={styles.selRule} aria-hidden="true" />
      : paired
        ? <span className={styles.selRulePaired} aria-hidden="true" />
        : null;

  const meaningBody = (entry: ManuscriptEntry, inSpread: boolean) => {
    const blanked = recall && lens === 'distill' && !unblanked.has(entry.id);
    return (
      <div
        ref={registerBlock(entry.id)}
        id={`wb-entry-${entry.id}`}
        className={`${styles.textCell} ${inSpread ? styles.spreadMeaning : ''} ${entry.id === caughtID ? styles.flash : ''} ${dimForWeakFilter(entry) ? styles.dimmed : ''}`}
        onClick={() => { setSelectedBlockID(entry.id); setEvidenceOpen(true); }}
      >
        {selRule(entry.id, inSpread && selectedBlockID !== null && blockIDs.includes(selectedBlockID))}
        {blanked ? (
          <button type="button" className={styles.recallBlank} onClick={(event) => { event.stopPropagation(); setUnblanked((current) => new Set(current).add(entry.id)); }} aria-label="Recall — click to un-blank">
            <span aria-hidden="true">{entry.text}</span>
          </button>
        ) : (
          <p className={styles.ownedProse}>
            {entry.text}
            {!inSpread && entry.page !== null && (
              <button type="button" className={styles.trailingAnchor} onClick={(event) => { event.stopPropagation(); revealSource(entry); }}>
                {' '}p.{entry.page} ↗
              </button>
            )}
          </p>
        )}
      </div>
    );
  };

  // ----- guards --------------------------------------------------------------

  if (!selectedCase) {
    return (
      <div className={styles.workbench}>
        <div className={styles.emptyCenter}>
          <p className={styles.emptyHint}>Capture something with ⌘⇧U — it files here, at its page.</p>
        </div>
      </div>
    );
  }

  const isPractice = activeTab.kind === 'practice';
  const travelling = timeTravel !== null;
  const canGoBack = historyCursor.current > 0 && historyVersion >= 0;
  const canGoForward = historyCursor.current < historyRing.current.length - 1;

  // ----- render ---------------------------------------------------------------

  return (
    <div
      className={styles.workbench}
      style={{
        ['--explorer-w' as string]: explorerVisible ? `${explorerW}px` : '0px',
        ['--evidence-w' as string]: evidenceOpen ? '320px' : '0px',
      }}
    >
      {/* ============ Titleband ============ */}
      <header className={styles.titleband}>
        <div className={styles.trafficReserve} aria-hidden="true" />
        <div className={styles.history}>
          <button type="button" onClick={() => historyStep(-1)} disabled={!canGoBack} aria-label="Back (⌘[)">‹</button>
          <button type="button" onClick={() => historyStep(1)} disabled={!canGoForward} aria-label="Forward (⌘])">›</button>
        </div>
        <span />
        <button type="button" className={styles.commandCenter} onClick={() => { setPaletteOpen(true); setPaletteQuery(''); setPaletteActive(0); }}>
          <GlyphSearch />
          <span>{documentTitle}</span>
        </button>
        <span />
        <div className={styles.layoutToggles}>
          <button type="button" onClick={() => setExplorerVisible((visible) => !visible)} aria-label="Toggle Explorer (⌘B)">
            <span className={`${styles.layoutGlyph} ${styles.layoutGlyphLeft} ${explorerVisible ? styles.layoutGlyphOn : ''}`} />
          </button>
          <button type="button" onClick={() => setEvidenceOpen((open) => !open)} aria-label="Toggle Evidence (⌘⌥B)">
            <span className={`${styles.layoutGlyph} ${styles.layoutGlyphRight} ${evidenceOpen ? styles.layoutGlyphOn : ''}`} />
          </button>
        </div>
      </header>

      {/* ============ Tab band ============ */}
      <header className={styles.tabBand}>
        {tabs.map((tab) => {
          const tabCase = cases.find((item) => item.id === tab.caseID);
          if (!tabCase) return null;
          const active = tab.caseID === activeTab.caseID && tab.kind === activeTab.kind;
          const pinned = tab.kind === 'manuscript' && tab.caseID === selectedCaseID;
          const tabPositions = openPositions(deriveEntries(tabCase)).length;
          return (
            <div
              key={`${tab.kind}:${tab.caseID}`}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              className={`${styles.tab} ${active ? styles.tabActive : ''} ${pinned ? styles.tabPinned : ''}`}
              onClick={() => { setActiveTab(tab); setSelectedCaseID(tab.caseID); }}
              onKeyDown={(event) => { if (event.key === 'Enter') { setActiveTab(tab); setSelectedCaseID(tab.caseID); } }}
            >
              <span className={styles.tabGlyph}>{tab.kind === 'practice' ? <GlyphFoils /> : <GlyphBook />}</span>
              <span className={styles.tabLabel}>{tabCase.title}</span>
              <span className={styles.tabTrail}>
                {tabPositions > 0 && <span className={styles.tabDot} aria-label={`${tabPositions} open positions`} />}
                {!pinned && (
                  <button
                    type="button"
                    className={styles.tabClose}
                    aria-label="Close tab (⌘W)"
                    onClick={(event) => { event.stopPropagation(); closeTab(tab); }}
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
          );
        })}
        <button type="button" className={styles.tabOverflow} aria-label="All tabs" onClick={() => { setPaletteOpen(true); setPaletteQuery('>'); }}>⋯</button>
      </header>

      {/* ============ Stage rail ============ */}
      <nav className={styles.stageRail} aria-label="Learning stages">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loom/history/moon-orb.webp" alt="" className={styles.moonMark} />
        {(['collect', 'distill', 'weave'] as LensKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.railButton} ${lens === key ? styles.railButtonActive : ''}`}
            onClick={() => setLens((current) => (current === key ? null : key))}
            aria-pressed={lens === key}
          >
            <RailIcon name={key} />
            <span className={styles.railLabel}>{key[0]!.toUpperCase() + key.slice(1)}</span>
          </button>
        ))}
        <span className={styles.railSpacer} />
        <button type="button" className={`${styles.railButton} ${styles.railAction}`} onClick={() => setSheet({ type: 'bind' })}>
          <RailIcon name="bind" />
          <span className={styles.railLabel}>Bind</span>
        </button>
        <button type="button" className={`${styles.railButton} ${styles.railAction}`} onClick={openPractice}>
          <RailIcon name="practice" />
          <span className={styles.railLabel}>Practice</span>
        </button>
      </nav>

      {/* ============ Explorer ============ */}
      <aside className={styles.explorer} style={explorerVisible ? undefined : { display: 'none' }}>
        <div className={styles.explorerHead}>
          <span className={styles.explorerName}><GlyphBook size={14} /> Loom Workspace</span>
          <button
            type="button"
            className={styles.collapseAll}
            aria-label="Collapse all sections"
            onClick={() => setCollapsed({ projects: true, outline: true, timeline: true, principles: true })}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
              <path d="M2.5 4.5h9M2.5 7h9M2.5 9.5h9" />
            </svg>
          </button>
        </div>

        <section className={`${styles.explorerSection} ${collapsed.projects ? styles.sectionCollapsed : ''}`} style={{ maxHeight: collapsed.projects ? undefined : '38vh' }}>
          <button type="button" className={styles.sectionHeader} onClick={() => setCollapsed((current) => ({ ...current, projects: !current.projects }))}>
            <GlyphChevron collapsed={!!collapsed.projects} />
            <span>PROJECTS</span>
            <span className={styles.sectionCount}>{cases.length}</span>
          </button>
          {!collapsed.projects && (
            <div className={styles.sectionBody}>
              {cases.map((item) => {
                const itemEntries = deriveEntries(item);
                const itemPositions = openPositions(itemEntries).length;
                const state = deriveState(itemEntries);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.projectRow} ${item.id === selectedCase.id ? styles.projectRowActive : ''}`}
                    onClick={() => openProject(item.id)}
                  >
                    <span className={styles.projectTitle}>{item.title}</span>
                    <span className={styles.projectMeta}>
                      {state}
                      {itemPositions > 0 && <span className={styles.projectOpen}> · {itemPositions} open</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${styles.explorerSection} ${styles.outlineSection} ${collapsed.outline ? styles.sectionCollapsed : ''}`}>
          <button type="button" className={styles.sectionHeader} onClick={() => setCollapsed((current) => ({ ...current, outline: !current.outline }))}>
            <GlyphChevron collapsed={!!collapsed.outline} />
            <span>OUTLINE</span>
            <span className={styles.sectionCount}>{ordered.length}</span>
          </button>
          {!collapsed.outline && (
            <div className={styles.sectionBody}>
              {ordered.map((entry) => {
                const gapAfter = entry.page !== null ? gaps.find((gap) => gap.from === entry.page! + 1) : undefined;
                return (
                  <span key={entry.id}>
                    <button
                      type="button"
                      className={`${styles.outlineRow} ${selectedBlockID === entry.id ? styles.outlineRowSelected : ''}`}
                      onClick={() => revealBlock(entry.id)}
                    >
                      <span className={styles.outlineText}>{entry.text}</span>
                      <span className={styles.outlinePage}>{entry.page !== null ? `p.${entry.page}` : '·'}</span>
                    </button>
                    {gapAfter && (
                      <button
                        type="button"
                        className={styles.gapRow}
                        onClick={() => revealSource({ sourceAnchor: `${sourceLabel}, page ${gapAfter.from}`, page: gapAfter.from })}
                      >
                        p.{gapAfter.from}–{gapAfter.to} unread
                      </button>
                    )}
                  </span>
                );
              })}
              {ordered.length === 0 && <p className={styles.sectionEmpty}>Nothing captured yet.</p>}
            </div>
          )}
        </section>

        <section className={styles.explorerSection}>
          <button type="button" className={styles.sectionHeader} onClick={() => setCollapsed((current) => ({ ...current, timeline: !current.timeline }))}>
            <GlyphChevron collapsed={!!collapsed.timeline} />
            <span>TIMELINE</span>
            <span className={styles.sectionCount}>{secondPass || boundaries.firstPassEnd < boundaries.total ? '2 passes' : '1 pass'}</span>
          </button>
          {!collapsed.timeline && (
            <TimelineInstrument
              total={boundaries.total}
              firstPassEnd={boundaries.firstPassEnd}
              value={timeTravel}
              stamp={commitStamp(travelled[travelled.length - 1]?.createdAtMs ?? null)}
              onChange={(value) => setTimeTravel(value)}
            />
          )}
        </section>

        <section className={`${styles.explorerSection} ${collapsed.principles ? styles.sectionCollapsed : ''}`} style={{ maxHeight: collapsed.principles ? undefined : '38vh' }}>
          <button type="button" className={styles.sectionHeader} onClick={() => setCollapsed((current) => ({ ...current, principles: !current.principles }))}>
            <GlyphChevron collapsed={!!collapsed.principles} />
            <span>PRINCIPLES</span>
            <span className={styles.sectionCount}>{cases.reduce((sum, item) => sum + deriveEntries(item).filter((entry) => entry.kind === 'principle').length, 0)}</span>
          </button>
          {!collapsed.principles && (
            <div className={styles.sectionBody}>
              {cases.flatMap((item) =>
                deriveEntries(item)
                  .filter((entry) => entry.kind === 'principle')
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={styles.principleRow}
                      onClick={() => { openProject(item.id); window.setTimeout(() => revealBlock(entry.id), 80); }}
                    >
                      <span className={styles.principleText}>{entry.text}</span>
                      <span className={styles.principleMeta}>
                        {entry.page !== null ? `p.${entry.page} · ` : ''}candidate
                      </span>
                    </button>
                  )),
              )}
              {cases.every((item) => deriveEntries(item).every((entry) => entry.kind !== 'principle')) && (
                <p className={styles.sectionEmpty}>Principles you promote gather here, across every project.</p>
              )}
            </div>
          )}
        </section>

        <div
          className={`${styles.explorerResizer} ${resizing ? styles.explorerResizing : ''}`}
          onPointerDown={(event) => { event.preventDefault(); setResizing(true); }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize explorer"
        />
      </aside>

      {/* ============ Center ============ */}
      <main className={styles.center}>
        {isPractice ? (
          <div className={styles.practiceGround}>
            <div className={styles.armedStrip}>
              <span className={styles.armedLabel}>ARMED</span>
              <span className={styles.armedHint}>choose principles via ⌘P #</span>
              <span className={styles.armedFill} />
              <button type="button" className={styles.ghostButton} onClick={() => setTransient('sealing arrives with the practice bridge')}>Seal run</button>
            </div>
            <div className={styles.groundEmpty}>
              <p className={styles.emptyHint}>The practice ground mounts here — from a code block&apos;s “Open in practice ↗” or this tab.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.docWrap}>
              <div className={styles.docScroll} ref={docScrollRef}>
                <div className={`${styles.docBand} ${travelling ? styles.docBandTravelled : ''}`}>
                  <span className={styles.docProject}>{documentTitle}</span>
                  <span className={styles.docState}>{derivedState}{secondPass ? ' — pass 2' : ''}</span>
                  {locus?.chapter && (
                    <span className={styles.docLocus}>
                      <span className={styles.docSep}>›</span>
                      <span className={styles.docChapter}>{locus.chapter}</span>
                      {locus.page !== null && (
                        <>
                          <span className={styles.docSep}>›</span>
                          <button type="button" className={styles.docPage} onClick={() => revealSource({ sourceAnchor: `${sourceLabel}, page ${locus.page}`, page: locus.page })}>
                            p.{locus.page}
                          </button>
                        </>
                      )}
                    </span>
                  )}
                  {lens === 'distill' && (
                    <button type="button" className={`${styles.recallPill} ${recall ? styles.recallPillOn : ''}`} onClick={() => setRecall((value) => !value)}>
                      recall
                    </button>
                  )}
                  {derivedState === 'Reading' && !secondPass && (
                    <button type="button" className={styles.secondPassGhost} onClick={startSecondPass}>Start second pass →</button>
                  )}
                  {travelling && (
                    <span className={styles.travelNote}>
                      viewing as of commit {timeTravel}
                      <button type="button" className={styles.returnPresent} onClick={() => setTimeTravel(null)}>Return to present</button>
                    </span>
                  )}
                  <span className={styles.docBandFill} />
                  <button type="button" className={styles.findAffordance} aria-label="Find (⌘F)" onClick={() => setFindOpen(true)}>
                    <GlyphSearch size={12} />
                  </button>
                </div>

                <article className={styles.manuscript}>
                  {/* Head-matter */}
                  <div className={styles.blockRow}>
                    <span />
                    <div className={styles.headMatter}>
                      <h1 className={styles.docTitle}>
                        {documentTitle}
                        <button type="button" className={styles.titleMore} aria-label="Document actions" onClick={() => setTitleMenuOpen((open) => !open)}>⋯</button>
                      </h1>
                      {titleMenuOpen && (
                        <div className={styles.titleMenu} role="menu">
                          <button type="button" role="menuitem" onClick={() => { setTitleMenuOpen(false); setTransient('renaming signs a project-title record in-app'); }}>Rename</button>
                          <button type="button" role="menuitem" onClick={() => { setTitleMenuOpen(false); setTransient(`${selectedCase.sources.length || 1} source${selectedCase.sources.length === 1 ? '' : 's'} — claims route by file identity`); }}>Sources…</button>
                          <button type="button" role="menuitem" onClick={() => { setTitleMenuOpen(false); setSheet({ type: 'bind' }); }}>Bind &amp; export</button>
                        </div>
                      )}
                      <p className={styles.provenanceLine}>
                        {Math.max(selectedCase.sources.length, 1)} source{selectedCase.sources.length === 1 ? '' : 's'} · {travelled.length} trace{travelled.length === 1 ? '' : 's'} · {anchoredCount}/{travelled.length} page-anchored · updated {selectedCase.updatedAt}
                      </p>
                      {capturedPages.length > 0 && (
                        <p className={styles.scopeLine}>
                          Covers p.{capturedPages[0]}–p.{capturedPages[capturedPages.length - 1]} of {sourceLabel}.
                        </p>
                      )}
                      {capturedPages.length > 0 && (
                        <div className={styles.coverage}>
                          <span className={styles.coverageLabel}>{sourceLabel} · coverage unknown — {capturedPages.length} page{capturedPages.length === 1 ? '' : 's'} seen</span>
                          <div className={styles.coverageTrackDegraded}>
                            {capturedPages.map((page) => (
                              <button
                                key={page}
                                type="button"
                                className={`${styles.coverageTick} ${locus?.page === page ? styles.coverageTickCurrent : ''}`}
                                title={`p.${page} · ${travelled.filter((entry) => entry.page === page).length} trace${travelled.filter((entry) => entry.page === page).length === 1 ? '' : 's'}`}
                                onClick={() => revealSource({ sourceAnchor: `${sourceLabel}, page ${page}`, page })}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <hr className={styles.closingRule} />
                    </div>
                  </div>

                  {/* Chapters + blocks */}
                  {rows.map((row) => {
                    if (row.rowType === 'chapter') {
                      const named = !/^p\.\d/.test(row.chapter.title);
                      return (
                        <div key={row.key} className={styles.blockRow} ref={registerBlock(row.key)}>
                          <span />
                          <h2 className={styles.chapterHead}>
                            <span className={styles.chapterNo}>§{row.chapter.index}</span>
                            <span className={named ? styles.chapterNamed : styles.chapterAuto}>{row.chapter.title}</span>
                          </h2>
                        </div>
                      );
                    }

                    if (row.rowType === 'spread') {
                      const quote = row.quote;
                      const words = quote.text.split(/\s+/).length;
                      const isData = quote.focus.includes('data');
                      const showWhisper =
                        row.meanings.length === 0 &&
                        travelled.every((entry) => !['meaning', 'correction', 'question', 'principle'].includes(entry.kind));
                      return (
                        <div key={row.key} className={`${styles.blockRow} ${styles.spreadRow}`}>
                          <span className={styles.marginCell}>{anchorChip(quote)}</span>
                          <div className={styles.spreadStack}>
                            <div
                              ref={registerBlock(quote.id)}
                              id={`wb-entry-${quote.id}`}
                              className={`${styles.evidenceCard} ${quote.id === caughtID ? styles.flash : ''} ${dimForWeakFilter(quote) ? styles.dimmed : ''}`}
                              onClick={() => { setSelectedBlockID(quote.id); setEvidenceOpen(true); }}
                            >
                              {selRule(quote.id)}
                              <blockquote className={isData ? styles.quoteData : words <= 6 ? styles.quoteHeadword : styles.quoteBody}>
                                {quote.text}
                              </blockquote>
                              {showWhisper && <p className={styles.whisper}>Explain it in your own words.</p>}
                            </div>
                            {row.meanings.map((meaning) => meaningBody(meaning, true))}
                          </div>
                        </div>
                      );
                    }

                    const entry = row.entry;
                    if (entry.kind === 'meaning') {
                      return (
                        <div key={row.key} className={styles.blockRow}>
                          <span className={styles.marginCell} />
                          {meaningBody(entry, false)}
                        </div>
                      );
                    }
                    if (entry.kind === 'correction') {
                      return (
                        <div key={row.key} className={styles.blockRow}>
                          <span className={styles.marginCell} />
                          <div
                            ref={registerBlock(entry.id)}
                            id={`wb-entry-${entry.id}`}
                            className={`${styles.textCell} ${styles.revision} ${entry.id === caughtID ? styles.flash : ''}`}
                            onClick={() => { setSelectedBlockID(entry.id); setEvidenceOpen(true); }}
                          >
                            {selRule(entry.id)}
                            {entry.supersededText && <p className={styles.struck}>{entry.supersededText}</p>}
                            <p className={styles.ownedProse}>
                              {entry.text}
                              {entry.page !== null && (
                                <button type="button" className={styles.trailingAnchor} onClick={(event) => { event.stopPropagation(); revealSource(entry); }}>
                                  {' '}p.{entry.page} ↗
                                </button>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (entry.kind === 'question') {
                      const age = ageLabel(entry.createdAtMs);
                      return (
                        <div key={row.key} className={styles.blockRow}>
                          <span className={styles.marginCell} />
                          <div
                            ref={registerBlock(entry.id)}
                            id={`wb-entry-${entry.id}`}
                            className={`${styles.textCell} ${styles.questionOpen} ${entry.id === caughtID ? styles.flash : ''}`}
                            onClick={() => { setSelectedBlockID(entry.id); setEvidenceOpen(true); }}
                          >
                            {selRule(entry.id)}
                            <p className={styles.questionLabel}>OPEN{age ? ` · ${age}` : ''}</p>
                            <p className={styles.ownedProse}>{entry.text.replace(/closes when:[\s\S]*$/i, '').trim()}</p>
                            <p className={styles.questionCondition}>
                              {entry.openCondition ? `Open — closes when: ${entry.openCondition}` : 'Open — no close condition set.'}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* Back-matter */}
                  {conclusions.length > 0 && (
                    <div className={styles.blockRow}>
                      <span />
                      <section>
                        <h2 className={styles.chapterHead}>
                          <span className={styles.chapterNo}>§</span>
                          <span className={styles.chapterNamed}>Conclusions</span>
                        </h2>
                        <ol className={styles.conclusionList}>
                          {conclusions.map((entry, index) => (
                            <li
                              key={entry.id}
                              id={`wb-entry-${entry.id}`}
                              ref={registerBlock(entry.id) as never}
                              className={`${styles.conclusionRow} ${entry.id === caughtID ? styles.flash : ''}`}
                              onClick={() => { setSelectedBlockID(entry.id); setEvidenceOpen(true); }}
                            >
                              {selRule(entry.id)}
                              <span className={styles.conclusionMark}>§{index + 1}</span>
                              <span className={styles.conclusionText}>
                                {entry.text}
                                <button
                                  type="button"
                                  className={styles.promoteGhost}
                                  onClick={(event) => { event.stopPropagation(); setSheet({ type: 'gate', statement: entry.text }); setHoldsWithin(''); }}
                                >
                                  Promote ↑
                                </button>
                              </span>
                            </li>
                          ))}
                        </ol>
                      </section>
                    </div>
                  )}

                  {positions.length > 0 && (
                    <div className={styles.blockRow}>
                      <span />
                      <section>
                        <h2 className={styles.chapterHead}>
                          <span className={styles.chapterNo}>§</span>
                          <span className={styles.chapterNamed}>Open Positions</span>
                        </h2>
                        {positions.map((entry) => (
                          <button key={entry.id} type="button" className={styles.positionRow} onClick={() => revealBlock(entry.id)}>
                            <span className={styles.positionDot} />
                            <span className={styles.positionText}>{entry.text.replace(/closes when:[\s\S]*$/i, '').trim()}</span>
                            <span className={styles.positionMeta}>
                              {ageLabel(entry.createdAtMs) ?? ''}{entry.page !== null ? ` · p.${entry.page} ↗` : ''}
                            </span>
                          </button>
                        ))}
                      </section>
                    </div>
                  )}

                  <div className={styles.blockRow}>
                    <span />
                    <section>
                      <h2 className={styles.chapterHead}>
                        <span className={styles.chapterNo}>§</span>
                        <span className={styles.chapterNamed}>Bindings</span>
                      </h2>
                      <p className={styles.bindingsEmpty}>Nothing bound yet — Bind freezes this book as evidence.</p>
                    </section>
                  </div>

                  {rows.length === 0 && (
                    <div className={styles.emptyManuscript}>
                      <p className={styles.emptyHint}>Capture something with ⌘⇧U — it files here, at its page.</p>
                    </div>
                  )}
                </article>
              </div>

              {/* Overview ruler */}
              <div className={styles.overviewRuler} aria-hidden="true">
                <span className={styles.rulerViewport} style={{ top: `${viewportBand.top * 100}%`, height: `${Math.max(viewportBand.height * 100, 2)}%` }} />
                {rulerMarks.map((mark) => (
                  <button
                    key={mark.id}
                    type="button"
                    tabIndex={-1}
                    className={
                      mark.kind === 'chapter' ? styles.rulerChapter : mark.kind === 'attention' ? styles.rulerAttention : styles.rulerEvidence
                    }
                    style={{ top: `${mark.top * 100}%` }}
                    onClick={() => { if (!mark.id.startsWith('ch-')) revealBlock(mark.id); }}
                  />
                ))}
              </div>

              {findOpen && (
                <div className={styles.findBar}>
                  <input
                    autoFocus
                    value={findQuery}
                    placeholder="Find in manuscript"
                    onChange={(event) => { setFindQuery(event.target.value); setFindIndex(0); }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (findMatches.length === 0) return;
                        const next = event.shiftKey
                          ? (findIndex - 1 + findMatches.length) % findMatches.length
                          : (findIndex + 1) % findMatches.length;
                        setFindIndex(next);
                        const id = findMatches[next]!;
                        setCaughtID(id);
                        blockRefs.current.get(id)?.scrollIntoView({ block: 'center' });
                      }
                      if (event.key === 'Escape') setFindOpen(false);
                    }}
                    aria-label="Find in manuscript"
                  />
                  <span className={styles.findCount}>
                    {findMatches.length > 0 ? `${Math.min(findIndex + 1, findMatches.length)} of ${findMatches.length}` : findQuery ? '0 of 0' : ''}
                  </span>
                </div>
              )}

              {filedPill && (
                <button
                  type="button"
                  className={styles.filedPill}
                  onClick={() => {
                    revealBlock(filedPill.entryID, { push: true });
                    setFiledPill(null);
                  }}
                >
                  ↓ filed at {filedPill.page !== null ? `p.${filedPill.page}` : 'end matter'}
                </button>
              )}
            </div>

            {/* Composer */}
            <form
              className={`${styles.composer} ${travelling ? styles.composerDisabled : ''}`}
              onSubmit={(event) => { event.preventDefault(); submit(); }}
            >
              <div className={styles.composerInner}>
                <div className={styles.composerTarget}>
                  {KIND_CHIPS.map((focus) => (
                    <button
                      key={focus}
                      type="button"
                      className={`${styles.kindChip} ${litFocus === focus ? styles.kindChipLit : ''}`}
                      onClick={() => setExplicitFocus(focus)}
                    >
                      {focus[0]!.toUpperCase() + focus.slice(1)}
                    </button>
                  ))}
                  {anchorEntry ? (
                    <span className={styles.anchorContext}>
                      ⌁ {anchorEntry.page !== null ? `p.${anchorEntry.page}` : 'end matter'} · “{anchorEntry.text.split(/\s+/).slice(0, 4).join(' ')}{anchorEntry.text.split(/\s+/).length > 4 ? '…' : ''}”
                      <button type="button" aria-label="Clear anchor" onClick={() => setAnchorEntryID(null)}>×</button>
                    </span>
                  ) : (
                    <span className={styles.anchorUnanchored}>unanchored</span>
                  )}
                  {litFocus === 'principle' && (
                    <button type="button" className={styles.promoteInline} onClick={() => { setSheet({ type: 'gate', statement: draft.trim() }); setHoldsWithin(''); }}>
                      Promote ↑
                    </button>
                  )}
                </div>
                <div className={styles.composerInputWrap}>
                  <textarea
                    ref={composerRef}
                    className={styles.composerInput}
                    value={draft}
                    disabled={travelling}
                    placeholder="Note what this means — ⌘⏎ commits"
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
                    type="submit"
                    className={`${styles.commitButton} ${draft.trim() ? styles.commitArmed : ''}`}
                    disabled={draft.trim().length === 0 || travelling}
                    aria-label="Commit (⌘⏎)"
                  >
                    <GlyphCommit />
                  </button>
                </div>
                {draft.trim().length > 0 && !travelling && (
                  <p className={styles.microline}>
                    ⌘⏎ files as {litFocus} {anchorEntry ? `under ${anchorEntry.page !== null ? `p.${anchorEntry.page}` : 'its anchor'}` : '· unanchored — end matter'}
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </main>

      {/* ============ Evidence pane ============ */}
      {evidenceOpen && (
        <aside className={styles.evidencePane} aria-label="Evidence">
          <div className={styles.evidenceHeader}>
            {(['provenance', 'details', 'chain'] as EvidenceChannel[]).map((channel) => (
              <button
                key={channel}
                type="button"
                className={`${styles.channelTab} ${evidenceChannel === channel ? styles.channelTabActive : ''}`}
                onClick={() => setEvidenceChannel(channel)}
              >
                {channel.toUpperCase()}
              </button>
            ))}
            <span className={styles.evidenceFill} />
            <button type="button" className={styles.evidenceClose} aria-label="Close evidence" onClick={() => { setEvidenceOpen(false); setSelectedBlockID(null); }}>×</button>
          </div>
          {!selectedEntry ? (
            <p className={styles.evidenceEmpty}>Select a block to read its provenance.</p>
          ) : evidenceChannel === 'provenance' ? (
            <div className={styles.evidenceBody}>
              <p className={styles.provenanceSentence}>
                Captured from {selectedEntry.sourceAnchor.replace(/, page \d+$/i, '')}
                {selectedEntry.page !== null ? `, page ${selectedEntry.page}` : ''}
                {selectedEntry.sequence < boundaries.firstPassEnd ? ', during pass 1' : ', during pass 2'} —{' '}
                {selectedEntry.isWeakAnchor
                  ? <>anchored to <span className={styles.windowOnly}>the window only</span>.</>
                  : selectedEntry.page !== null ? 'anchored to the page.' : 'committed as end matter.'}
              </p>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.ghostButton} onClick={() => revealSource(selectedEntry)}>Reveal ⏎</button>
                <button type="button" className={styles.ghostButton} onClick={() => citeIntoComposer(selectedEntry.id)}>Cite ⌘⏎</button>
                <button type="button" className={styles.ghostButton} onClick={() => reviseSelection(selectedEntry.id)}>Revise c</button>
                {selectedEntry.kind === 'question' && (
                  <button type="button" className={styles.ghostButton} onClick={() => setSheet({ type: 'close', entryID: selectedEntry.id })}>Close position</button>
                )}
              </div>
            </div>
          ) : evidenceChannel === 'details' ? (
            <div className={styles.evidenceBody}>
              {[
                ['anchor precision', selectedEntry.isWeakAnchor ? 'window' : selectedEntry.page !== null ? 'page' : 'none'],
                ['sequence', String(selectedEntry.sequence)],
                ['committed', commitStamp(selectedEntry.createdAtMs) ?? 'unknown'],
                ['kind', selectedEntry.kind],
                ['focus', selectedEntry.focus],
                ['source', selectedEntry.sourceAnchor],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{label}</span>
                  <span className={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.evidenceBody}>
              {selectedEntry.supersededText ? (
                <div className={styles.chain}>
                  <div className={styles.chainNode}>
                    <span className={`${styles.chainDot} ${styles.chainDotCurrent}`} />
                    <p className={styles.chainText}>{selectedEntry.text}</p>
                    {commitStamp(selectedEntry.createdAtMs) && <span className={styles.chainStamp}>{commitStamp(selectedEntry.createdAtMs)}</span>}
                  </div>
                  <div className={styles.chainNode}>
                    <span className={styles.chainDot} />
                    <p className={`${styles.chainText} ${styles.chainStruck}`}>{selectedEntry.supersededText}</p>
                  </div>
                </div>
              ) : (
                <p className={styles.evidenceEmpty}>No revisions on this block.</p>
              )}
            </div>
          )}
        </aside>
      )}

      {/* ============ Status bar ============ */}
      <footer className={styles.statusBar}>
        <button type="button" className={styles.instrument} onClick={() => setStatusPopover((current) => (current === 'capture' ? null : 'capture'))}>
          <span className={styles.dot} style={{ background: isMirror ? '#4bc5de' : '#d9a03f' }} />
          {isMirror ? '⌘⇧U ready' : 'capture offline — repair'}
        </button>
        <button
          type="button"
          className={`${styles.instrument} ${weakFilter ? styles.instrumentActive : ''}`}
          onClick={() => setWeakFilter((value) => !value)}
        >
          <span className={styles.dot} style={{ background: weakCount === 0 && anchoredCount > 0 ? '#4bc5de' : '#d9a03f' }} />
          {anchoredCount}/{travelled.length} page-precise
        </button>
        <button type="button" className={styles.instrument} onClick={() => setCollapsed((current) => ({ ...current, timeline: false }))}>
          today {pulse.captures} captures · {pulse.meanings} meanings
        </button>
        <button type="button" className={styles.instrument} onClick={cycleOpenPosition}>
          <span style={{ color: positions.length > 0 ? '#d9a03f' : undefined }}>{positions.length} open</span>
        </button>
        <span className={styles.statusFill} />
        <button type="button" className={styles.instrument} onClick={() => setStatusPopover((current) => (current === 'store' ? null : 'store'))}>
          {isMirror ? 'mirrored' : 'demo store'}
        </button>
        <span className={styles.transient}>{transient}</span>

        {statusPopover === 'capture' && (
          <div className={`${styles.popover} ${styles.capturePopover}`}>
            <p className={styles.popoverLine}>{isMirror ? 'helper: connected · anchors graded live' : 'browser mode — the capture chain lives in the Loom app'}</p>
            <button type="button" className={styles.ghostButton} onClick={() => { setStatusPopover(null); setTransient(isMirror ? 'helper restarted' : 'open the Loom app to repair capture'); }}>Restart helper</button>
          </div>
        )}
        {statusPopover === 'store' && (
          <div className={`${styles.popover} ${styles.storePopover}`}>
            <p className={styles.popoverPath}>{isMirror ? 'loom://native/reflection-workspace-snapshot.json' : 'Demo — nothing is saved.'}</p>
            {isMirror && (
              <button type="button" className={styles.popoverRowButton} onClick={() => { setStatusPopover(null); setTransient('Reveal in Finder works inside the Loom app'); }}>
                Reveal in Finder
              </button>
            )}
          </div>
        )}
      </footer>

      {/* ============ Palette ============ */}
      {paletteOpen && (
        <div className={styles.paletteScrim} role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <div className={styles.palette} role="dialog" aria-label="Quick open" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.paletteInputRow}>
              <GlyphSearch size={16} />
              <input
                autoFocus
                value={paletteQuery}
                placeholder="Search — @ entries · # principles · > actions · :page · ? open"
                onChange={(event) => { setPaletteQuery(event.target.value); setPaletteActive(0); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); setPaletteActive((current) => Math.min(current + 1, paletteRows.length - 1)); }
                  if (event.key === 'ArrowUp') { event.preventDefault(); setPaletteActive((current) => Math.max(current - 1, 0)); }
                  if (event.key === 'Enter' && paletteRows[paletteActive]) paletteRows[paletteActive]!.run();
                }}
                aria-label="Quick open"
              />
            </div>
            <div className={styles.paletteList}>
              {paletteRows.map((row, index) => (
                <button
                  key={row.key}
                  type="button"
                  className={`${styles.paletteRow} ${index === paletteActive ? styles.paletteRowSelected : ''}`}
                  onMouseEnter={() => setPaletteActive(index)}
                  onClick={row.run}
                >
                  <span className={styles.paletteTag}>{row.tag}</span>
                  <span className={styles.paletteTitle}>{row.title}</span>
                  <span className={styles.paletteDetail}>{row.detail}</span>
                </button>
              ))}
              {paletteRows.length === 0 && <p className={styles.paletteNone}>No matches.</p>}
            </div>
            <div className={styles.paletteFooter}>@ entries · # principles · &gt; actions · :page · ? open</div>
          </div>
        </div>
      )}

      {/* ============ Sheets — one anatomy, four uses ============ */}
      {sheet && (
        <div className={styles.sheetScrim} role="presentation" onMouseDown={() => setSheet(null)}>
          <div className={styles.sheetPanel} role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            {sheet.type === 'bind' && (
              <>
                <h3 className={styles.sheetTitle}>Bind this project</h3>
                <p className={styles.sheetBody}>Freezes the current manuscript as a numbered binding and exports a snapshot.</p>
                {weakCount > 0 && (
                  <p className={styles.honestyLine}>
                    {weakCount} anchor{weakCount === 1 ? ' is' : 's are'} window-precision — {weakCount === 1 ? 'it' : 'they'} will be labeled in the export.
                  </p>
                )}
                <div className={styles.sheetFooter}>
                  <button type="button" className={styles.ghostButton} onClick={() => setSheet(null)}>Cancel</button>
                  <button type="button" className={styles.primaryButton} onClick={bindExport}>Bind &amp; export</button>
                </div>
              </>
            )}
            {sheet.type === 'gate' && (
              <>
                <h3 className={styles.sheetTitle}>Promote to principle</h3>
                <p className={styles.gateStatement}>{sheet.statement || 'State the principle in your own words first.'}</p>
                <label className={styles.gateLabel}>
                  Holds within
                  <input
                    className={styles.gateInput}
                    value={holdsWithin}
                    placeholder="market making · limit order books"
                    onChange={(event) => setHoldsWithin(event.target.value)}
                  />
                </label>
                {anchorEntry && <p className={styles.gateCitation}>cites {anchorEntry.sourceAnchor}</p>}
                <div className={styles.sheetFooter}>
                  <button type="button" className={styles.ghostButton} onClick={() => setSheet(null)}>Cancel</button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!holdsWithin.trim() || !sheet.statement}
                    onClick={() => { setSheet(null); setTransient('signed promotion lands with the native gate (M2)'); }}
                  >
                    Sign &amp; promote
                  </button>
                </div>
              </>
            )}
            {sheet.type === 'close' && (() => {
              const question = entryByID.get(sheet.entryID);
              const candidates = travelled.filter((entry) => entry.id !== sheet.entryID && ['meaning', 'capture', 'principle'].includes(entry.kind)).slice(-6);
              return (
                <>
                  <h3 className={styles.sheetTitle}>Close this position</h3>
                  {question && <p className={styles.sheetBody}>{question.text.replace(/closes when:[\s\S]*$/i, '').trim()}</p>}
                  <div className={styles.closeList}>
                    {candidates.map((entry) => (
                      <button key={entry.id} type="button" className={styles.closeRow} onClick={() => { setSheet(null); setTransient('signed closures land with the native bridge (M2)'); }}>
                        <span className={styles.closeExcerpt}>{entry.text}</span>
                        <span className={styles.closeAnchor}>{entry.page !== null ? `p.${entry.page}` : '·'}</span>
                      </button>
                    ))}
                    <button type="button" className={styles.closeRow} onClick={() => { setSheet(null); setTransient('signed closures land with the native bridge (M2)'); }}>
                      <span className={styles.closeExcerpt}>closed without a specific block</span>
                    </button>
                  </div>
                  <div className={styles.sheetFooter}>
                    <button type="button" className={styles.ghostButton} onClick={() => setSheet(null)}>Cancel</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TIMELINE — a drawn instrument, never <input type=range>.

function TimelineInstrument({
  total,
  firstPassEnd,
  value,
  stamp,
  onChange,
}: {
  total: number;
  firstPassEnd: number;
  value: number | null;
  stamp: string | null;
  onChange: (value: number | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const position = total === 0 ? 1 : (value ?? total) / total;
  const travelled = value !== null && value < total;

  const valueFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || total === 0) return null;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const snapped = Math.round(ratio * total);
    return snapped >= total ? null : snapped;
  }, [total]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => onChange(valueFromEvent(event.clientX));
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, onChange, valueFromEvent]);

  const passTicks = firstPassEnd > 0 && firstPassEnd < total ? [{ at: firstPassEnd / total, label: 'p1' }] : [];

  return (
    <div className={styles.timeline}>
      <div
        ref={trackRef}
        className={styles.timelineTrack}
        onPointerDown={(event) => { setDragging(true); onChange(valueFromEvent(event.clientX)); }}
      >
        <span className={styles.timelineElapsed} style={{ width: `${position * 100}%` }} />
        {passTicks.map((tick) => (
          <span key={tick.label} className={`${styles.passTick} ${position >= tick.at ? styles.passTickPassed : ''}`} style={{ left: `${tick.at * 100}%` }}>
            <span className={styles.passLabel}>{tick.label}</span>
          </span>
        ))}
        <span
          role="slider"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={value ?? total}
          aria-label="Time travel"
          tabIndex={0}
          className={`${styles.playhead} ${dragging ? styles.playheadDragging : ''}`}
          style={{ left: `${position * 100}%` }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); onChange(Math.max(0, (value ?? total) - 1)); }
            if (event.key === 'ArrowRight') { event.preventDefault(); const next = (value ?? total) + 1; onChange(next >= total ? null : next); }
          }}
        />
      </div>
      <p className={`${styles.timelineReadout} ${travelled ? styles.timelineReadoutTravelled : ''}`}>
        {value === null ? `now · ${total} of ${total}` : `commit ${value} of ${total}`}
        {stamp ? ` · ${stamp}` : ''}
      </p>
    </div>
  );
}
