'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { callAiPrompt } from '../../lib/ai/runtime';
import { loadSoanPayload } from '../../lib/loom-soan-records';
import { fetchSearchIndex } from '../../lib/search-index-client';
import {
  loadReferenceCitationDraftCorpusDocs,
  mergeDraftCorpusDocs,
} from '../../lib/new-loom/reference-citation-client';
import {
  browserDraftStorage,
  activeDraftReferenceMention,
  appendReferenceExcerptToDraft,
  applyDraftBlockOperation,
  applyDraftInlineEdit,
  buildBoundedDraftAIPrompt,
  buildBoundedDraftInlineEditPrompt,
  buildDraftFromTagPrompt,
  createDraft,
  DEFAULT_NEW_LOOM_DRAFT_OUTPUT_TYPE_ID,
  draftArtifactStateLabel,
  draftBlockOperationDiffHunks,
  draftBlockReferenceLabels,
  draftBlocksFromBody,
  draftFromTagPromptLines,
  draftInlineEditDiffHunks,
  draftReferenceMentionToken,
  draftReferencesChanged,
  draftProvenanceMatches,
  draftSourceTilesFromReferences,
  draftWordCount,
  importWorkbenchDraft,
  insertDraftReferenceMention,
  insertDraftReferenceCandidateIntoDraft,
  insertDraftReferenceQuoteIntoDraft,
  listDrafts,
  mergeDraftReferences,
  NEW_LOOM_DRAFT_OUTPUT_TYPES,
  NEW_LOOM_WORKBENCH_DRAFT_KEY,
  NEW_LOOM_WORKBENCH_IMPORT_KEY,
  newLoomDraftOutputTypeForId,
  parseDraftFromTagCommand,
  predictDraftNextReferences,
  publicWorkingDraftReferences,
  rankDraftReferenceCandidates,
  selectDraftCorpusHits,
  type NewLoomDraftCorpusDoc,
  type NewLoomDraftCorpusHit,
  type NewLoomDraftArtifactState,
  type NewLoomDraftRecord,
  type NewLoomDraftOutputTypeId,
  type NewLoomDraftReference,
  type NewLoomDraftReferenceKind,
  type NewLoomDraftTaggedCard,
  updateDraft,
} from '../../lib/new-loom/draft-storage';
import {
  buildDraftAnswerPreview,
  extractDraftAnswerFromBody,
  saveDraftAnswerPreview,
} from '../../lib/new-loom/draft-answer-preview';
import {
  buildDraftRecord,
  saveDraftRecord,
} from '../../lib/new-loom/draft-records';
import {
  nativeDraftStorage,
  type NativeDraftStorage,
} from '../../lib/new-loom/native-draft-client';
import {
  browserPublicWorkingStorage,
  isNewLoomPublicWorkingMode,
} from '../../lib/new-loom/public-working-mode';
import {
  blocksToBody,
  bodyToBlocks,
  fileToDocBlock,
  type NewLoomDraftDocBlock,
} from '../../lib/new-loom/draft-blocks';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { DraftBlockEditor } from './DraftBlockEditor';
import DraftBoardClient from './DraftBoardClient';
import draftDeskStyles from './draft-evidence-desk.module.css';

const SAVE_DEBOUNCE_MS = 400;

type DraftAIState = 'idle' | 'streaming' | 'ready' | 'error';
type DraftInspectorMode = 'sources' | 'edit' | 'board';
type DraftAnswerPreviewState = 'idle' | 'saved' | 'error';

type DraftInlineEditSelection = {
  start: number;
  end: number;
  original: string;
};

type LoomNavigateWindow = {
  webkit?: {
    messageHandlers?: {
      loomNavigate?: { postMessage: (msg: unknown) => void };
    };
  };
};

function callNativeBridge(action: string, payload?: Record<string, unknown>) {
  try {
    const handler = (window as unknown as LoomNavigateWindow).webkit?.messageHandlers?.loomNavigate;
    if (handler?.postMessage) {
      handler.postMessage({ action, ...(payload ?? {}) });
      return true;
    }
  } catch (_) {}
  return false;
}

function openDraftReference(
  event: { preventDefault(): void },
  reference: Pick<NewLoomDraftReference, 'href' | 'label' | 'kind'>,
) {
  if (
    callNativeBridge('openReference', {
      href: reference.href,
      label: reference.label,
      kind: reference.kind,
    })
  ) {
    event.preventDefault();
  }
}

