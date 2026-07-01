'use client';

import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Folder,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import styles from './ReflectionWorkspace.module.css';
import { UnderstandingSpine } from './UnderstandingSpine';
import type { ReflectionCase, ReflectionSource, UnderstandingVersion } from './reflectionModel';
import {
  INITIAL_CASES,
  WORKFLOW_BY_KEY,
  auditValue,
  cloneCase,
  commitTargetForCase,
  currentEvidenceVersion,
  fileToReflectionSource,
  formatLearningCommit,
  groundingRowsForVersion,
  isNativePrimarySource,
  latestLearningAnchor,
  makeBlankReflectionCase,
  sourceForVersion,
  understandingVersionsFromCase,
  versionForSource,
} from './reflectionModel';
import type { LearningCommitFocus } from './reflectionModel';

type InspectorTarget = 'version' | 'source';
type LoomOpenSourceBridge = { postMessage: (payload: unknown) => void };
type ReflectionBridgeWindow = Window & {
  webkit?: {
    messageHandlers?: {
      loomOpenReflectionSource?: LoomOpenSourceBridge;
    };
  };
};

function sourceTone(kind?: string) {
  const normalized = kind?.toLowerCase().replace(/^\./, '') ?? '';
  if (/(^|[-/])pdf$/.test(normalized) || normalized.includes('pdf')) return 'pdf';
  if (/(^|[-/])(xls|xlsx|csv|tsv|numbers)$/.test(normalized)) return 'spreadsheet';
  if (normalized.includes('spreadsheet') || normalized.includes('excel')) return 'spreadsheet';
  if (/(^|[-/])(ppt|pptx|keynote)$/.test(normalized)) return 'presentation';
  if (normalized.includes('presentation') || normalized.includes('slide')) return 'presentation';
  if (/(^|[-/])(doc|docx|pages|rtf|rtfd)$/.test(normalized)) return 'document';
  if (normalized.includes('document') || normalized.includes('word')) return 'document';
  return 'source';
}

function FileBadge({ kind }: { kind?: string }) {
  const tone = sourceTone(kind);
  const label = tone === 'pdf' ? 'PDF' : '';

  return (
    <span className={styles.fileBadge} data-kind={tone} aria-hidden="true">
      {tone === 'document' ? <span className={styles.fileBadgeLines} /> : null}
      {tone === 'spreadsheet' ? <span className={styles.fileBadgeGrid} /> : null}
      {tone === 'presentation' ? <span className={styles.fileBadgeSlide} /> : null}
      {tone === 'source' ? <span className={styles.fileBadgeLines} /> : null}
      {label ? <span className={styles.fileBadgeText}>{label}</span> : null}
    </span>
  );
}

function caseFileKind(reflectionCase: ReflectionCase) {
  return reflectionCase.sources.find((source) => sourceTone(source.kind) !== 'source')?.kind ?? null;
}

function CaseGlyph({ reflectionCase }: { reflectionCase: ReflectionCase }) {
  const fileKind = caseFileKind(reflectionCase);

  if (fileKind) {
    return <FileBadge kind={fileKind} />;
  }

  return <MessageSquare size={15} />;
}

function caseSubLabel(reflectionCase: ReflectionCase) {
  if (reflectionCase.project === 'Learning pass') return null;
  return reflectionCase.project;
}

function caseTimeLabel(reflectionCase: ReflectionCase) {
  if (reflectionCase.project === 'Learning pass' && reflectionCase.updatedAt === 'learning') return null;
  return reflectionCase.updatedAt;
}

function openSourceBridge() {
  if (typeof window === 'undefined') return null;
  return (window as ReflectionBridgeWindow).webkit?.messageHandlers?.loomOpenReflectionSource ?? null;
}

function sourceOpenPayload(source: ReflectionSource) {
  return {
    id: source.id,
    label: source.label,
    kind: source.kind,
    meta: source.meta,
    folder: source.folder,
  };
}

function sourceCanOpen(source: ReflectionSource | null, hasNativeBridge: boolean) {
  return Boolean(source?.localPreviewUrl || hasNativeBridge);
}

function evidenceSourceFor(
  reflectionCase: ReflectionCase,
  version: UnderstandingVersion | null,
  activeSource: ReflectionSource | null,
  inspectorTarget: InspectorTarget,
) {
  if (inspectorTarget === 'source') return activeSource;

  const matchedSource = sourceForVersion(reflectionCase.sources, version);
  if (matchedSource) return matchedSource;

  if (reflectionCase.project === 'Learning pass' && reflectionCase.sources.length === 1) {
    return reflectionCase.sources[0] ?? activeSource;
  }

  return null;
}

