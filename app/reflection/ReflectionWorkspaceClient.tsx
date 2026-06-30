'use client';

import {
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FileText,
  Folder,
  GitBranch,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import styles from './ReflectionWorkspace.module.css';
import { UnderstandingSpine } from './UnderstandingSpine';
import type { ReflectionCase, ReflectionSource, UnderstandingVersion, WorkspaceMode } from './reflectionModel';
import {
  INITIAL_CASES,
  WORKFLOW_BY_KEY,
  cloneCase,
  commitTargetForCase,
  currentEvidenceVersion,
  fileToReflectionSource,
  formatLearningCommit,
  groundingRowsForVersion,
  isImageSource,
  isNativePrimarySource,
  latestLearningAnchor,
  makeBlankReflectionCase,
  sourceCanOpenInReader,
  understandingVersionsFromCase,
} from './reflectionModel';

function EvidenceGrounding({ version }: { version: UnderstandingVersion }) {
  const groundingRows = groundingRowsForVersion(version);

  return (
    <>
      <dl className={styles.evidenceGrounding} aria-label="Evidence grounding">
        {groundingRows.map((row) => (
          <div key={`${row.label}-${row.value}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <details className={styles.evidenceAudit}>
        <summary>Full audit</summary>
        <ul>
          {version.audit.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </>
  );
}

function SourceReader({
  source,
  onReturnToReflection,
  onAddToInput,
  onReflect,
}: {
  source: ReflectionSource;
  onReturnToReflection: () => void;
  onAddToInput: () => void;
  onReflect: () => void;
}) {
  const canRenderImage = isImageSource(source) && source.localPreviewUrl;

  return (
    <section className={styles.reader} aria-label="Source reader">
      <div className={styles.readerBody} data-engine="static">
        {canRenderImage ? (
          <div className={styles.imageReader}>
            <img src={source.localPreviewUrl} alt={source.label} />
          </div>
        ) : (
          <article className={styles.sourceTextReader}>
            <p>{source.excerpt}</p>
          </article>
        )}

        <aside className={styles.readerMarginPanel} data-side="left" aria-label="Loom reader navigation">
          <button className={styles.readerReturnButton} type="button" onClick={onReturnToReflection}>
            <MessageSquare size={15} />
            Reflection
          </button>
          <div className={styles.readerMarginCard}>
            <p className={styles.kicker}>Current Source</p>
            <h3>{source.label}</h3>
            <p>
              {source.kind}
              {source.meta ? ` · ${source.meta}` : ''}
            </p>
          </div>
        </aside>

        <aside className={styles.readerMarginPanel} data-side="right" aria-label="Loom reader companion">
          <span className={styles.readerEdgeTab} aria-hidden="true">
            Loom
          </span>
          <div className={styles.readerMarginCard}>
            <p className={styles.kicker}>Loom</p>
            <h3>Use this page</h3>
            <p>{source.excerpt}</p>
            <div className={styles.readerActionGrid}>
              <button className={styles.readerActionButton} type="button" onClick={onAddToInput}>
                <GitBranch size={14} />
                Add to Input
              </button>
              <button className={styles.readerActionButton} type="button" onClick={onReflect}>
                <MessageSquare size={14} />
                Reflect
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function ReflectionWorkspaceClient() {
  const [cases, setCases] = useState<ReflectionCase[]>(() => INITIAL_CASES.map(cloneCase));
  const [activeCaseId, setActiveCaseId] = useState(INITIAL_CASES[0]!.id);
  const [activeSourceId, setActiveSourceId] = useState(INITIAL_CASES[0]!.sources[0]!.id);
  const [caseQuery, setCaseQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarPeeking, setIsSidebarPeeking] = useState(false);
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('reflection');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
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
  const activeEvidence = useMemo(() => currentEvidenceVersion(activeCase, activeVersionId), [activeCase, activeVersionId]);
  const activeVersions = useMemo(() => understandingVersionsFromCase(activeCase), [activeCase]);
  const commitTarget = commitTargetForCase(activeCase);
  const commitAnchor = activeCase.project === 'Learning pass'
    ? latestLearningAnchor(activeCase, activeSource)
    : WORKFLOW_BY_KEY[commitTarget.key].description;
  const shouldShowFullSidebar = !isSidebarCollapsed || isSidebarPeeking;

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
    setSourceQuery('');
    setWorkspaceMode('reflection');
  }

  function createReflection() {
    const nextCase = makeBlankReflectionCase();

    setCases((current) => [nextCase, ...current]);
    setActiveCaseId(nextCase.id);
    setActiveSourceId('');
    setActiveVersionId(null);
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
      setSourceQuery('');
      setDraft('');
    }
  }

  function openLocalImport() {
    fileInputRef.current?.click();
  }

  function openSourceInReader(source: ReflectionSource) {
    setActiveSourceId(source.id);
    if (sourceCanOpenInReader(source)) {
      setWorkspaceMode('reader');
      setIsSidebarCollapsed(true);
      setIsSidebarPeeking(false);
      setIsSourcesCollapsed(false);
    }
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
    setSourceQuery('');
    setIsSourcesCollapsed(false);
    if (sourceCanOpenInReader(importedSources[0]!)) {
      setWorkspaceMode('reader');
      setIsSidebarCollapsed(true);
      setIsSidebarPeeking(false);
    }
  }

  function appendSourceExcerptToInput(source: ReflectionSource | null) {
    if (!source) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const line = `Source note from ${source.label}: ${source.excerpt}`;
    setCases((current) =>
      current.map((item) => {
        if (item.id !== activeCase.id) return item;
        return {
          ...item,
          updatedAt: now,
          status: item.status === 'Memory ready' ? item.status : 'In reflection',
          sections: {
            ...item.sections,
            input: [...item.sections.input, line],
          },
          messages: [
            ...item.messages,
            {
              id: `${item.id}-source-note-${Date.now()}`,
              role: 'human',
              eyebrow: 'Source note',
              body: line,
            },
          ],
        };
      }),
    );
  }

  function startReflectionFromSource(source: ReflectionSource | null) {
    if (!source) return;
    setDraft(`From ${source.label}: ${source.excerpt}`);
    setWorkspaceMode('reflection');
    setIsSidebarCollapsed(false);
  }

  function submitMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const committedText =
      activeCase.project === 'Learning pass'
        ? formatLearningCommit(text, latestLearningAnchor(activeCase, activeSource))
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
    setDraft('');
  }

  return (
    <main
      className={styles.shell}
      data-sidebar-collapsed={isSidebarCollapsed}
      data-sidebar-peeking={isSidebarPeeking}
      data-sources-collapsed={isSourcesCollapsed}
      data-workspace-mode={workspaceMode}
      aria-labelledby="reflection-title"
    >
      <aside
        className={styles.sidebar}
        aria-label="Reflection cases"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {!shouldShowFullSidebar ? (
          <div className={styles.sidebarRail}>
            <button
              className={styles.iconButton}
              type="button"
              onClick={expandSidebar}
              aria-label="Expand reflection sidebar"
            >
              <ChevronRight size={17} />
            </button>
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
                  <MessageSquare size={15} />
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
                className={styles.iconButton}
                type="button"
                onClick={collapseSidebar}
                aria-label="Collapse reflection sidebar"
              >
                <ChevronLeft size={17} />
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
                <div
                  key={item.id}
                  className={styles.caseItem}
                  data-active={item.id === activeCase.id}
                  role="listitem"
                >
                  <button
                    type="button"
                    className={styles.caseSelectButton}
                    onClick={() => selectCase(item)}
                    aria-label={`Open ${item.title}`}
                  >
                    <span className={styles.caseIcon}>
                      <MessageSquare size={15} />
                    </span>
                    <span className={styles.caseText}>
                      <strong>{item.title}</strong>
                      <span>{item.project}</span>
                    </span>
                    <span className={styles.caseTime}>{item.updatedAt}</span>
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

      {workspaceMode === 'reader' && activeSource ? (
        <SourceReader
          source={activeSource}
          onReturnToReflection={() => setWorkspaceMode('reflection')}
          onAddToInput={() => appendSourceExcerptToInput(activeSource)}
          onReflect={() => startReflectionFromSource(activeSource)}
        />
      ) : (
        <section className={styles.thread} aria-label="Reflection thread">
          <header className={styles.threadHeader} data-learning={activeCase.project === 'Learning pass'}>
            <div>
              <p className={styles.kicker}>
                {activeCase.project === 'Learning pass' ? 'Learning review' : 'Reflection case'}
              </p>
              <h2>{activeCase.title}</h2>
              {activeCase.project === 'Learning pass' ? (
                <div className={styles.headerMetaLine} aria-label="Learning context">
                  <span>{activeSource?.kind?.toUpperCase() ?? 'SOURCE'}</span>
                  <span>native source</span>
                  <span>{activeVersions.length} versions</span>
                </div>
              ) : (
                <p>{activeCase.summary}</p>
              )}
            </div>
            <div className={styles.headerStatus}>
              <span>{activeCase.status}</span>
              <CheckCircle2 size={16} />
            </div>
          </header>

          <UnderstandingSpine
            reflectionCase={activeCase}
            activeVersionId={activeEvidence?.id ?? null}
            onSelectVersion={setActiveVersionId}
          />

          <form
            className={styles.composer}
            data-learning={activeCase.project === 'Learning pass'}
            aria-label={`${commitTarget.label} commit field`}
            onSubmit={submitMaterial}
          >
            <label className={styles.composerField}>
              <span className={styles.composerTarget}>
                <strong>{commitTarget.label}</strong>
                <span className={styles.composerAnchor}>
                  {commitTarget.helper}
                  {' · '}
                  {commitAnchor}
                </span>
              </span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={commitTarget.placeholder}
                rows={2}
              />
            </label>
            <button type="submit" aria-label={commitTarget.buttonLabel}>
              <Send size={17} />
              <span>{commitTarget.buttonLabel}</span>
            </button>
          </form>
        </section>
      )}

      <aside className={styles.sources} aria-label="Local sources">
        {isSourcesCollapsed ? (
          <div className={styles.sourcesRail}>
            <button
              className={styles.plainIconButton}
              type="button"
              onClick={() => setIsSourcesCollapsed(false)}
              aria-label="Expand sources inspector"
            >
              <ChevronLeft size={17} />
            </button>
            <Folder size={16} />
            <span>{activeCase.sources.length}</span>
          </div>
        ) : (
          <>
            <header className={styles.sourcesHeader}>
              <div>
                <p className={styles.kicker}>{workspaceMode === 'reader' ? 'Reader' : 'Evidence'}</p>
                <h2>{workspaceMode === 'reader' ? 'Loom' : 'Inspector'}</h2>
              </div>
              <div className={styles.sourceHeaderControls}>
                <button className={styles.importButton} type="button" onClick={openLocalImport}>
                  <Upload size={14} />
                  Import
                </button>
                <button
                  className={styles.plainIconButton}
                  type="button"
                  onClick={() => setIsSourcesCollapsed(true)}
                  aria-label="Collapse sources inspector"
                >
                  <ChevronRight size={17} />
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

            <section className={styles.evidenceInspector} aria-label="Evidence inspector">
              {activeEvidence ? (
                <>
                  <div className={styles.evidenceTop}>
                    <GitBranch size={15} />
                    <div>
                      <h3>{activeEvidence.title}</h3>
                      <p>{activeEvidence.number} · {activeEvidence.state}</p>
                    </div>
                  </div>
                  <p className={styles.evidenceMaterial}>{activeEvidence.material}</p>
                  <EvidenceGrounding version={activeEvidence} />
                </>
              ) : activeSource ? (
                <>
                  <div className={styles.evidenceTop}>
                    <CircleDot size={15} />
                    <div>
                      <h3>{activeSource.label}</h3>
                      <p>{activeSource.kind}</p>
                    </div>
                  </div>
                  <p className={styles.evidenceMaterial}>{activeSource.excerpt}</p>
                  <div className={styles.evidenceMeta}>
                    <span>source</span>
                    <strong>{activeSource.folder}</strong>
                  </div>
                </>
              ) : (
                <p className={styles.evidenceEmpty}>Select or capture a source-backed version.</p>
              )}
            </section>

            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={sourceQuery}
                onChange={(event) => setSourceQuery(event.target.value)}
                placeholder="Filter sources"
              />
            </label>

            <p className={styles.sourceCollectionLabel}>Source Collection</p>
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
	                          data-readable={sourceCanOpenInReader(source)}
	                          onClick={() => openSourceInReader(source)}
	                        >
	                          {sourceCanOpenInReader(source) ? <BookOpen size={15} /> : <FileText size={15} />}
	                          <span>{source.label}</span>
	                          <small>{source.meta}</small>
	                        </button>
	                      ))}
                    </section>
                  ))}

	                  {workspaceMode === 'reader' && activeSource ? (
	                    <section className={styles.readerCompanion} aria-label="Loom reader companion">
	                      <div className={styles.previewTop}>
	                        <CircleDot size={16} />
	                        <div>
	                          <h3>{activeSource.label}</h3>
	                          <p>{activeSource.kind}</p>
	                        </div>
	                      </div>
	                      <p>{activeSource.excerpt}</p>
	                      <div className={styles.readerActionGrid}>
	                        <button
	                          className={styles.readerActionButton}
	                          type="button"
	                          onClick={() => appendSourceExcerptToInput(activeSource)}
	                        >
	                          <GitBranch size={14} />
	                          Add to Input
	                        </button>
	                        <button
	                          className={styles.readerActionButton}
	                          type="button"
	                          onClick={() => startReflectionFromSource(activeSource)}
	                        >
	                          <MessageSquare size={14} />
	                          Reflect
	                        </button>
	                      </div>
	                    </section>
	                  ) : (
	                    <section className={styles.preview} aria-label="Selected source preview">
	                      {activeSource ? (
	                        <>
	                          <div className={styles.previewTop}>
	                            <CircleDot size={16} />
	                            <div>
	                              <h3>{activeSource.label}</h3>
	                              <p>{activeSource.kind}</p>
		                            </div>
		                          </div>
		                          <p>{activeSource.excerpt}</p>
		                          {isNativePrimarySource(activeSource) ? (
		                            <div className={styles.nativeSourceNotice}>
		                              <BookOpen size={14} />
		                              <div>
		                                <strong>Native source</strong>
		                                <span>Use the original app. Loom records understanding versions.</span>
		                              </div>
		                            </div>
		                          ) : null}
		                          {sourceCanOpenInReader(activeSource) ? (
		                            <button
		                              className={styles.readerActionButton}
	                              type="button"
	                              onClick={() => openSourceInReader(activeSource)}
	                          >
	                            <BookOpen size={14} />
	                            Open source
	                          </button>
	                          ) : null}
	                          <div className={styles.trace}>
	                            <GitBranch size={15} />
	                            <span>Linked to {activeSource.folder}</span>
	                          </div>
	                        </>
	                      ) : (
	                        <div className={styles.emptyPreview}>
	                          <FileText size={26} />
	                          <h3>Open source</h3>
	                          <p>Select evidence from the workspace tree.</p>
	                        </div>
	                      )}
	                    </section>
	                  )}
                </>
              ) : (
                <div className={styles.emptySources}>
                  <Archive size={22} />
                  <p>No sources added yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