function referencesFromLocation(): NewLoomDraftReference[] {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const labels = params.getAll('label');
  const quotes = params.getAll('quote');
  const excerpts = params.getAll('excerpt');
  const sources = params.getAll('source');
  const categories = params.getAll('category');
  const sourcePaths = params.getAll('sourcePath');
  const kinds = params.getAll('kind');
  const capturedAts = params.getAll('capturedAt');
  const artifactTargetIds = params.getAll('artifactTargetId');
  const artifactKinds = params.getAll('artifactKind');
  const artifactLabels = params.getAll('artifactLabel');
  const artifactStates = params.getAll('artifactState');
  const artifactStateLabels = params.getAll('artifactStateLabel');
  return params.getAll('ref').map((href, index) => {
    const sourceTitle = cleanParam(sources[index]);
    const excerpt = cleanParam(quotes[index]) ?? cleanParam(excerpts[index]);
    const artifactState = cleanArtifactState({
      targetId: artifactTargetIds[index],
      kind: artifactKinds[index],
      label: artifactLabels[index],
      state: artifactStates[index],
      stateLabel: artifactStateLabels[index],
    });
    return {
      href,
      label:
        cleanParam(labels[index]) ??
        sourceTitle ??
        href.replace(/^loom:\/\//, '').replace(/^https?:\/\//, ''),
      kind: cleanReferenceKind(kinds[index]),
      ...(sourceTitle ? { sourceTitle } : {}),
      ...(cleanParam(categories[index]) ? { category: cleanParam(categories[index]) } : {}),
      ...(cleanParam(sourcePaths[index]) ? { sourcePath: cleanParam(sourcePaths[index]) } : {}),
      ...(excerpt ? { excerpt } : {}),
      capturedAt: cleanParam(capturedAts[index]),
      ...(artifactState ? { artifactState } : {}),
    };
  });
}

function cleanParam(value: string | undefined) {
  const next = value?.trim();
  return next ? next : undefined;
}

function cleanReferenceKind(value: string | undefined): NewLoomDraftReferenceKind | undefined {
  const next = cleanParam(value);
  if (next === 'source' || next === 'capture' || next === 'url' || next === 'artifact-state')
    return next;
  return undefined;
}

function cleanArtifactState(input: {
  targetId?: string;
  kind?: string;
  label?: string;
  state?: string;
  stateLabel?: string;
}): NewLoomDraftArtifactState | undefined {
  const targetId = cleanParam(input.targetId);
  if (!targetId) return undefined;
  const kind = cleanParam(input.kind);
  const label = cleanParam(input.label);
  const state = cleanParam(input.state);
  const stateLabel = cleanParam(input.stateLabel);
  return {
    targetId,
    ...(kind ? { kind } : {}),
    ...(label ? { label } : {}),
    ...(state ? { state } : {}),
    ...(stateLabel ? { stateLabel } : {}),
  };
}

function referenceKindLabel(reference: NewLoomDraftReference) {
  if (reference.kind === 'capture') return 'Capture';
  if (reference.kind === 'artifact-state') return 'Artifact state';
  if (reference.kind === 'url') return 'URL';
  return 'Source';
}

function referenceMetaLabel(reference: NewLoomDraftReference) {
  const kind = referenceKindLabel(reference);
  return reference.capturedAt ? `${kind} · ${reference.capturedAt}` : kind;
}

// The active draft output type drives the AI compose/inline-edit prompt
// instruction. It is carried here (not in the prompt call site) so the
// contract-pinned `buildDraftAIPrompt({ title, body, references, corpusHits })`
// call shape stays stable while still respecting the selected output type.
let activeDraftOutputTypeId: NewLoomDraftOutputTypeId = DEFAULT_NEW_LOOM_DRAFT_OUTPUT_TYPE_ID;

function buildDraftAIPrompt(input: {
  title: string;
  body: string;
  references: NewLoomDraftReference[];
  corpusHits?: NewLoomDraftCorpusHit[];
}) {
  return buildBoundedDraftAIPrompt({ ...input, outputTypeId: activeDraftOutputTypeId });
}

function buildDraftInlineEditPrompt(input: {
  title: string;
  body: string;
  selectedText: string;
  references: NewLoomDraftReference[];
  corpusHits?: NewLoomDraftCorpusHit[];
}) {
  return buildBoundedDraftInlineEditPrompt({ ...input, outputTypeId: activeDraftOutputTypeId });
}

type SearchIndexStoredField = {
  title?: string;
  href?: string;
  category?: string;
  sourcePath?: string;
  body?: string;
  artifactState?: {
    targetId?: string;
    kind?: string;
    label?: string;
    state?: string;
    stateLabel?: string;
  };
  artifactTargetId?: string;
  artifactKind?: string;
  artifactLabel?: string;
  artifactStateData?: string;
  artifactStateLabel?: string;
};

async function loadDraftCorpusContext(input: {
  title: string;
  body: string;
  references: NewLoomDraftReference[];
}): Promise<NewLoomDraftCorpusHit[]> {
  const docs = await loadCombinedDraftCorpusDocs();
  return selectDraftCorpusHits({ ...input, docs });
}

async function loadDraftReferenceCandidates(): Promise<NewLoomDraftCorpusDoc[]> {
  const docs = await loadCombinedDraftCorpusDocs();
  return docs.sort((a, b) => a.title.localeCompare(b.title));
}

async function loadCombinedDraftCorpusDocs(): Promise<NewLoomDraftCorpusDoc[]> {
  const [searchDocs, citationDocs] = await Promise.all([
    loadSearchIndexCorpusDocs(),
    loadReferenceCitationDraftCorpusDocs(),
  ]);

  return mergeDraftCorpusDocs<NewLoomDraftCorpusDoc>(searchDocs, citationDocs);
}

async function loadSearchIndexCorpusDocs(): Promise<NewLoomDraftCorpusDoc[]> {
  try {
    const response = await fetchSearchIndex();
    if (!response.ok) return [];
    return corpusDocsFromSearchPayload(await response.json());
  } catch {
    return [];
  }
}

function corpusDocsFromSearchPayload(payload: unknown): NewLoomDraftCorpusDoc[] {
  const stored =
    (payload as { index?: { storedFields?: Record<string, SearchIndexStoredField> } })?.index
      ?.storedFields ?? {};
  const docs: NewLoomDraftCorpusDoc[] = [];
  for (const fields of Object.values(stored)) {
    if (!fields?.title || !fields?.href) continue;
    const artifactState = cleanSearchIndexArtifactState(fields);
    docs.push({
      title: fields.title,
      href: fields.href,
      ...(fields.category ? { category: fields.category } : {}),
      ...(fields.sourcePath ? { sourcePath: fields.sourcePath } : {}),
      ...(fields.body ? { body: fields.body } : {}),
      ...(artifactState ? { artifactState } : {}),
    });
  }
  return docs;
}

function cleanSearchIndexArtifactState(fields: SearchIndexStoredField) {
  const nested = fields.artifactState;
  return cleanArtifactState({
    targetId: nested?.targetId ?? fields.artifactTargetId,
    kind: nested?.kind ?? fields.artifactKind,
    label: nested?.label ?? fields.artifactLabel,
    state: nested?.state ?? fields.artifactStateData,
    stateLabel: nested?.stateLabel ?? fields.artifactStateLabel,
  });
}

function appendAISuggestionToBody(currentBody: string, suggestion: string) {
  const next = suggestion.trim();
  if (!next) return currentBody;
  const current = currentBody.trimEnd();
  return current ? `${current}\n\n${next}` : next;
}

function initialDraftOutputTypeIdFromLocation(initialDraftTypeId?: string): NewLoomDraftOutputTypeId {
  if (initialDraftTypeId) return newLoomDraftOutputTypeForId(initialDraftTypeId).id;
  if (typeof window === 'undefined') return DEFAULT_NEW_LOOM_DRAFT_OUTPUT_TYPE_ID;
  const params = new URLSearchParams(window.location.search);
  return newLoomDraftOutputTypeForId(params.get('draftType') ?? undefined).id;
}

function consumeLegacyWorkbenchDraftBody() {
  if (typeof window === 'undefined') return '';
  const draftStorage = browserDraftStorage();
  if (!draftStorage) return '';
  try {
    if (draftStorage.getItem(NEW_LOOM_WORKBENCH_IMPORT_KEY)) return '';
    const legacyBody = draftStorage.getItem(NEW_LOOM_WORKBENCH_DRAFT_KEY)?.trim() ?? '';
    draftStorage.setItem(NEW_LOOM_WORKBENCH_IMPORT_KEY, '1');
    return legacyBody;
  } catch {
    return '';
  }
}

async function loadNativeDraft(
  nativeStore: NativeDraftStorage,
  incomingReferences: NewLoomDraftReference[],
) {
  const drafts = await nativeStore.list();
  const existing = drafts[0];

  if (!existing) {
    const legacyBody = consumeLegacyWorkbenchDraftBody();
    return await nativeStore.create({
      references: incomingReferences,
      ...(legacyBody ? { body: legacyBody } : {}),
    });
  }

  const mergedReferences = mergeDraftReferences(existing.references, incomingReferences);
  const patch: {
    body?: string;
    references?: NewLoomDraftReference[];
  } = {};
  if (draftReferencesChanged(existing.references, mergedReferences)) {
    patch.references = mergedReferences;
  }

  const legacyBody = existing.body.trim() ? '' : consumeLegacyWorkbenchDraftBody();
  if (legacyBody) {
    patch.body = legacyBody;
  }

  return Object.keys(patch).length > 0 ? await nativeStore.update(existing.id, patch) : existing;
}

function cardsFromSoanPayload(payload: unknown): NewLoomDraftTaggedCard[] {
  if (!payload || typeof payload !== 'object') return [];
  const rawCards = Array.isArray((payload as { cards?: unknown }).cards)
    ? (payload as { cards: unknown[] }).cards
    : [];
  return rawCards.filter((card): card is NewLoomDraftTaggedCard => {
    if (!card || typeof card !== 'object') return false;
    const record = card as Record<string, unknown>;
    return (
      typeof record.body === 'string' &&
      (record.kind === undefined || typeof record.kind === 'string') &&
      (record.title === undefined || typeof record.title === 'string') &&
      (record.source === undefined || typeof record.source === 'string')
    );
  });
}

// Mirror of DraftBlockEditor's id factory so blocks seeded/imported here share
// the same stable-id contract as blocks created inside the editor.
function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `b-${Math.round(performance?.now?.() ?? 0)}-${Math.floor(Math.random() * 1e6)}`;
}

type DraftClientProps = {
  initialDraftTypeId?: string;
};