function SourceOpenButton({
  source,
  canOpen,
  onOpenSource,
}: {
  source: ReflectionSource | null;
  canOpen: boolean;
  onOpenSource: (source: ReflectionSource) => void;
}) {
  const title = source
    ? canOpen
      ? `Open ${source.label} in the source app`
      : 'Open source is available when Loom has a native file handle'
    : 'No source selected';

  return (
    <button
      type="button"
      disabled={!source || !canOpen}
      onClick={() => {
        if (source && canOpen) onOpenSource(source);
      }}
      aria-label={source ? `Open source: ${source.label}` : 'Open source'}
      title={title}
    >
      <ExternalLink size={13} />
    </button>
  );
}

function evidenceGateForVersion(version: UnderstandingVersion) {
  const precision = [
    auditValue(version.audit, 'anchor precision'),
    auditValue(version.audit, 'visual precision'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const fallback = auditValue(version.audit, 'fallback note')?.toLowerCase() ?? '';
  const hasWeakAnchor = precision.includes('visual context only') || precision.includes('window') || fallback.includes('weak');

  if (hasWeakAnchor) {
    return {
      label: 'Weak anchor',
      detail: 'Confirm the source before reuse.',
      state: 'weak',
    };
  }

  if (version.state === 'needs meaning' || version.state === 'needs interpretation') {
    return {
      label: 'Needs meaning',
      detail: 'User explanation required.',
      state: 'review',
    };
  }

  if (version.state === 'open question') {
    return {
      label: 'Open question',
      detail: 'Keep unresolved until answered.',
      state: 'review',
    };
  }

  if (version.state === 'memory candidate') {
    return {
      label: 'Memory candidate',
      detail: 'Reusable only after review.',
      state: 'ready',
    };
  }

  return {
    label: 'Review first',
    detail: 'Do not promote automatically.',
    state: 'review',
  };
}

function EvidenceGrounding({
  version,
  source,
  canOpenSource,
  onOpenSource,
}: {
  version: UnderstandingVersion;
  source: ReflectionSource | null;
  canOpenSource: boolean;
  onOpenSource: (source: ReflectionSource) => void;
}) {
  const groundingRows = groundingRowsForVersion(version);
  const evidenceGate = evidenceGateForVersion(version);
  const fileLabel = source?.label ?? auditValue(version.audit, 'file') ?? version.anchor;
  const kind = source?.kind ?? auditValue(version.audit, 'kind') ?? 'source';

  return (
    <>
      <div className={styles.evidenceSourceLine} aria-label="Evidence source">
        <FileBadge kind={kind} />
        <span>{fileLabel}</span>
        <strong data-state={evidenceGate.state}>{evidenceGate.label}</strong>
        <SourceOpenButton source={source} canOpen={canOpenSource} onOpenSource={onOpenSource} />
      </div>
      <details className={styles.evidenceAudit}>
        <summary>Details</summary>
        <div className={styles.evidenceGate} data-state={evidenceGate.state} aria-label="Evidence reuse gate">
          <span>reuse gate</span>
          <strong>{evidenceGate.label}</strong>
          <p>{evidenceGate.detail}</p>
        </div>
        <dl className={styles.evidenceGrounding} aria-label="Evidence grounding">
          {groundingRows.map((row) => (
            <div key={`${row.label}-${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <ul>
          {version.audit.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </>
  );
}

export default function ReflectionWorkspaceClient() {
  const [cases, setCases] = useState<ReflectionCase[]>(() => INITIAL_CASES.map(cloneCase));
  const [activeCaseId, setActiveCaseId] = useState(INITIAL_CASES[0]!.id);
  const [activeSourceId, setActiveSourceId] = useState(INITIAL_CASES[0]!.sources[0]!.id);
  const [caseQuery, setCaseQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [draft, setDraft] = useState('');
  const learningCommitFocus: LearningCommitFocus = 'user meaning';
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [inspectorTarget, setInspectorTarget] = useState<InspectorTarget>('version');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarPeeking, setIsSidebarPeeking] = useState(false);
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState(false);
  // Web parity with the native drag-resizable Evidence pane: 22rem stays the
  // contract default; a persisted user width (clamped like native, 320–560)
  // overrides it via the --reflection-sources-width variable.
  const [sourcesWidth, setSourcesWidth] = useState<number | null>(null);
  const sourcesWidthRef = useRef<number | null>(null);
  sourcesWidthRef.current = sourcesWidth;

  useEffect(() => {
    const stored = Number.parseInt(window.localStorage.getItem('loom.reflection.sourcesWidth') ?? '', 10);
    if (Number.isFinite(stored)) {
      setSourcesWidth(Math.min(Math.max(stored, 320), 560));
    }
  }, []);

  function beginSourcesResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sourcesWidthRef.current
      ?? document.querySelector<HTMLElement>(`.${styles.sources}`)?.getBoundingClientRect().width
      ?? 352;
    function onMove(move: PointerEvent) {
      // The pane sits right of the seam: dragging left grows it. Write the
      // ref directly so pointerup persists the exact final width even when
      // React hasn't re-rendered between the last move and the release.
      const next = Math.min(Math.max(startWidth + (startX - move.clientX), 320), 560);
      sourcesWidthRef.current = next;
      setSourcesWidth(next);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const finalWidth = sourcesWidthRef.current;
      if (finalWidth) {
        window.localStorage.setItem('loom.reflection.sourcesWidth', String(Math.round(finalWidth)));
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
  const [hasNativeOpenSourceBridge, setHasNativeOpenSourceBridge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    setHasNativeOpenSourceBridge(Boolean(openSourceBridge()));

    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0]!;
  const visibleCases = useMemo(() => {
    const query = caseQuery.trim().toLowerCase();
    if (!query) return cases;
    return cases.filter((item) =>
      [item.title, item.project, item.summary, ...item.tags].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [cases, caseQuery]);

  const visibleSources = useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    if (!query) return activeCase.sources;
    return activeCase.sources.filter((source) =>
      [source.label, source.folder, source.kind, source.excerpt].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [activeCase.sources, sourceQuery]);

  const activeSource =
    activeCase.sources.find((source) => source.id === activeSourceId) ??
    activeCase.sources[0] ??
    null;
  const activeVersions = useMemo(() => understandingVersionsFromCase(activeCase), [activeCase]);
  const activeEvidence = useMemo(() => {
    if (inspectorTarget === 'source') return versionForSource(activeVersions, activeSource);
    return currentEvidenceVersion(activeCase, activeVersionId);
  }, [activeCase, activeSource, activeVersionId, activeVersions, inspectorTarget]);
  const evidenceSource = useMemo(() => {
    return evidenceSourceFor(activeCase, activeEvidence, activeSource, inspectorTarget);
  }, [activeCase, activeEvidence, activeSource, inspectorTarget]);
  const commitTarget = commitTargetForCase(activeCase);
  const isLearningCase = activeCase.project === 'Learning pass';
  const commitAnchor = activeCase.project === 'Learning pass'
    ? latestLearningAnchor(activeCase, activeSource)
    : WORKFLOW_BY_KEY[commitTarget.key].description;
  const canOpenEvidenceSource = sourceCanOpen(evidenceSource, hasNativeOpenSourceBridge);
  const canOpenActiveSource = sourceCanOpen(activeSource, hasNativeOpenSourceBridge);
  const shouldShowFullSidebar = !isSidebarCollapsed || isSidebarPeeking;
  const shouldShowSourceList = activeCase.sources.length !== 1 || sourceQuery.trim().length > 0;

  const sourcesByFolder = useMemo(() => {
    return visibleSources.reduce<Record<string, ReflectionSource[]>>((acc, source) => {
      acc[source.folder] ??= [];
      acc[source.folder]!.push(source);
      return acc;
    }, {});
  }, [visibleSources]);

  function selectCase(nextCase: ReflectionCase) {
    setActiveCaseId(nextCase.id);
    setActiveSourceId(nextCase.sources[0]?.id ?? '');
    setActiveVersionId(null);
    setInspectorTarget('version');
    setSourceQuery('');
  }

  function createReflection() {
    const nextCase = makeBlankReflectionCase();

    setCases((current) => [nextCase, ...current]);
    setActiveCaseId(nextCase.id);
    setActiveSourceId('');
    setActiveVersionId(null);
    setInspectorTarget('version');
    setSourceQuery('');
    setDraft('');
  }

  function expandSidebar() {
    setIsSidebarCollapsed(false);
    setIsSidebarPeeking(false);
  }

  function collapseSidebar() {
    setIsSidebarCollapsed(true);
    setIsSidebarPeeking(false);
  }

  function handleSidebarMouseEnter() {
    if (isSidebarCollapsed) {
      setIsSidebarPeeking(true);
    }
  }

  function handleSidebarMouseLeave() {
    if (isSidebarCollapsed) {
      setIsSidebarPeeking(false);
    }
  }

  function deleteReflection(caseId: string) {
    const deleteIndex = cases.findIndex((item) => item.id === caseId);
    if (deleteIndex === -1) return;

    const remainingCases = cases.filter((item) => item.id !== caseId);
    const nextCases = remainingCases.length > 0 ? remainingCases : [makeBlankReflectionCase()];
    const nextActiveCase =
      caseId === activeCaseId
        ? nextCases[Math.min(deleteIndex, nextCases.length - 1)]!
        : activeCase;

    setCases(nextCases);

    if (caseId === activeCaseId) {
      setActiveCaseId(nextActiveCase.id);
      setActiveSourceId(nextActiveCase.sources[0]?.id ?? '');
      setActiveVersionId(null);
      setInspectorTarget('version');
      setSourceQuery('');
      setDraft('');
    }
  }

  function openLocalImport() {
    fileInputRef.current?.click();
  }

  function openSource(source: ReflectionSource) {
    const bridge = openSourceBridge();
    if (bridge) {
      bridge.postMessage(sourceOpenPayload(source));
      return;
    }

    if (source.localPreviewUrl) {
      window.open(source.localPreviewUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function selectSource(source: ReflectionSource) {
    setActiveSourceId(source.id);
    setActiveVersionId(null);
    setInspectorTarget('source');
    setIsSourcesCollapsed(false);
  }

  function selectVersion(versionId: string) {
    const version = activeVersions.find((item) => item.id === versionId) ?? null;
    const source = sourceForVersion(activeCase.sources, version);

    setActiveVersionId(versionId);
    setInspectorTarget('version');
    if (source) setActiveSourceId(source.id);
  }

  async function importLocalFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (files.length === 0) return;

    const importedSources = await Promise.all(files.map(fileToReflectionSource));
    objectUrlsRef.current.push(...importedSources.flatMap((source) => source.localPreviewUrl ? [source.localPreviewUrl] : []));
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCases((current) =>
      current.map((item) => {
        if (item.id !== activeCase.id) return item;

        const inputLines = importedSources.map(
          (source) => `Imported local source: ${source.label}. ${source.excerpt}`,
        );

        return {
          ...item,
          updatedAt: now,
          status: item.status === 'Memory ready' ? item.status : 'In reflection',
          sources: [...importedSources, ...item.sources],
          sections: {
            ...item.sections,
            input: [...item.sections.input, ...inputLines],
          },
          messages: [
            ...item.messages,
            {
              id: `${item.id}-local-import-${Date.now()}`,
              role: 'human',
              eyebrow: 'Imported source',
              body:
                importedSources.length === 1
                  ? `Imported ${importedSources[0]!.label} into Sources.`
                  : `Imported ${importedSources.length} local files into Sources.`,
            },
          ],
        };
      }),
    );

    setActiveSourceId(importedSources[0]!.id);
    setActiveVersionId(null);
    setInspectorTarget('source');
    setSourceQuery('');
    setIsSourcesCollapsed(false);
  }

  function submitMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const committedText =
      isLearningCase
        ? formatLearningCommit(text, latestLearningAnchor(activeCase, activeSource), learningCommitFocus)
        : text;
    setCases((current) =>
      current.map((item) => {
        if (item.id !== activeCase.id) return item;
        return {
          ...item,
          updatedAt: now,
          status:
            commitTarget.key === 'memory'
              ? 'Memory ready'
              : item.project === 'Learning pass'
                ? 'Second pass ready'
                : 'In reflection',
          sections: {
            ...item.sections,
            [commitTarget.key]: [...item.sections[commitTarget.key], committedText],
          },
          messages: [
            ...item.messages,
            {
              id: `${item.id}-human-${Date.now()}`,
              role: 'human',
              eyebrow: commitTarget.label,
              body: text,
            },
            {
              id: `${item.id}-loom-${Date.now()}`,
              role: 'loom',
              eyebrow: 'Version committed',
              body: `Committed to ${WORKFLOW_BY_KEY[commitTarget.key].label}. Review it before promoting it into reusable memory.`,
            },
          ],
        };
      }),
    );
    setActiveVersionId(null);
    setInspectorTarget('version');
    setDraft('');
  }

  return (
    <main
      className={styles.shell}
      data-sidebar-collapsed={isSidebarCollapsed}
      data-sidebar-peeking={isSidebarPeeking}
      data-sources-collapsed={isSourcesCollapsed}
      aria-labelledby="reflection-title"
      style={
        sourcesWidth !== null && !isSourcesCollapsed
          ? ({ '--reflection-sources-width': `${sourcesWidth}px` } as React.CSSProperties)
          : undefined
      }
    >
      <aside
        className={styles.sidebar}
        aria-label="Reflection cases"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {!shouldShowFullSidebar ? (
          <div className={styles.sidebarRail}>
            <div className={styles.paneRailTop}>
              <button
                className={styles.paneToggleButton}
                data-pane="left"
                type="button"
                onClick={expandSidebar}
                aria-label="Expand reflection sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
            <button className={styles.iconButton} type="button" onClick={createReflection} aria-label="New reflection">
              <Plus size={17} />
            </button>
            <div className={styles.railCaseList} role="list">
              {cases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.railCaseItem}
                  data-active={item.id === activeCase.id}
                  onClick={() => selectCase(item)}
                  aria-label={item.title}
                  title={item.title}
                >
                  <CaseGlyph reflectionCase={item} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.brandRow}>
              <div>
                <p className={styles.kicker}>LOOM</p>
                <h1 id="reflection-title">Reflection</h1>
              </div>
              <button
                className={styles.paneToggleButton}
                data-pane="left"
                type="button"
                onClick={collapseSidebar}
                aria-label="Collapse reflection sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            <button className={styles.newButton} type="button" onClick={createReflection}>
              <Plus size={16} />
              New reflection
            </button>

            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={caseQuery}
                onChange={(event) => setCaseQuery(event.target.value)}
                placeholder="Search reflections"
              />
            </label>

            <div className={styles.caseList} role="list">
              {visibleCases.map((item) => (
                <div key={item.id} className={styles.caseItem} data-active={item.id === activeCase.id} role="listitem">
                  <button
                    type="button"
                    className={styles.caseSelectButton}
                    onClick={() => selectCase(item)}
                    aria-label={`Open ${item.title}`}
                  >
                    <span className={styles.caseIcon} data-file={Boolean(caseFileKind(item))}>
                      <CaseGlyph reflectionCase={item} />
                    </span>
                    <span className={styles.caseText} data-single-line={caseSubLabel(item) === null}>
                      <strong>{item.title}</strong>
                      {caseSubLabel(item) ? <span>{caseSubLabel(item)}</span> : null}
                    </span>
                    {caseTimeLabel(item) ? <span className={styles.caseTime}>{caseTimeLabel(item)}</span> : null}
                  </button>
                  <button
                    type="button"
                    className={styles.caseDeleteButton}
                    onClick={() => deleteReflection(item.id)}
                    aria-label={`Delete ${item.title}`}
                    title={`Delete ${item.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      <section className={styles.thread} aria-label="Reflection thread">
          <header className={styles.threadHeader} data-learning={activeCase.project === 'Learning pass'}>
            <div className={styles.threadTitleBlock}>
              <div className={styles.threadTitleLine}>
                {activeCase.project === 'Learning pass' ? <FileBadge kind={activeSource?.kind} /> : null}
                <h2>{activeCase.title}</h2>
                {isLearningCase ? (
                  <span className={styles.headerStatus} title={activeCase.status} aria-label={activeCase.status}>
                    <CheckCircle2 size={13} />
                  </span>
                ) : null}
              </div>
              {activeCase.project === 'Learning pass' ? (
                null
              ) : (
                <p>{activeCase.summary}</p>
              )}
            </div>
            {!isLearningCase ? (
              <div className={styles.headerStatus} title={activeCase.status} aria-label={activeCase.status}>
                <span>{activeCase.status}</span>
                <CheckCircle2 size={16} />
              </div>
            ) : null}
          </header>

          <UnderstandingSpine
            reflectionCase={activeCase}
            activeVersionId={activeEvidence?.id ?? null}
            onSelectVersion={selectVersion}
          />

          <form
            className={styles.composer}
            data-learning={isLearningCase}
            aria-label={isLearningCase ? 'Add margin note' : `${commitTarget.label} commit`}
            onSubmit={submitMaterial}
          >
            <div className={styles.composerField}>
              <textarea
                aria-label={isLearningCase ? 'Margin note input' : `${commitTarget.label} input`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  isLearningCase
                    ? 'Margin note...'
                    : commitTarget.placeholder
                }
                rows={isLearningCase ? 1 : 2}
              />
            </div>
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label={
                isLearningCase
                  ? 'Save margin note'
                  : commitTarget.buttonLabel
              }
              title={
                isLearningCase
                  ? 'Save margin note'
                  : commitTarget.buttonLabel
              }
            >
              <Send size={17} />
            </button>
          </form>
      </section>

      <aside className={styles.sources} aria-label="Local sources">
        {isSourcesCollapsed ? (
          <div className={styles.sourcesRail}>
            <div className={styles.paneRailTop}>
              <button
                className={styles.paneToggleButton}
                data-pane="right"
                type="button"
                onClick={() => setIsSourcesCollapsed(false)}
                aria-label="Expand sources inspector"
              >
                <PanelRightOpen size={16} />
              </button>
            </div>
            <div className={styles.sourcesRailMeta} aria-label={`${activeCase.sources.length} sources`}>
              <Folder size={16} />
              <span>{activeCase.sources.length}</span>
            </div>
          </div>
        ) : (
          <>
            <div
              className={styles.sourcesResizeHandle}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sources inspector"
              onPointerDown={beginSourcesResize}
            />
            <header className={styles.sourcesHeader}>
              <div className={styles.sourcesHeaderQuiet} aria-hidden="true" />
              <div className={styles.sourceHeaderControls}>
                <button
                  className={styles.importButton}
                  type="button"
                  onClick={openLocalImport}
                  aria-label="Import local source"
                  title="Import local source"
                >
                  <Upload size={14} />
                </button>
                <button
                  className={styles.paneToggleButton}
                  data-pane="right"
                  type="button"
                  onClick={() => setIsSourcesCollapsed(true)}
                  aria-label="Collapse sources inspector"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
            </header>

            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              multiple
              onChange={importLocalFiles}
              aria-label="Import local files"
            />

            <section className={styles.evidenceInspector} aria-label="Evidence">
              {activeEvidence ? (
                <>
                  <EvidenceGrounding
                    version={activeEvidence}
                    source={evidenceSource}
                    canOpenSource={canOpenEvidenceSource}
                    onOpenSource={openSource}
                  />
                </>
              ) : activeSource ? (
                <>
                  <div className={styles.evidenceSourceLine} aria-label="Evidence source">
                    <FileBadge kind={activeSource.kind} />
                    <span>{activeSource.label}</span>
                    <SourceOpenButton
                      source={activeSource}
                      canOpen={canOpenActiveSource}
                      onOpenSource={openSource}
                    />
                  </div>
                </>
              ) : (
                <p className={styles.evidenceEmpty}>Select or capture a source-backed version.</p>
              )}
            </section>

            {shouldShowSourceList ? (
              <>
                <label className={styles.searchBox}>
                  <Search size={15} />
                  <input
                    value={sourceQuery}
                    onChange={(event) => setSourceQuery(event.target.value)}
                    placeholder="Filter sources"
                  />
                </label>

                <div className={styles.sourceTree} aria-label="Source tree">
                  {Object.entries(sourcesByFolder).length > 0 ? (
                    <>
                      {Object.entries(sourcesByFolder).map(([folder, sources]) => (
                        <section key={folder} className={styles.sourceFolder}>
                          <div className={styles.folderLabel}>
                            <ChevronDown size={14} />
                            <Folder size={15} />
                            <span>{folder}</span>
                          </div>
                          {sources.map((source) => (
                            <button
                              key={source.id}
                              type="button"
                              className={styles.sourceItem}
                              data-active={source.id === activeSource?.id}
                              data-native-primary={isNativePrimarySource(source)}
                              onClick={() => selectSource(source)}
                            >
                              <FileBadge kind={source.kind} />
                              <span>{source.label}</span>
                              <small>{source.meta}</small>
                            </button>
                          ))}
                        </section>
                      ))}

                    </>
                  ) : (
                    <div className={styles.emptySources}>
                      <Archive size={22} />
                      <p>No sources added yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </>
        )}
      </aside>
    </main>
  );
}