export function DraftClient({ initialDraftTypeId }: DraftClientProps = {}) {
  const [draft, setDraft] = useState<NewLoomDraftRecord | null>(null);
  const [title, setTitle] = useState('Untitled draft');
  const [body, setBody] = useState('');
  const [blocks, setBlocks] = useState<NewLoomDraftDocBlock[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'unavailable'>('idle');
  const [aiState, setAiState] = useState<DraftAIState>('idle');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState('');
  const [answerPreviewState, setAnswerPreviewState] = useState<DraftAnswerPreviewState>('idle');
  const [inlineEditState, setInlineEditState] = useState<DraftAIState>('idle');
  const [inlineEditSuggestion, setInlineEditSuggestion] = useState('');
  const [inlineEditError, setInlineEditError] = useState('');
  const [inlineEditSelection, setInlineEditSelection] = useState<DraftInlineEditSelection | null>(
    null,
  );
  const [referencePickerOpen, setReferencePickerOpen] = useState(false);
  const [referencePickerSource, setReferencePickerSource] = useState<'manual' | 'mention' | null>(
    null,
  );
  const [referencePickerQuery, setReferencePickerQuery] = useState('');
  const [referencePickerDocs, setReferencePickerDocs] = useState<NewLoomDraftCorpusDoc[]>([]);
  const [referencePickerState, setReferencePickerState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  );
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [blockOperationText, setBlockOperationText] = useState('');
  const [blockOperationError, setBlockOperationError] = useState('');
  const [publicWorkingMode, setPublicWorkingMode] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<DraftInspectorMode>('sources');
  const [selectedOutputTypeId, setSelectedOutputTypeId] = useState<NewLoomDraftOutputTypeId>(() =>
    initialDraftOutputTypeIdFromLocation(initialDraftTypeId),
  );

  const references = useMemo(() => draft?.references ?? [], [draft]);
  const selectedOutputType = useMemo(
    () => newLoomDraftOutputTypeForId(selectedOutputTypeId),
    [selectedOutputTypeId],
  );
  // Keep the module-level prompt output type in sync with the selected type so
  // buildDraftAIPrompt/buildDraftInlineEditPrompt apply the right instruction
  // without widening the contract-pinned prompt call shapes.
  activeDraftOutputTypeId = selectedOutputTypeId;
  const displayReferences = useMemo(
    () => publicWorkingMode ? publicWorkingDraftReferences(references) : references,
    [publicWorkingMode, references],
  );
  const sourceTiles = useMemo(() => draftSourceTilesFromReferences(displayReferences), [displayReferences]);
  const referenceByHref = useMemo(
    () => new Map(references.map((reference) => [reference.href, reference])),
    [references],
  );
  const wordCount = useMemo(() => draftWordCount(body), [body]);
  const draftBlocks = useMemo(() => draftBlocksFromBody(body, references), [body, references]);
  const selectedBlocks = useMemo(() => {
    const ids = new Set(selectedBlockIds);
    return draftBlocks.filter((block) => ids.has(block.id));
  }, [draftBlocks, selectedBlockIds]);
  const blockOperationDiff = useMemo(
    () => draftBlockOperationDiffHunks(selectedBlocks, blockOperationText),
    [blockOperationText, selectedBlocks],
  );
  const provenanceMatches = useMemo(
    () => draftProvenanceMatches(body, references),
    [body, references],
  );
  const referencePickerHits = useMemo(() => {
    if (publicWorkingMode) return [];
    return rankDraftReferenceCandidates(referencePickerQuery, referencePickerDocs, {
      alreadyReferenced: new Set(references.map((reference) => reference.href)),
    }).slice(0, 30);
  }, [publicWorkingMode, referencePickerDocs, referencePickerQuery, references]);
  const predictedReferenceHits = useMemo(() => {
    if (publicWorkingMode) return [];
    if (referencePickerOpen) return [];
    return predictDraftNextReferences({
      title,
      body,
      references,
      docs: referencePickerDocs,
      limit: 3,
    });
  }, [body, publicWorkingMode, referencePickerDocs, referencePickerOpen, references, title]);
  const draftPublishableAnswerText = useMemo(
    () => (aiSuggestion.trim() ? aiSuggestion : extractDraftAnswerFromBody(body)),
    [aiSuggestion, body],
  );
  const saveTimer = useRef<number | null>(null);
  const boardRef = useRef<HTMLElement | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const inlineEditAbortRef = useRef<AbortController | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPublicWorkingMode(isNewLoomPublicWorkingMode(
      window.location.search,
      browserPublicWorkingStorage(),
    ));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      const incomingReferences = referencesFromLocation();

      const nativeStore = nativeDraftStorage();
      if (nativeStore) {
        try {
          const nativeDraft = await loadNativeDraft(nativeStore, incomingReferences);
          if (cancelled) return;
          setDraft(nativeDraft);
          setTitle(nativeDraft.title);
          setBody(nativeDraft.body);
          setBlocks(
            nativeDraft.blocks ??
              bodyToBlocks(nativeDraft.body, nativeDraft.references ?? [], makeId),
          );
          setSaveState('saved');
        } catch {
          if (!cancelled) setSaveState('unavailable');
        }
        return;
      }

      const fallbackStorage = browserDraftStorage();
      if (!fallbackStorage) {
        setSaveState('unavailable');
        return;
      }
      const existing = listDrafts(fallbackStorage)[0];
      const mergedReferences = existing
        ? mergeDraftReferences(existing.references, incomingReferences)
        : incomingReferences;
      const next =
        existing && draftReferencesChanged(existing.references, mergedReferences)
          ? updateDraft(fallbackStorage, existing.id, { references: mergedReferences })
          : (existing ?? createDraft(fallbackStorage, { references: incomingReferences }));
      const imported = importWorkbenchDraft(fallbackStorage, next);
      if (cancelled) return;
      setDraft(imported);
      setTitle(imported.title);
      setBody(imported.body);
      setBlocks(
        imported.blocks ?? bodyToBlocks(imported.body, imported.references ?? [], makeId),
      );
      setSaveState('saved');
    };

    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!publicWorkingMode || !referencePickerOpen) return;
    setReferencePickerOpen(false);
    setReferencePickerSource(null);
    setReferencePickerQuery('');
  }, [publicWorkingMode, referencePickerOpen]);

  useEffect(() => {
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
      aiAbortRef.current?.abort();
      inlineEditAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDraftType = params.get('draftType') ?? undefined;
    if (requestedDraftType) {
      setSelectedOutputTypeId(newLoomDraftOutputTypeForId(requestedDraftType).id);
    }
    if (params.get('view') === 'board') {
      setInspectorMode('board');
      window.requestAnimationFrame(() => {
        boardRef.current?.scrollIntoView({ block: 'start' });
      });
    }
  }, []);

  useEffect(() => {
    if (!draft || referencePickerDocs.length > 0) return;
    let cancelled = false;
    setReferencePickerState('loading');
    void loadDraftReferenceCandidates()
      .then((docs) => {
        if (cancelled) return;
        setReferencePickerDocs(docs);
        setReferencePickerState(docs.length > 0 ? 'idle' : 'error');
      })
      .catch(() => {
        if (!cancelled) setReferencePickerState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [draft, referencePickerDocs.length]);

  useEffect(() => {
    const validIds = new Set(draftBlocks.map((block) => block.id));
    setSelectedBlockIds((ids) => ids.filter((id) => validIds.has(id)));
  }, [draftBlocks]);

  const persistDraft = async (
    currentDraft: NewLoomDraftRecord,
    nextTitle: string,
    nextBody: string,
    nextReferences = currentDraft.references,
    nextBlocks?: NewLoomDraftDocBlock[],
  ) => {
    const nativeStore = nativeDraftStorage();
    if (nativeStore) {
      // The native bridge persists body-only (blocks land in a later phase); the
      // body is already the kept-in-sync serialization of the blocks, so native
      // readers stay correct.
      return await nativeStore.update(currentDraft.id, {
        title: nextTitle,
        body: nextBody,
        references: nextReferences,
      });
    }

    const fallbackStorage = browserDraftStorage();
    if (!fallbackStorage) {
      throw new Error('Draft storage unavailable');
    }
    return updateDraft(fallbackStorage, currentDraft.id, {
      title: nextTitle,
      body: nextBody,
      references: nextReferences,
      ...(nextBlocks ? { blocks: nextBlocks } : {}),
    });
  };

  const commitDraft = async (
    currentDraft: NewLoomDraftRecord,
    nextTitle: string,
    nextBody: string,
    nextReferences = currentDraft.references,
    nextBlocks?: NewLoomDraftDocBlock[],
  ) => {
    const next = await persistDraft(
      currentDraft,
      nextTitle,
      nextBody,
      nextReferences,
      nextBlocks,
    );
    setDraft(next);
    setSaveState('saved');
    return next;
  };

  const save = (nextTitle = title, nextBody = body, nextBlocks = blocks) => {
    if (saveTimer.current != null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!draft) {
      setSaveState('unavailable');
      return;
    }
    void commitDraft(draft, nextTitle, nextBody, draft.references, nextBlocks).catch(() => {
      setSaveState('unavailable');
    });
  };

  const scheduleSave = (nextTitle: string, nextBody: string, nextBlocks?: NewLoomDraftDocBlock[]) => {
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    const currentDraft = draft;
    saveTimer.current = window.setTimeout(() => {
      if (!currentDraft) {
        setSaveState('unavailable');
        return;
      }
      void commitDraft(currentDraft, nextTitle, nextBody, currentDraft.references, nextBlocks)
        .catch(() => {
          setSaveState('unavailable');
        })
        .finally(() => {
          saveTimer.current = null;
        });
    }, SAVE_DEBOUNCE_MS);
  };

  // Blocks are the canonical edit model; body is the kept-in-sync serialization.
  function handleBlocksChange(next: NewLoomDraftDocBlock[]) {
    setBlocks(next);
    const nextBody = blocksToBody(next);
    setBody(nextBody);
    setSaveState('idle');
    scheduleSave(title, nextBody, next);
  }

  // Import path (Phase-1 slice of bring-your-real-work-in): read an uploaded
  // code/text file and append it as an attributed block. Paste already works
  // inside any block textarea.
  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      handleBlocksChange([...blocks, fileToDocBlock(file.name, text, makeId)]);
    } finally {
      // Reset so re-importing the same file fires another change event.
      input.value = '';
    }
  }

  // Body-only mutations (quote insert, AI insert/edit, outline, block ops) keep
  // body as their source of truth; re-derive blocks from the new body so the
  // block editor stays in sync and a later block edit cannot clobber them.
  function syncBlocksFromBody(nextBody: string): NewLoomDraftDocBlock[] {
    const nextBlocks = bodyToBlocks(nextBody, references, makeId);
    setBlocks(nextBlocks);
    return nextBlocks;
  }

  const insertReferenceExcerpt = (reference: NewLoomDraftReference) => {
    const nextBody = appendReferenceExcerptToDraft(body, reference);
    if (nextBody === body) return;
    const inserted = insertDraftReferenceQuoteIntoDraft({
      body,
      reference,
      references,
    });
    setBody(inserted.body);
    const nextBlocks = syncBlocksFromBody(inserted.body);
    setSaveState('idle');
    scheduleSave(title, inserted.body, nextBlocks);
  };

  function removeDraftReference(reference: NewLoomDraftReference) {
    if (!draft) return;
    const nextReferences = references.filter((existing) => existing.href !== reference.href);
    if (nextReferences.length === references.length) return;
    setDraft({ ...draft, references: nextReferences });
    setSaveState('idle');
    void commitDraft(draft, title, body, nextReferences).catch(() => {
      setSaveState('unavailable');
    });
  }

  const ensureReferencePickerDocs = async () => {
    if (referencePickerDocs.length > 0 || referencePickerState === 'loading') return;
    setReferencePickerState('loading');
    const docs = await loadDraftReferenceCandidates();
    setReferencePickerDocs(docs);
    setReferencePickerState(docs.length > 0 ? 'idle' : 'error');
  };

  const openReferencePicker = async () => {
    if (publicWorkingMode) return;
    setReferencePickerOpen(true);
    setReferencePickerSource('manual');
    setReferencePickerQuery('');
    await ensureReferencePickerDocs();
  };

  function useSelectedOutputOutline() {
    const outline = selectedOutputType.starterBody;
    const nextTitle =
      title.trim() && title.trim() !== 'Untitled draft' ? title : selectedOutputType.starterTitle;
    const nextBody = body.trim() ? `${body.trimEnd()}\n\n${outline}` : outline;

    setTitle(nextTitle);
    setBody(nextBody);
    const nextBlocks = syncBlocksFromBody(nextBody);
    setSaveState('idle');
    scheduleSave(nextTitle, nextBody, nextBlocks);
    window.requestAnimationFrame(() => bodyTextareaRef.current?.focus());
  }

  const syncReferencePickerWithMention = (nextBody: string, cursor: number) => {
    if (publicWorkingMode) {
      if (referencePickerOpen) {
        setReferencePickerOpen(false);
        setReferencePickerSource(null);
        setReferencePickerQuery('');
      }
      return;
    }
    const activeMention = activeDraftReferenceMention(nextBody, cursor);
    if (activeMention) {
      setReferencePickerOpen(true);
      setReferencePickerSource('mention');
      setReferencePickerQuery(activeMention.query);
      void ensureReferencePickerDocs();
      return;
    }
    if (referencePickerSource === 'mention') {
      setReferencePickerOpen(false);
      setReferencePickerSource(null);
      setReferencePickerQuery('');
    }
  };

  const insertReferenceCandidate = (doc: NewLoomDraftCorpusDoc) => {
    if (publicWorkingMode) return;
    if (!draft) return;
    const textarea = bodyTextareaRef.current;
    const cursor = textarea?.selectionStart ?? body.length;
    const activeMention = activeDraftReferenceMention(body, cursor);
    const start = activeMention?.start ?? cursor;
    const end = activeMention?.end ?? textarea?.selectionEnd ?? start;
    const inserted = insertDraftReferenceCandidateIntoDraft({
      body,
      selectionStart: start,
      selectionEnd: end,
      references,
      doc,
    });
    setBody(inserted.body);
    const nextBlocks = syncBlocksFromBody(inserted.body);
    setDraft({ ...draft, body: inserted.body, references: inserted.references });
    setSaveState('idle');
    setReferencePickerOpen(false);
    setReferencePickerSource(null);
    void commitDraft(draft, title, inserted.body, inserted.references, nextBlocks).catch(() => {
      setSaveState('unavailable');
    });
    window.requestAnimationFrame(() => bodyTextareaRef.current?.focus());
  };

  const continueWithAI = async () => {
    if (aiState === 'streaming') return;
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiState('streaming');
    setAiSuggestion('');
    setAiError('');
    setAnswerPreviewState('idle');
    try {
      const corpusHits = await loadDraftCorpusContext({ title, body, references });
      const result = await callAiPrompt(
        'draft-compose',
        buildDraftAIPrompt({ title, body, references, corpusHits }),
        {
          signal: controller.signal,
          onDelta: (_delta, full) => setAiSuggestion(full),
        },
      );
      setAiSuggestion(result);
      setAiState('ready');
    } catch (error) {
      if (controller.signal.aborted) {
        setAiState('idle');
      } else {
        setAiState('error');
        setAiError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (aiAbortRef.current === controller) aiAbortRef.current = null;
    }
  };

  async function startTaggedDraft() {
    if (aiState === 'streaming') return;

    const command = parseDraftFromTagCommand(body);
    if (!command) {
      aiAbortRef.current?.abort();
      aiAbortRef.current = null;
      setAiSuggestion('');
      setAiState('error');
      setAiError('Type /draft from #tag in the draft body.');
      return;
    }

    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiState('streaming');
    setAiSuggestion('');
    setAiError('');

    try {
      const cards = cardsFromSoanPayload(await loadSoanPayload());
      if (draftFromTagPromptLines(command, cards).length === 0) {
        setAiState('error');
        setAiError(`No draft cards matched ${command.label}.`);
        return;
      }
      const result = await callAiPrompt(
        'draft-compose',
        buildDraftFromTagPrompt({ title, body, command, cards }),
        {
          signal: controller.signal,
          onDelta: (_delta, full) => setAiSuggestion(full),
        },
      );
      setAiSuggestion(result);
      setAiState('ready');
    } catch (error) {
      if (controller.signal.aborted) {
        setAiState('idle');
      } else {
        setAiState('error');
        setAiError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (aiAbortRef.current === controller) aiAbortRef.current = null;
    }
  }

  const cancelAI = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiState('idle');
  };

  const discardAISuggestion = () => {
    setAiSuggestion('');
    setAiError('');
    setAiState('idle');
    setAnswerPreviewState('idle');
  };

  function publishAnswerPreview(answerText = aiSuggestion) {
    if (selectedOutputTypeId !== 'ai-answer' || !answerText.trim()) {
      setAnswerPreviewState('error');
      return;
    }

    const preview = buildDraftAnswerPreview({
      title,
      body,
      answer: answerText,
      references,
    });
    const currentDraftUrl =
      typeof window === 'undefined'
        ? '/draft'
        : `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const record = buildDraftRecord({
      title: preview.draftTitle,
      answer: preview.answer,
      sourceLabels: preview.sourceLabels,
      sourceHrefs: preview.sourceHrefs,
      draftUrl: currentDraftUrl,
      status: 'previewed',
    });

    const savedPreview = saveDraftAnswerPreview(preview);
    const savedRecord = saveDraftRecord(record);

    setAnswerPreviewState(savedPreview && savedRecord ? 'saved' : 'error');
  }

  const insertAISuggestion = () => {
    const nextBody = appendAISuggestionToBody(body, aiSuggestion);
    if (nextBody !== body) {
      setBody(nextBody);
      const nextBlocks = syncBlocksFromBody(nextBody);
      setSaveState('idle');
      scheduleSave(title, nextBody, nextBlocks);
    }
    discardAISuggestion();
  };

  async function startInlineEdit() {
    if (inlineEditState === 'streaming') return;
    const textarea = bodyTextareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const original = body.slice(start, end);

    if (!textarea || end <= start || !original.trim()) {
      inlineEditAbortRef.current?.abort();
      inlineEditAbortRef.current = null;
      setInlineEditSelection(null);
      setInlineEditSuggestion('');
      setInlineEditError('Select text first.');
      setInlineEditState('error');
      return;
    }

    const selection = { start, end, original };
    const controller = new AbortController();
    inlineEditAbortRef.current?.abort();
    inlineEditAbortRef.current = controller;
    setInlineEditSelection(selection);
    setInlineEditSuggestion('');
    setInlineEditError('');
    setInlineEditState('streaming');

    try {
      const corpusHits = await loadDraftCorpusContext({ title, body, references });
      const result = await callAiPrompt(
        'draft-compose',
        buildDraftInlineEditPrompt({
          title,
          body,
          selectedText: original,
          references,
          corpusHits,
        }),
        {
          signal: controller.signal,
          onDelta: (_delta, full) => setInlineEditSuggestion(full),
        },
      );
      setInlineEditSuggestion(result);
      setInlineEditState('ready');
    } catch (error) {
      if (controller.signal.aborted) {
        setInlineEditState('idle');
      } else {
        setInlineEditState('error');
        setInlineEditError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (inlineEditAbortRef.current === controller) inlineEditAbortRef.current = null;
    }
  }

  function cancelInlineEdit() {
    inlineEditAbortRef.current?.abort();
    inlineEditAbortRef.current = null;
    setInlineEditState('idle');
  }

  function discardInlineEdit() {
    inlineEditAbortRef.current?.abort();
    inlineEditAbortRef.current = null;
    setInlineEditSelection(null);
    setInlineEditSuggestion('');
    setInlineEditError('');
    setInlineEditState('idle');
  }

  function acceptInlineEdit() {
    if (!inlineEditSelection) return;
    const nextBody = applyDraftInlineEdit(body, {
      ...inlineEditSelection,
      replacement: inlineEditSuggestion,
    });
    if (nextBody === body) {
      setInlineEditError('Selection changed or replacement is empty.');
      setInlineEditState('error');
      return;
    }

    setBody(nextBody);
    const nextBlocks = syncBlocksFromBody(nextBody);
    setSaveState('idle');
    scheduleSave(title, nextBody, nextBlocks);
    discardInlineEdit();
  }

  function toggleBlockSelection(blockId: string) {
    const nextIds = selectedBlockIds.includes(blockId)
      ? selectedBlockIds.filter((id) => id !== blockId)
      : [...selectedBlockIds, blockId];
    const nextIdSet = new Set(nextIds);
    const nextBlocks = draftBlocks.filter((block) => nextIdSet.has(block.id));
    setSelectedBlockIds(nextIds);
    setBlockOperationText(nextBlocks.map((block) => block.text).join('\n\n'));
    setBlockOperationError('');
  }

  function clearBlockOperation() {
    setSelectedBlockIds([]);
    setBlockOperationText('');
    setBlockOperationError('');
  }

  function applySelectedBlockOperation() {
    if (!draft || selectedBlocks.length === 0) {
      setBlockOperationError('Select draft blocks first.');
      return;
    }
    const nextBody = applyDraftBlockOperation(body, {
      blockIds: selectedBlocks.map((block) => block.id),
      originals: selectedBlocks.map((block) => block.text),
      replacement: blockOperationText,
    });
    if (nextBody === body) {
      setBlockOperationError('Block selection changed or replacement is empty.');
      return;
    }

    setBody(nextBody);
    const nextBlocks = syncBlocksFromBody(nextBody);
    setSaveState('idle');
    scheduleSave(title, nextBody, nextBlocks);
    clearBlockOperation();
  }

  return (
    <>
      <LoomGlobalNav activeHref="/draft" ariaLabel="Draft navigation" />
      <main className={`new-loom-draft ${draftDeskStyles.surface}`}>
      <aside className="new-loom-draft__identity-rail" aria-label="Profile and workflow">
        <section className="new-loom-draft__profile-card" aria-label="Profile">
          <img src="/profile/yiping-profile-white-shirt.png" alt="Yiping Yin" />
          <h2>Yiping Yin</h2>
          <p>Student · Builder · Learner</p>
          <span>Sydney, Australia</span>
        </section>
        <section className="new-loom-draft__rail-section" aria-label="Workspace status">
          <h3>Workspace</h3>
          <ol>
            <li>
              <span>Sources</span>
              <strong>{sourceTiles.length}</strong>
            </li>
            <li>
              <span>Draft</span>
              <strong>{wordCount}</strong>
            </li>
            <li>
              <span>Provenance</span>
              <strong>{provenanceMatches.length}</strong>
            </li>
          </ol>
        </section>
        <section className="new-loom-draft__rail-section" aria-label="Active source">
          <h3>Active source</h3>
          <p>{sourceTiles[0]?.label ?? 'No source selected'}</p>
        </section>
      </aside>

      <section
        className="new-loom-draft__main"
        aria-labelledby="new-loom-draft-title"
      >
        <h1 className="new-loom-draft__sr-title">Draft evidence desk</h1>
        <section className="new-loom-draft__document-header new-loom-draft__workspace" aria-label="Draft document">
          <p className="new-loom-draft__eyebrow">Evidence desk · Draft</p>
          <div className="new-loom-draft__document-meta">
            <span>Draft</span>
            <strong>{selectedOutputType.label}</strong>
            <small>{saveState === 'saved' ? 'Saved' : saveState === 'unavailable' ? 'Storage unavailable' : 'Unsaved'}</small>
          </div>
          <input
            aria-label="Draft title"
            className="new-loom-draft__title"
            id="new-loom-draft-title"
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              setSaveState('idle');
              scheduleSave(nextTitle, body);
            }}
          />
          <div className="new-loom-draft__proof-strip" aria-label="Draft proof status">
            <span>
              <strong>
                Answer grounded by {sourceTiles.length} {sourceTiles.length === 1 ? 'source' : 'sources'}
              </strong>
              <small>{provenanceMatches.length} provenance match{provenanceMatches.length === 1 ? '' : 'es'}</small>
            </span>
            <span>
              <strong>{wordCount} {wordCount === 1 ? 'word' : 'words'}</strong>
              <small>{displayReferences.length} attached reference{displayReferences.length === 1 ? '' : 's'}</small>
            </span>
            <span>
              <strong>{selectedOutputType.label}</strong>
              <small>Current output type</small>
            </span>
          </div>
        </section>
        <section className="new-loom-draft__type-rail" aria-label="Draft type">
          <div className="new-loom-draft__type-copy">
            <p className="new-loom-draft__eyebrow">Output type</p>
            <h2>{selectedOutputType.label}</h2>
            <p>{selectedOutputType.goal}</p>
          </div>
          <div className="new-loom-draft__type-buttons">
            {NEW_LOOM_DRAFT_OUTPUT_TYPES.map((outputType) => (
              <button
                type="button"
                key={outputType.id}
                className="new-loom-draft__type-button"
                aria-pressed={selectedOutputTypeId === outputType.id}
                aria-label={`${outputType.label}: ${outputType.goal}`}
                onClick={() => setSelectedOutputTypeId(outputType.id)}
              >
                <span>{outputType.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="new-loom-draft__reference-action"
            onClick={useSelectedOutputOutline}
          >
            Use outline
          </button>
        </section>
        <section className="new-loom-draft__editor-shell" aria-label="Source-grounded editor">
          <div className="new-loom-draft__editor-toolbar" aria-label="Editor toolbar">
            <span>Source-grounded writing</span>
            <div className="new-loom-draft__editor-actions">
              {!publicWorkingMode ? (
                <button
                  type="button"
                  className="new-loom-draft__reference-action"
                  onClick={() => void openReferencePicker()}
                >
                  @ Reference
                </button>
              ) : null}
              <button
                type="button"
                className="new-loom-shell__action"
                onClick={() => importInputRef.current?.click()}
              >
                Import
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".py,.ts,.tsx,.js,.jsx,.go,.rs,.java,.c,.cpp,.sql,.sh,.json,.css,.html,.md,.markdown,.txt"
                style={{ display: 'none' }}
                aria-hidden="true"
                tabIndex={-1}
                onChange={(event) => void handleImportFile(event)}
              />
              <button type="button" className="new-loom-shell__action" onClick={() => save()}>
                Save draft
              </button>
            </div>
          </div>
          <DraftBlockEditor blocks={blocks} onChange={handleBlocksChange} />
          {/*
            The block editor is the authored surface; the canonical `body` is its
            kept-in-sync markdown serialization. This raw-body field is a
            secondary (collapsed) bridge for the body-based machinery Phase 1
            preserves: it carries `bodyTextareaRef` (the inline-edit selection +
            the reference-candidate insertion point), the Cmd-K inline-edit
            trigger, and the inline `@`-mention reference picker. Editing it keeps
            blocks in sync via the same serialization seam; the picker is re-homed
            onto blocks in a later task.
          */}
          <details className="new-loom-draft__raw">
            <summary>Raw body</summary>
            <textarea
              ref={bodyTextareaRef}
              aria-label="Draft body"
              className="new-loom-draft__body new-loom-draft__body--raw"
              placeholder="Write from source material."
              value={body}
              onChange={(event) => {
                const nextBody = event.target.value;
                setBody(nextBody);
                const nextBlocks = syncBlocksFromBody(nextBody);
                setSaveState('idle');
                scheduleSave(title, nextBody, nextBlocks);
                syncReferencePickerWithMention(nextBody, event.target.selectionStart);
              }}
              onClick={(event) => {
                syncReferencePickerWithMention(body, event.currentTarget.selectionStart);
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                  event.preventDefault();
                  void startInlineEdit();
                }
              }}
              onKeyUp={(event) => {
                syncReferencePickerWithMention(body, event.currentTarget.selectionStart);
              }}
              onSelect={(event) => {
                syncReferencePickerWithMention(body, event.currentTarget.selectionStart);
              }}
            />
          </details>
        </section>
        {!publicWorkingMode && referencePickerOpen ? (
          <section className="new-loom-draft__reference-picker" aria-label="Reference search">
            <div className="new-loom-draft__reference-picker-head">
              <h2>Reference search</h2>
              <button
                type="button"
                className="new-loom-draft__reference-action"
                onClick={() => {
                  setReferencePickerOpen(false);
                  setReferencePickerSource(null);
                }}
              >
                Cancel
              </button>
            </div>
            <input
              aria-label="Search references"
              className="new-loom-draft__reference-search"
              value={referencePickerQuery}
              onChange={(event) => setReferencePickerQuery(event.target.value)}
            />
            <div className="new-loom-draft__reference-results">
              {referencePickerState === 'loading' ? (
                <p className="new-loom-draft__ai-empty">Loading.</p>
              ) : referencePickerHits.length > 0 ? (
                referencePickerHits.map((doc) => (
                  <button
                    type="button"
                    className="new-loom-draft__reference-result"
                    key={doc.href}
                    onClick={() => insertReferenceCandidate(doc)}
                  >
                    <span>{doc.title}</span>
                    <small>
                      {draftReferenceMentionToken(doc)}
                      {doc.category ? ` · ${doc.category}` : ''}
                    </small>
                  </button>
                ))
              ) : (
                <p className="new-loom-draft__ai-empty">
                  {referencePickerState === 'error' ? 'No indexed references.' : 'No matches.'}
                </p>
              )}
            </div>
          </section>
        ) : null}
        <div className="new-loom-draft__footer">
          <span className="new-loom-draft__count">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span aria-live="polite">
            {saveState === 'saved'
              ? 'Saved'
              : saveState === 'unavailable'
                ? 'Storage unavailable'
                : 'Unsaved'}
          </span>
        </div>
      </section>

      <aside className="new-loom-draft__inspector" aria-label="Draft references">
        <div className="new-loom-draft__inspector-header">
          <span>Inspector</span>
          <h2>Sources, Edit, Board</h2>
          <p>Review source tiles, provenance, and answer publication state.</p>
        </div>
        <div className="new-loom-draft__inspector-tabs" role="tablist" aria-label="Draft inspector">
          {(['sources', 'edit', 'board'] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={inspectorMode === mode}
              className="new-loom-draft__inspector-tab"
              onClick={() => setInspectorMode(mode)}
            >
              {mode === 'sources' ? 'Sources' : mode === 'edit' ? 'Edit' : 'Board'}
            </button>
          ))}
        </div>
        {publicWorkingMode ? (
          <p className="new-loom-draft__public-mode">
            Public working mode is on. Draft references are masked.
          </p>
        ) : null}
        {inspectorMode === 'sources' ? (
          <>
            <section className="new-loom-draft__next" aria-label="AI draft">
              <p className="new-loom-shell__eyebrow">Next</p>
              <h2>Keep writing from this point</h2>
              <p>Continue with the same source context and preserve the current draft.</p>
              {selectedOutputTypeId === 'ai-answer' ? (
                <section className="new-loom-draft__answer-flow" aria-label="Sources to Draft to Answer handoff">
                  <p className="new-loom-draft__eyebrow">Thread of light</p>
                  <ol>
                    <li data-state={sourceTiles.length > 0 ? 'complete' : 'pending'}>
                      <span>Sources</span>
                      <strong>
                        {sourceTiles.length > 0
                          ? `${sourceTiles.length} ${sourceTiles.length === 1 ? 'source' : 'sources'} attached`
                          : 'Attach source tiles'}
                      </strong>
                    </li>
                    <li data-state={aiSuggestion ? 'complete' : aiState === 'streaming' ? 'active' : 'pending'}>
                      <span>Draft</span>
                      <strong>
                        {aiSuggestion
                          ? 'Answer draft ready'
                          : aiState === 'streaming'
                            ? 'Writing answer'
                            : 'Continue with AI'}
                      </strong>
                    </li>
                    <li data-state={answerPreviewState === 'saved' ? 'complete' : 'pending'}>
                      <span>Answer</span>
                      <strong>
                        {answerPreviewState === 'saved'
                          ? 'Published to Digital Me'
                          : 'Publish answer preview'}
                      </strong>
                    </li>
                  </ol>
                  {answerPreviewState === 'saved' ? (
                    <a className="new-loom-draft__answer-flow-link" href="/digital-me#digital-me-answer-title">
                      Open Digital Me answer
                    </a>
                  ) : null}
                </section>
              ) : null}
              <button
                type="button"
                className="new-loom-shell__action"
                onClick={() => void continueWithAI()}
                disabled={aiState === 'streaming'}
              >
                Continue with AI
              </button>
              <div className="new-loom-draft__inline-actions">
                <button
                  type="button"
                  className="new-loom-draft__reference-action"
                  onClick={() => void openReferencePicker()}
                  disabled={publicWorkingMode}
                >
                  Add source
                </button>
                <button
                  type="button"
                  className="new-loom-draft__reference-action"
                  onClick={() => void startTaggedDraft()}
                  disabled={aiState === 'streaming'}
                >
                  Draft from tag
                </button>
              </div>
              {aiSuggestion ? (
                <p className="new-loom-draft__ai-suggestion">{aiSuggestion}</p>
              ) : (
                <p className="new-loom-draft__ai-empty">
                  {aiState === 'streaming'
                    ? 'Writing.'
                    : aiState === 'error'
                      ? aiError
                      : 'AI draft is ready when you are.'}
                </p>
              )}
              {aiState === 'streaming' || aiSuggestion ? (
                <div className="new-loom-draft__ai-actions">
                  {aiState === 'streaming' ? (
                    <button
                      type="button"
                      className="new-loom-draft__reference-action"
                      onClick={cancelAI}
                    >
                      Cancel
                    </button>
                  ) : null}
                  {aiSuggestion ? (
                    <>
                      <button
                        type="button"
                        className="new-loom-draft__reference-action"
                        onClick={insertAISuggestion}
                      >
                        Insert AI text
                      </button>
                      <button
                        type="button"
                        className="new-loom-draft__reference-action"
                        onClick={discardAISuggestion}
                      >
                        Discard
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
              {selectedOutputTypeId === 'ai-answer' && draftPublishableAnswerText.trim() ? (
                <div className="new-loom-draft__ai-actions">
                  <button
                    type="button"
                    className="new-loom-draft__reference-action"
                    onClick={() => publishAnswerPreview(draftPublishableAnswerText)}
                  >
                    Publish answer preview
                  </button>
                  {answerPreviewState === 'saved' ? (
                    <a className="new-loom-draft__answer-flow-link" href="/drafts">
                      View Draft artifact
                    </a>
                  ) : null}
                </div>
              ) : null}
              {selectedOutputTypeId === 'ai-answer' ? (
                <p className="new-loom-draft__answer-preview-status" aria-live="polite">
                  {answerPreviewState === 'saved'
                    ? 'Answer preview published to the homepage inspector.'
                    : answerPreviewState === 'error'
                      ? 'Publish requires an AI Answer draft and available browser storage.'
                      : 'AI Answer can publish a grounded preview to the homepage inspector.'}
                </p>
              ) : null}
            </section>

            <section className="new-loom-draft__source-tiles" aria-label="Source tiles">
              <div className="new-loom-draft__source-tiles-head">
                <h2>Source tiles</h2>
                <span>{sourceTiles.length}/4</span>
              </div>
              {sourceTiles.length > 0 ? (
                <div className="new-loom-draft__source-list">
                  {sourceTiles.map((tile) => {
                    const realReference = referenceByHref.get(tile.href);
                    return (
                      <article
                        className="new-loom-draft__source-tile"
                        key={`${tile.href}:${tile.label}`}
                      >
                        <span>{tile.kindLabel}</span>
                        {!publicWorkingMode ? (
                          <a href={tile.href} onClick={(event) => openDraftReference(event, tile)}>
                            {tile.label}
                          </a>
                        ) : (
                          <span className="new-loom-draft__source-tile-title">{tile.label}</span>
                        )}
                        <small>{tile.detail}</small>
                        {tile.excerpt ? <p>{tile.excerpt}</p> : null}
                        <div className="new-loom-draft__source-tile-actions">
                          {!publicWorkingMode ? (
                            <a href={tile.href} onClick={(event) => openDraftReference(event, tile)}>
                              Open
                            </a>
                          ) : null}
                          {!publicWorkingMode && tile.canInsertQuote && realReference ? (
                            <button
                              type="button"
                              className="new-loom-draft__reference-action"
                              onClick={() => insertReferenceExcerpt(realReference)}
                            >
                              Insert quote
                            </button>
                          ) : null}
                          {!publicWorkingMode && realReference ? (
                            <button
                              type="button"
                              className="new-loom-draft__reference-action"
                              aria-label={`Remove source tile: ${tile.label}`}
                              onClick={() => removeDraftReference(realReference)}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="new-loom-draft__ai-empty">No source tiles yet.</p>
              )}
            </section>

            <section className="new-loom-draft__reference-list" aria-label="References">
              <h2>References</h2>
              {displayReferences.length > 0 ? (
                <ul>
                  {displayReferences.map((reference, index) => {
                    const realReference = references[index];
                    return (
                      <li key={`${reference.href}:${reference.label}:${index}`}>
                        <span className="new-loom-draft__reference-kind">
                          {referenceKindLabel(reference)}
                        </span>
                        {!publicWorkingMode && realReference ? (
                          <a
                            href={realReference.href}
                            onClick={(event) => openDraftReference(event, realReference)}
                          >
                            {reference.label}
                          </a>
                        ) : (
                          <span className="new-loom-draft__reference-title">{reference.label}</span>
                        )}
                        <div className="new-loom-draft__source-tile-actions">
                          {!publicWorkingMode && realReference ? (
                            <button
                              type="button"
                              className="new-loom-draft__reference-action"
                              aria-label={`Remove reference: ${reference.label}`}
                              onClick={() => removeDraftReference(realReference)}
                            >
                              Remove
                            </button>
                          ) : null}
                          {reference.excerpt && !publicWorkingMode && realReference ? (
                            <button
                              type="button"
                              className="new-loom-draft__reference-action"
                              onClick={() => insertReferenceExcerpt(realReference)}
                            >
                              Insert quote
                            </button>
                          ) : null}
                        </div>
                        <p className="new-loom-draft__reference-meta">
                          {referenceMetaLabel(reference)}
                        </p>
                        {reference.artifactState ? (
                          <p className="new-loom-draft__reference-meta">
                            Artifact state: {draftArtifactStateLabel(reference.artifactState)}
                          </p>
                        ) : null}
                        {reference.excerpt ? (
                          <p className="new-loom-draft__reference-excerpt">{reference.excerpt}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="new-loom-draft__ai-empty">No references attached yet.</p>
              )}
            </section>

            {!publicWorkingMode && predictedReferenceHits.length > 0 ? (
              <section className="new-loom-draft__provenance" aria-label="Suggested references">
                <h2>Suggested references</h2>
                <ol>
                  {predictedReferenceHits.map((prediction) => (
                    <li key={prediction.href}>
                      <button
                        type="button"
                        className="new-loom-draft__reference-action"
                        onClick={() => insertReferenceCandidate(prediction)}
                      >
                        {prediction.title}
                      </button>
                      <span>{prediction.token}</span>
                      <span>{prediction.reason}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {provenanceMatches.length > 0 ? (
              <section className="new-loom-draft__provenance" aria-label="Provenance">
                <h2>Provenance</h2>
                <ol>
                  {provenanceMatches.map((match) => (
                    <li key={`${match.href}:${match.n}`}>
                      <span className="new-loom-draft__provenance-n">{match.n}</span>
                      <span>{match.phrase}</span>
                      <a href={match.href} onClick={(event) => openDraftReference(event, match)}>
                        {match.label}
                      </a>
                      {match.artifactState ? (
                        <span className="new-loom-draft__provenance-state">
                          Artifact state: {draftArtifactStateLabel(match.artifactState)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </>
        ) : null}

        {inspectorMode === 'edit' ? (
          <>
            <section className="new-loom-draft__ai" aria-label="AI edit">
              <div className="new-loom-draft__ai-heading">
                <h2>AI edit</h2>
                <button
                  type="button"
                  className="new-loom-draft__reference-action"
                  onClick={() => void startInlineEdit()}
                  disabled={inlineEditState === 'streaming'}
                >
                  Edit selection
                </button>
              </div>
              {inlineEditSelection ? (
                <div className="new-loom-draft__ai-suggestion">
                  {inlineEditSuggestion ? (
                    <div className="new-loom-draft__diff" aria-label="Diff preview">
                      <h3>Diff preview</h3>
                      <ol>
                        {draftInlineEditDiffHunks(
                          inlineEditSelection.original,
                          inlineEditSuggestion,
                        ).map((hunk, index) => (
                          <li
                            className={`new-loom-draft__diff-line is-${hunk.kind}`}
                            key={`${hunk.kind}:${index}`}
                          >
                            <span>
                              {hunk.kind === 'added' ? '+' : hunk.kind === 'removed' ? '-' : ' '}
                            </span>
                            <code>{hunk.text}</code>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p>{inlineEditSelection.original}</p>
                  )}
                </div>
              ) : (
                <p className="new-loom-draft__ai-empty">
                  {inlineEditState === 'streaming'
                    ? 'Editing.'
                    : inlineEditState === 'error'
                      ? inlineEditError
                      : 'No edit pending.'}
                </p>
              )}
              {inlineEditState === 'streaming' || inlineEditSuggestion ? (
                <div className="new-loom-draft__ai-actions">
                  {inlineEditState === 'streaming' ? (
                    <button
                      type="button"
                      className="new-loom-draft__reference-action"
                      onClick={cancelInlineEdit}
                    >
                      Cancel
                    </button>
                  ) : null}
                  {inlineEditSuggestion ? (
                    <>
                      <button
                        type="button"
                        className="new-loom-draft__reference-action"
                        onClick={acceptInlineEdit}
                      >
                        Accept edit
                      </button>
                      <button
                        type="button"
                        className="new-loom-draft__reference-action"
                        onClick={discardInlineEdit}
                      >
                        Discard edit
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="new-loom-draft__structure" aria-label="Draft structure">
              <h2>Draft structure</h2>
              {draftBlocks.length > 0 ? (
                <ol>
                  {draftBlocks.slice(0, 8).map((block) => {
                    const blockReferences = draftBlockReferenceLabels(block, displayReferences);
                    return (
                      <li key={block.id}>
                        <label className="new-loom-draft__block-row">
                          <input
                            aria-label={`Select ${block.kind} block`}
                            checked={selectedBlockIds.includes(block.id)}
                            onChange={() => toggleBlockSelection(block.id)}
                            type="checkbox"
                          />
                          <span>
                            <span>{block.kind}</span>
                            <strong>{block.text.split('\n')[0]}</strong>
                            <small>
                              {block.wordCount} {block.wordCount === 1 ? 'word' : 'words'}
                              {blockReferences.length > 0
                                ? ` · ${blockReferences.length} refs`
                                : ''}
                            </small>
                            {blockReferences.length > 0 ? (
                              <small className="new-loom-draft__block-refs">
                                Refs: {blockReferences.map((reference) => reference.label).join(' · ')}
                              </small>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="new-loom-draft__ai-empty">No draft blocks yet.</p>
              )}
              <section className="new-loom-draft__block-operation" aria-label="Block operation">
                <h3>Block operation</h3>
                <p>
                  {selectedBlocks.length > 0
                    ? `${selectedBlocks.length} ${selectedBlocks.length === 1 ? 'block' : 'blocks'} selected`
                    : 'No blocks selected.'}
                </p>
                <textarea
                  aria-label="Block replacement"
                  value={blockOperationText}
                  onChange={(event) => {
                    setBlockOperationText(event.target.value);
                    setBlockOperationError('');
                  }}
                />
                {blockOperationDiff.length > 0 ? (
                  <div className="new-loom-draft__diff" aria-label="Block operation diff preview">
                    <h3>Diff preview</h3>
                    <ol>
                      {blockOperationDiff.map((hunk, index) => (
                        <li
                          className={`new-loom-draft__diff-line is-${hunk.kind}`}
                          key={`${hunk.kind}:${index}`}
                        >
                          <span>
                            {hunk.kind === 'added' ? '+' : hunk.kind === 'removed' ? '-' : ' '}
                          </span>
                          <code>{hunk.text}</code>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                <div className="new-loom-draft__block-actions">
                  <button
                    type="button"
                    className="new-loom-draft__reference-action"
                    disabled={selectedBlocks.length === 0}
                    onClick={applySelectedBlockOperation}
                  >
                    Apply block edit
                  </button>
                  <button
                    type="button"
                    className="new-loom-draft__reference-action"
                    disabled={selectedBlocks.length === 0 && !blockOperationText}
                    onClick={clearBlockOperation}
                  >
                    Clear
                  </button>
                </div>
                {blockOperationError ? <p role="alert">{blockOperationError}</p> : null}
              </section>
            </section>
          </>
        ) : null}

        {inspectorMode === 'board' ? (
          <section ref={boardRef} className="new-loom-draft__board" aria-label="Draft card board">
            <DraftBoardClient />
          </section>
        ) : null}
      </aside>
      </main>
    </>
  );
}
