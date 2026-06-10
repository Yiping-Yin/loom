export type NewLoomDraftArtifactState = {
  targetId: string;
  kind?: string;
  label?: string;
  state?: string;
  stateLabel?: string;
};

export type NewLoomDraftReferenceKind = 'source' | 'capture' | 'url' | 'artifact-state';

export type NewLoomDraftReference = {
  label: string;
  href: string;
  kind?: NewLoomDraftReferenceKind;
  sourceTitle?: string;
  category?: string;
  sourcePath?: string;
  excerpt?: string;
  capturedAt?: string;
  artifactState?: NewLoomDraftArtifactState;
};

export type NewLoomDraftSourceTile = {
  label: string;
  href: string;
  kindLabel: string;
  detail: string;
  excerpt?: string;
  canInsertQuote: boolean;
};

export type NewLoomDraftCorpusDoc = {
  title: string;
  href: string;
  category?: string;
  sourcePath?: string;
  excerpt?: string;
  body?: string;
  artifactState?: NewLoomDraftArtifactState;
};

export type NewLoomDraftCorpusHit = NewLoomDraftCorpusDoc & {
  score: number;
};

export type NewLoomDraftAIPromptLimits = {
  maxPromptChars?: number;
  titleChars?: number;
  bodyChars?: number;
  selectedTextChars?: number;
  referenceLineChars?: number;
  referenceTotalChars?: number;
  inlineLineChars?: number;
  inlineTotalChars?: number;
  corpusLineChars?: number;
  corpusTotalChars?: number;
};

export type NewLoomDraftPredictedReference = NewLoomDraftCorpusHit & {
  token: string;
  reason: string;
};

export type NewLoomDraftProvenanceMatch = {
  n: number;
  phrase: string;
  label: string;
  href: string;
  artifactState?: NewLoomDraftArtifactState;
};

export type NewLoomDraftInlineReferenceAnchor = {
  kind: 'page' | 'slide' | 'heading' | 'artifact-state';
  label: string;
  start?: number;
  end?: number;
  value?: string;
};

export type NewLoomDraftInlineReference = {
  token: string;
  target: string;
  anchor?: NewLoomDraftInlineReferenceAnchor;
};

export type NewLoomDraftInlineEdit = {
  start: number;
  end: number;
  original: string;
  replacement: string;
};

export type NewLoomDraftInlineEditDiffHunk = {
  kind: 'unchanged' | 'removed' | 'added';
  text: string;
};

export type NewLoomDraftBlockKind = 'heading' | 'paragraph' | 'quote' | 'list' | 'code';

export type NewLoomDraftBlock = {
  id: string;
  kind: NewLoomDraftBlockKind;
  text: string;
  start: number;
  end: number;
  wordCount: number;
  referenceHrefs: string[];
};

export type NewLoomDraftBlockReferenceLabel = {
  href: string;
  label: string;
  kind: NewLoomDraftReferenceKind;
};

export type NewLoomDraftBlockEdit = {
  blockId: string;
  original: string;
  replacement: string;
};

export type NewLoomDraftBlockOperation = {
  blockIds: string[];
  originals: string[];
  replacement: string;
};

export type NewLoomDraftReferenceMentionInsert = {
  body: string;
  reference: NewLoomDraftReference;
};

export type NewLoomDraftReferenceCandidateInsert = {
  body: string;
  token: string;
  reference: NewLoomDraftReference;
  references: NewLoomDraftReference[];
  sourceTiles: NewLoomDraftSourceTile[];
};

export type NewLoomDraftReferenceQuoteInsert = {
  body: string;
  provenanceMatches: NewLoomDraftProvenanceMatch[];
};

export type NewLoomDraftActiveReferenceMention = {
  start: number;
  end: number;
  query: string;
};

export type NewLoomDraftTagKind = 'thesis' | 'counter' | 'instance' | 'question' | 'fog' | 'weft' | 'sketch';

export type NewLoomDraftTaggedCard = {
  kind?: string;
  title?: string;
  body: string;
  source?: string;
};

export type NewLoomDraftFromTagCommand = {
  token: string;
  tag: string;
  label: string;
  kind?: NewLoomDraftTagKind;
};

export type NewLoomDraftOutputTypeId =
  | 'course-note'
  | 'portfolio-case-study'
  | 'product-story'
  | 'ai-answer'
  | 'about-section';

export type NewLoomDraftOutputType = {
  id: NewLoomDraftOutputTypeId;
  label: string;
  goal: string;
  starterTitle: string;
  starterBody: string;
  promptInstruction: string;
};

export const NEW_LOOM_DRAFT_OUTPUT_TYPES: readonly NewLoomDraftOutputType[] = [
  {
    id: 'course-note',
    label: 'Course Note',
    goal: 'Turn source material into a structured learning note with definitions, examples, and checks.',
    starterTitle: 'Course note',
    starterBody: [
      '# Course Note',
      '',
      '## Core idea',
      '',
      '## Source evidence',
      '',
      '## Worked explanation',
      '',
      '## Open questions',
    ].join('\n'),
    promptInstruction:
      'Write a precise course note. Define key concepts, preserve source boundaries, and include examples only when they are grounded in attached references.',
  },
  {
    id: 'portfolio-case-study',
    label: 'Portfolio Case Study',
    goal: 'Convert a project or learning process into a reviewable portfolio case study.',
    starterTitle: 'Portfolio case study',
    starterBody: [
      '# Portfolio Case Study',
      '',
      '## Context',
      '',
      '## Problem',
      '',
      '## Process',
      '',
      '## Evidence',
      '',
      '## Result',
    ].join('\n'),
    promptInstruction:
      'Write a portfolio case study with context, problem, process, evidence, and result. Keep claims inspectable through the attached sources.',
  },
  {
    id: 'product-story',
    label: 'Product Story',
    goal: 'Explain how a product idea evolved from history, sources, decisions, and visible artifacts.',
    starterTitle: 'Product story',
    starterBody: [
      '# Product Story',
      '',
      '## Origin',
      '',
      '## Why it changed',
      '',
      '## Current shape',
      '',
      '## Proof',
      '',
      '## Next step',
    ].join('\n'),
    promptInstruction:
      'Explain the product evolution, the decision history, and the current product shape. Avoid generic startup language; ground the story in real artifacts.',
  },
  {
    id: 'ai-answer',
    label: 'AI Answer',
    goal: 'Generate a source-grounded answer that can be shown inside the personal AI surface.',
    starterTitle: 'AI answer',
    starterBody: [
      '# AI Answer',
      '',
      '## Question',
      '',
      '## Answer',
      '',
      '## Sources used',
    ].join('\n'),
    promptInstruction:
      'Answer directly, cite only attached or selected source context, and separate confirmed facts from interpretation.',
  },
  {
    id: 'about-section',
    label: 'About Section',
    goal: 'Draft public profile copy for a personal knowledge identity without losing evidence.',
    starterTitle: 'About section',
    starterBody: [
      '# About Section',
      '',
      '## Identity',
      '',
      '## Learning path',
      '',
      '## Work and interests',
      '',
      '## Evidence',
    ].join('\n'),
    promptInstruction:
      'Write polished profile copy from source evidence. Keep it personal, concrete, and suitable for a public Loom profile.',
  },
] as const;

export const DEFAULT_NEW_LOOM_DRAFT_OUTPUT_TYPE_ID: NewLoomDraftOutputTypeId = 'course-note';

export function newLoomDraftOutputTypeForId(value: string | undefined): NewLoomDraftOutputType {
  return (
    NEW_LOOM_DRAFT_OUTPUT_TYPES.find((type) => type.id === value) ??
    NEW_LOOM_DRAFT_OUTPUT_TYPES[0]
  );
}

export type NewLoomDraftRecord = {
  id: string;
  title: string;
  body: string;
  references: NewLoomDraftReference[];
  createdAt: string;
  updatedAt: string;
};

export type DraftStorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type DraftClock = () => string;
export type DraftIdFactory = () => string;

export const NEW_LOOM_DRAFTS_KEY = 'loom.new.drafts.v1';
export const NEW_LOOM_WORKBENCH_DRAFT_KEY = 'loom.workbench.current';
export const NEW_LOOM_WORKBENCH_IMPORT_KEY = 'loom.new.drafts.imported.workbench.v1';

function defaultClock() {
  return new Date().toISOString();
}

function defaultIdFactory() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readDrafts(adapter: DraftStorageAdapter, key = NEW_LOOM_DRAFTS_KEY): NewLoomDraftRecord[] {
  const raw = adapter.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDraftRecord);
  } catch {
    return [];
  }
}

function writeDrafts(
  adapter: DraftStorageAdapter,
  drafts: NewLoomDraftRecord[],
  key = NEW_LOOM_DRAFTS_KEY,
) {
  adapter.setItem(key, JSON.stringify(drafts));
}

function isDraftReference(value: unknown): value is NewLoomDraftReference {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.label === 'string' &&
    typeof record.href === 'string' &&
    (record.kind === undefined ||
      record.kind === 'source' ||
      record.kind === 'capture' ||
      record.kind === 'url' ||
      record.kind === 'artifact-state') &&
    (record.sourceTitle === undefined || typeof record.sourceTitle === 'string') &&
    (record.category === undefined || typeof record.category === 'string') &&
    (record.sourcePath === undefined || typeof record.sourcePath === 'string') &&
    (record.excerpt === undefined || typeof record.excerpt === 'string') &&
    (record.capturedAt === undefined || typeof record.capturedAt === 'string') &&
    (record.artifactState === undefined || isDraftArtifactState(record.artifactState))
  );
}

function isDraftArtifactState(value: unknown): value is NewLoomDraftArtifactState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.targetId === 'string' &&
    record.targetId.trim().length > 0 &&
    (record.kind === undefined || typeof record.kind === 'string') &&
    (record.label === undefined || typeof record.label === 'string') &&
    (record.state === undefined || typeof record.state === 'string') &&
    (record.stateLabel === undefined || typeof record.stateLabel === 'string')
  );
}

function isDraftRecord(value: unknown): value is NewLoomDraftRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.body === 'string' &&
    Array.isArray(record.references) &&
    record.references.every(isDraftReference) &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

export function browserDraftStorage(): DraftStorageAdapter | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function listDrafts(
  adapter: DraftStorageAdapter,
  key = NEW_LOOM_DRAFTS_KEY,
): NewLoomDraftRecord[] {
  return readDrafts(adapter, key).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function mergeDraftReferences(
  existing: NewLoomDraftReference[],
  incoming: NewLoomDraftReference[],
): NewLoomDraftReference[] {
  const byHref = new Map<string, NewLoomDraftReference>();
  const merged: NewLoomDraftReference[] = [];

  for (const reference of [...existing, ...incoming]) {
    const href = reference.href.trim();
    const label = reference.label.trim();
    if (!href) continue;
    const current = byHref.get(href);
    if (current) {
      const sourceTitle = cleanOptionalString(reference.sourceTitle);
      const category = cleanOptionalString(reference.category);
      const sourcePath = cleanOptionalString(reference.sourcePath);
      const excerpt = cleanOptionalString(reference.excerpt);
      const capturedAt = cleanOptionalString(reference.capturedAt);
      const artifactState = mergeArtifactState(current.artifactState, reference.artifactState);
      if (!current.kind && reference.kind) current.kind = reference.kind;
      if (!current.sourceTitle && sourceTitle) current.sourceTitle = sourceTitle;
      if (!current.category && category) current.category = category;
      if (!current.sourcePath && sourcePath) current.sourcePath = sourcePath;
      if (!current.excerpt && excerpt) current.excerpt = excerpt;
      if (!current.capturedAt && capturedAt) current.capturedAt = capturedAt;
      if (artifactState) current.artifactState = artifactState;
      continue;
    }
    const next: NewLoomDraftReference = { label: label || href, href };
    const sourceTitle = cleanOptionalString(reference.sourceTitle);
    const category = cleanOptionalString(reference.category);
    const sourcePath = cleanOptionalString(reference.sourcePath);
    const excerpt = cleanOptionalString(reference.excerpt);
    const capturedAt = cleanOptionalString(reference.capturedAt);
    const artifactState = cleanArtifactState(reference.artifactState);
    if (reference.kind) next.kind = reference.kind;
    if (sourceTitle) next.sourceTitle = sourceTitle;
    if (category) next.category = category;
    if (sourcePath) next.sourcePath = sourcePath;
    if (excerpt) next.excerpt = excerpt;
    if (capturedAt) next.capturedAt = capturedAt;
    if (artifactState) next.artifactState = artifactState;
    byHref.set(href, next);
    merged.push(next);
  }

  return merged;
}

export function draftReferencesChanged(
  before: NewLoomDraftReference[],
  after: NewLoomDraftReference[],
): boolean {
  if (before.length !== after.length) return true;
  return before.some((reference, index) => {
    const next = after[index];
    return (
      next === undefined ||
      reference.href !== next.href ||
      reference.label !== next.label ||
      reference.kind !== next.kind ||
      cleanOptionalString(reference.sourceTitle) !== cleanOptionalString(next.sourceTitle) ||
      cleanOptionalString(reference.category) !== cleanOptionalString(next.category) ||
      cleanOptionalString(reference.sourcePath) !== cleanOptionalString(next.sourcePath) ||
      cleanOptionalString(reference.excerpt) !== cleanOptionalString(next.excerpt) ||
      cleanOptionalString(reference.capturedAt) !== cleanOptionalString(next.capturedAt) ||
      artifactStateSignature(reference.artifactState) !== artifactStateSignature(next.artifactState)
    );
  });
}

function cleanOptionalString(value: string | undefined) {
  const next = value?.trim();
  return next ? next : undefined;
}

function cleanArtifactState(value: NewLoomDraftArtifactState | undefined): NewLoomDraftArtifactState | undefined {
  if (!value) return undefined;
  const targetId = cleanOptionalString(value.targetId);
  if (!targetId) return undefined;
  const next: NewLoomDraftArtifactState = { targetId };
  const kind = cleanOptionalString(value.kind);
  const label = cleanOptionalString(value.label);
  const state = cleanOptionalString(value.state);
  const stateLabel = cleanOptionalString(value.stateLabel);
  if (kind) next.kind = kind;
  if (label) next.label = label;
  if (state) next.state = state;
  if (stateLabel) next.stateLabel = stateLabel;
  return next;
}

function mergeArtifactState(
  existing: NewLoomDraftArtifactState | undefined,
  incoming: NewLoomDraftArtifactState | undefined,
): NewLoomDraftArtifactState | undefined {
  const current = cleanArtifactState(existing);
  const next = cleanArtifactState(incoming);
  if (!current) return next;
  if (!next) return current;
  return {
    targetId: current.targetId,
    ...(current.kind ?? next.kind ? { kind: current.kind ?? next.kind } : {}),
    ...(current.label ?? next.label ? { label: current.label ?? next.label } : {}),
    ...(current.state ?? next.state ? { state: current.state ?? next.state } : {}),
    ...(current.stateLabel ?? next.stateLabel ? { stateLabel: current.stateLabel ?? next.stateLabel } : {}),
  };
}

function artifactStateSignature(value: NewLoomDraftArtifactState | undefined) {
  const artifactState = cleanArtifactState(value);
  if (!artifactState) return '';
  return [
    artifactState.targetId,
    artifactState.kind ?? '',
    artifactState.label ?? '',
    artifactState.state ?? '',
    artifactState.stateLabel ?? '',
  ].join('\u001f');
}

function referenceSourceLabel(reference: NewLoomDraftReference) {
  return cleanOptionalString(reference.sourceTitle) ?? cleanOptionalString(reference.label) ?? reference.href;
}

export function draftArtifactStateLabel(value: NewLoomDraftArtifactState | undefined) {
  const artifactState = cleanArtifactState(value);
  if (!artifactState) return undefined;
  return [
    artifactState.label,
    artifactState.kind,
    artifactState.targetId,
    artifactState.stateLabel ?? artifactState.state,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

export function draftArtifactStatePromptData(value: NewLoomDraftArtifactState | undefined) {
  const state = cleanOptionalString(cleanArtifactState(value)?.state);
  return state?.replace(/\s+/g, ' ');
}

function draftReferenceKindLabel(reference: NewLoomDraftReference) {
  if (reference.kind === 'capture') return 'Capture';
  if (reference.kind === 'artifact-state') return 'Artifact state';
  if (reference.kind === 'url') return 'URL';
  const localFileKind = draftLocalFileKindLabel(reference.href);
  if (localFileKind) return localFileKind;
  return 'Source';
}

type DraftPublicCounters = Record<NewLoomDraftReferenceKind, number>;

function publicWorkingDraftReferenceKind(
  reference: NewLoomDraftReference,
): NewLoomDraftReferenceKind {
  return reference.kind ?? 'source';
}

function publicWorkingDraftReferenceLabel(
  kind: NewLoomDraftReferenceKind,
  counters: DraftPublicCounters,
) {
  counters[kind] += 1;
  if (kind === 'capture') return `Capture reference ${counters[kind]}`;
  if (kind === 'url') return `URL reference ${counters[kind]}`;
  if (kind === 'artifact-state') return `Artifact state reference ${counters[kind]}`;
  return `Source reference ${counters[kind]}`;
}

export function publicWorkingDraftReferences(
  references: NewLoomDraftReference[],
): NewLoomDraftReference[] {
  const counters: DraftPublicCounters = {
    source: 0,
    capture: 0,
    url: 0,
    'artifact-state': 0,
  };

  return references.map((reference) => {
    const kind = publicWorkingDraftReferenceKind(reference);
    const masked: NewLoomDraftReference = {
      label: publicWorkingDraftReferenceLabel(kind, counters),
      href: '#',
    };
    if (reference.kind) masked.kind = reference.kind;
    return masked;
  });
}

function draftLocalFileKindLabel(href: string) {
  const ext = draftHrefExtension(href);
  if (!ext) return null;
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'Slide deck';
  if (ext === 'pdf') return 'PDF';
  if (['md', 'mdx', 'markdown'].includes(ext)) return 'Markdown';
  if (['png', 'jpg', 'jpeg', 'gif', 'heic', 'webp'].includes(ext)) return 'Image';
  if (['doc', 'docx', 'rtf', 'rtfd', 'pages'].includes(ext)) return 'Document';
  if (['txt', 'text'].includes(ext)) return 'Text';
  return null;
}

function draftHrefExtension(href: string) {
  const raw = href.trim();
  if (!raw) return '';
  let pathname = raw;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0] ?? raw;
  }
  const decoded = decodeURIComponent(pathname).toLowerCase();
  const match = decoded.match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export function draftReferencePromptLine(reference: NewLoomDraftReference, index: number) {
  const sourceTitle = cleanOptionalString(reference.sourceTitle);
  const href = cleanOptionalString(reference.href);
  const category = cleanOptionalString(reference.category);
  const sourcePath = cleanOptionalString(reference.sourcePath);
  const capturedAt = cleanOptionalString(reference.capturedAt);
  const excerpt = cleanOptionalString(reference.excerpt);
  const artifactStateLabel = draftArtifactStateLabel(reference.artifactState);
  const artifactStateData = draftArtifactStatePromptData(reference.artifactState);
  const parts = [
    `${index + 1}. ${draftReferenceKindLabel(reference)}: ${reference.label}`,
    sourceTitle ? `source=${sourceTitle}` : '',
    href ? `href=${href}` : '',
    category ? `category=${category}` : '',
    sourcePath ? `sourcePath=${sourcePath}` : '',
    capturedAt ? `capturedAt=${capturedAt}` : '',
    excerpt ? `excerpt=${excerpt}` : '',
    artifactStateLabel ? `artifactState=${artifactStateLabel}` : '',
    artifactStateData ? `artifactStateData=${artifactStateData}` : '',
  ].filter((part): part is string => Boolean(part));
  return parts.join(' | ');
}

export function draftReferencePromptLines(references: NewLoomDraftReference[]) {
  return references.map((reference, index) => draftReferencePromptLine(reference, index));
}

function draftSourceTileDetail(reference: NewLoomDraftReference, kindLabel: string) {
  const detailParts = [kindLabel];
  const artifactStateLabel = draftArtifactStateLabel(reference.artifactState);
  const sourceTitle = cleanOptionalString(reference.sourceTitle);
  const capturedAt = cleanOptionalString(reference.capturedAt);

  if (artifactStateLabel) {
    detailParts.push(artifactStateLabel);
  } else if (sourceTitle) {
    detailParts.push(sourceTitle);
  }

  if (capturedAt) {
    detailParts.push(capturedAt);
  }

  return detailParts.join(' · ');
}

export function draftSourceTilesFromReferences(
  references: NewLoomDraftReference[],
  options: { limit?: number } = {},
): NewLoomDraftSourceTile[] {
  const limit = Math.max(0, options.limit ?? 4);
  return references
    .map((reference) => {
      const href = reference.href.trim();
      if (!href) return null;
      const label = cleanOptionalString(reference.label) ?? href;
      const kindLabel = draftReferenceKindLabel(reference);
      const excerpt = normalizeExcerpt(reference.excerpt);
      return {
        label,
        href,
        kindLabel,
        detail: draftSourceTileDetail(reference, kindLabel),
        ...(excerpt ? { excerpt } : {}),
        canInsertQuote: Boolean(excerpt),
      };
    })
    .filter((tile): tile is NewLoomDraftSourceTile => Boolean(tile))
    .slice(0, limit);
}

function normalizeExcerpt(value: string | undefined) {
  return cleanOptionalString(value)?.replace(/\s+/g, ' ');
}

function normalizeSearch(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeCorpusKey(value: string | undefined) {
  return decodeURIComponent(value ?? '').trim().toLowerCase();
}

function corpusTokens(value: string) {
  const stop = new Set([
    'about',
    'after',
    'again',
    'also',
    'and',
    'are',
    'compare',
    'draft',
    'for',
    'from',
    'into',
    'notes',
    'the',
    'this',
    'with',
  ]);
  return Array.from(new Set(
    normalizeSearch(value)
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stop.has(token)),
  ));
}

function corpusScoreField(value: string | undefined, tokens: string[], weight: number) {
  const haystack = normalizeCorpusKey(value);
  if (!haystack) return 0;
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += weight;
  }
  return score;
}

function corpusDocScore(doc: NewLoomDraftCorpusDoc, tokens: string[]) {
  return (
    corpusScoreField(doc.title, tokens, 4) +
    corpusScoreField(doc.category, tokens, 2) +
    corpusScoreField(doc.sourcePath, tokens, 1) +
    corpusScoreField(doc.excerpt, tokens, 1) +
    corpusScoreField(doc.body, tokens, 1) +
    corpusScoreField(doc.artifactState?.targetId, tokens, 2) +
    corpusScoreField(doc.artifactState?.kind, tokens, 2) +
    corpusScoreField(doc.artifactState?.label, tokens, 2) +
    corpusScoreField(doc.artifactState?.stateLabel, tokens, 4) +
    corpusScoreField(doc.artifactState?.state, tokens, 4)
  );
}

export function selectDraftCorpusHits(input: {
  title: string;
  body: string;
  references: NewLoomDraftReference[];
  docs: NewLoomDraftCorpusDoc[];
  limit?: number;
}): NewLoomDraftCorpusHit[] {
  const tokens = corpusTokens(`${input.title}\n${input.body}`);
  if (!tokens.length) return [];
  const attached = new Set(input.references.map((reference) => normalizeCorpusKey(reference.href)));
  return input.docs
    .map((doc) => ({ ...doc, score: corpusDocScore(doc, tokens) }))
    .filter((doc): doc is NewLoomDraftCorpusHit => (
      Boolean(doc.title.trim()) &&
      Boolean(doc.href.trim()) &&
      doc.score > 0 &&
      !attached.has(normalizeCorpusKey(doc.href))
    ))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, input.limit ?? 5);
}

export function draftCorpusPromptLines(hits: NewLoomDraftCorpusHit[]): string[] {
  return hits.map((hit, index) => {
    const artifactStateLabel = draftArtifactStateLabel(hit.artifactState);
    const artifactStateData = draftArtifactStatePromptData(hit.artifactState);
    const parts = [
      `${index + 1}. Corpus: ${hit.title.trim()}`,
      cleanOptionalString(hit.category) ? `category=${hit.category!.trim()}` : '',
      `href=${hit.href.trim()}`,
      cleanOptionalString(hit.sourcePath) ? `sourcePath=${hit.sourcePath!.trim()}` : '',
      cleanOptionalString(hit.excerpt) ? `excerpt=${hit.excerpt!.trim().replace(/\s+/g, ' ')}` : '',
      artifactStateLabel ? `artifactState=${artifactStateLabel}` : '',
      artifactStateData ? `artifactStateData=${artifactStateData}` : '',
      Number.isFinite(hit.score) ? `score=${Number(hit.score.toFixed(2))}` : '',
    ].filter(Boolean);
    return parts.join(' | ');
  });
}

const DRAFT_AI_TRUNCATION_MARKER = '[truncated for provider context]';

const DEFAULT_DRAFT_AI_PROMPT_LIMITS: Required<NewLoomDraftAIPromptLimits> = {
  maxPromptChars: 6000,
  titleChars: 240,
  bodyChars: 1800,
  selectedTextChars: 1000,
  referenceLineChars: 700,
  referenceTotalChars: 1800,
  inlineLineChars: 500,
  inlineTotalChars: 1000,
  corpusLineChars: 500,
  corpusTotalChars: 1000,
};

function resolveDraftAIPromptLimits(
  limits: NewLoomDraftAIPromptLimits | undefined,
): Required<NewLoomDraftAIPromptLimits> {
  const resolved = { ...DEFAULT_DRAFT_AI_PROMPT_LIMITS };
  for (const key of Object.keys(resolved) as Array<keyof NewLoomDraftAIPromptLimits>) {
    const value = limits?.[key];
    if (Number.isFinite(value) && value !== undefined && value > 0) {
      resolved[key] = Math.floor(value);
    }
  }
  return resolved;
}

function truncateForProviderContext(value: string, maxChars: number) {
  const text = value.trim();
  if (text.length <= maxChars) return text;

  const marker = `\n${DRAFT_AI_TRUNCATION_MARKER}`;
  if (maxChars <= DRAFT_AI_TRUNCATION_MARKER.length) {
    return DRAFT_AI_TRUNCATION_MARKER.slice(0, Math.max(0, maxChars));
  }

  const prefix = text.slice(0, Math.max(0, maxChars - marker.length)).trimEnd();
  return `${prefix}${marker}`;
}

function boundedPromptLines(
  lines: string[],
  options: {
    empty: string;
    lineChars: number;
    totalChars: number;
  },
) {
  if (!lines.length) return options.empty;

  const selected: string[] = [];
  let used = 0;
  let omitted = false;

  for (const line of lines) {
    const compactLine = line.replace(/\s+/g, ' ');
    const next = truncateForProviderContext(compactLine, options.lineChars);
    const separator = selected.length > 0 ? 1 : 0;
    if (used + separator + next.length > options.totalChars) {
      const remaining = options.totalChars - used - separator;
      if (remaining > DRAFT_AI_TRUNCATION_MARKER.length + 16) {
        const bounded = truncateForProviderContext(next, remaining);
        selected.push(bounded);
        used += separator + bounded.length;
      }
      omitted = true;
      break;
    }
    selected.push(next);
    used += separator + next.length;
  }

  if (omitted && !selected.join('\n').includes(DRAFT_AI_TRUNCATION_MARKER)) {
    const separator = selected.length > 0 ? 1 : 0;
    if (used + separator + DRAFT_AI_TRUNCATION_MARKER.length <= options.totalChars) {
      selected.push(DRAFT_AI_TRUNCATION_MARKER);
    }
  }

  return selected.join('\n');
}

function boundedPromptWithFinalInstruction(input: {
  sections: string[];
  finalInstruction: string;
  maxChars: number;
}) {
  const prompt = [...input.sections, input.finalInstruction].join('\n\n');
  if (prompt.length <= input.maxChars) return prompt;

  const suffix = `\n\n${input.finalInstruction}`;
  const headBudget = input.maxChars - suffix.length;
  if (headBudget <= DRAFT_AI_TRUNCATION_MARKER.length + 16) {
    return truncateForProviderContext(prompt, input.maxChars);
  }

  return `${truncateForProviderContext(input.sections.join('\n\n'), headBudget)}${suffix}`;
}

export function buildBoundedDraftAIPrompt(input: {
  title: string;
  body: string;
  references: NewLoomDraftReference[];
  corpusHits?: NewLoomDraftCorpusHit[];
  outputTypeId?: string;
  limits?: NewLoomDraftAIPromptLimits;
}) {
  const limits = resolveDraftAIPromptLimits(input.limits);
  const outputType = newLoomDraftOutputTypeForId(input.outputTypeId);
  const title = truncateForProviderContext(
    input.title.trim() || 'Untitled draft',
    limits.titleChars,
  );
  const body = truncateForProviderContext(input.body.trim() || '(empty draft)', limits.bodyChars);
  const references = boundedPromptLines(draftReferencePromptLines(input.references), {
    empty: 'No references attached.',
    lineChars: limits.referenceLineChars,
    totalChars: limits.referenceTotalChars,
  });
  const inlineReferences = boundedPromptLines(
    draftInlineReferencePromptLines(input.body, input.references, input.corpusHits ?? []),
    {
      empty: 'No inline @references in the draft.',
      lineChars: limits.inlineLineChars,
      totalChars: limits.inlineTotalChars,
    },
  );
  const corpusContext = boundedPromptLines(draftCorpusPromptLines(input.corpusHits ?? []), {
    empty: 'No corpus context selected.',
    lineChars: limits.corpusLineChars,
    totalChars: limits.corpusTotalChars,
  });

  return boundedPromptWithFinalInstruction({
    maxChars: limits.maxPromptChars,
    sections: [
      'You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.',
      "Continue the current draft in the user's voice. Use attached references and corpus context only when they are relevant. Do not invent source claims.",
      `Output type:\n${outputType.label}\nGoal: ${outputType.goal}\nInstruction: ${outputType.promptInstruction}`,
      `Title:\n${title}`,
      `Current draft:\n${body}`,
      `Attached references:\n${references}`,
      `Inline @references:\n${inlineReferences}`,
      `Corpus context:\n${corpusContext}`,
    ],
    finalInstruction: 'Return only draft text that can be inserted into the body.',
  });
}

export function buildBoundedDraftInlineEditPrompt(input: {
  title: string;
  body: string;
  selectedText: string;
  references: NewLoomDraftReference[];
  corpusHits?: NewLoomDraftCorpusHit[];
  outputTypeId?: string;
  limits?: NewLoomDraftAIPromptLimits;
}) {
  const limits = resolveDraftAIPromptLimits(input.limits);
  const outputType = newLoomDraftOutputTypeForId(input.outputTypeId);
  const title = truncateForProviderContext(
    input.title.trim() || 'Untitled draft',
    limits.titleChars,
  );
  const body = truncateForProviderContext(input.body.trim() || '(empty draft)', limits.bodyChars);
  const selectedText = truncateForProviderContext(
    input.selectedText.trim() || '(empty selection)',
    limits.selectedTextChars,
  );
  const references = boundedPromptLines(draftReferencePromptLines(input.references), {
    empty: 'No references attached.',
    lineChars: limits.referenceLineChars,
    totalChars: limits.referenceTotalChars,
  });
  const inlineReferences = boundedPromptLines(
    draftInlineReferencePromptLines(input.body, input.references, input.corpusHits ?? []),
    {
      empty: 'No inline @references in the draft.',
      lineChars: limits.inlineLineChars,
      totalChars: limits.inlineTotalChars,
    },
  );
  const corpusContext = boundedPromptLines(draftCorpusPromptLines(input.corpusHits ?? []), {
    empty: 'No corpus context selected.',
    lineChars: limits.corpusLineChars,
    totalChars: limits.corpusTotalChars,
  });

  return boundedPromptWithFinalInstruction({
    maxChars: limits.maxPromptChars,
    sections: [
      'You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.',
      'Inline edit request:',
      'Rewrite only the selected passage. Preserve the user voice. Use attached references and corpus context only when relevant. Do not invent source claims.',
      `Output type:\n${outputType.label}\nInstruction: ${outputType.promptInstruction}`,
      `Title:\n${title}`,
      `Current draft:\n${body}`,
      `Selected passage:\n${selectedText}`,
      `Attached references:\n${references}`,
      `Inline @references:\n${inlineReferences}`,
      `Corpus context:\n${corpusContext}`,
    ],
    finalInstruction: 'Return only the replacement text for the selected passage.',
  });
}

export function draftReferenceMentionToken(doc: NewLoomDraftCorpusDoc): string {
  const hrefBase = cleanOptionalString(stripKnownExtension(referenceHrefBasename(doc.href)));
  const sourceBase = cleanOptionalString(stripKnownExtension(referenceHrefBasename(doc.sourcePath)));
  const slug = slugifyReferenceKey(hrefBase ?? sourceBase ?? doc.title) || slugifyReferenceKey(doc.title) || 'source';
  return `@${slug}${draftArtifactStateMentionSuffix(doc)}`;
}

function draftArtifactStateMentionSuffix(doc: NewLoomDraftCorpusDoc): string {
  const artifactState = cleanArtifactState(doc.artifactState);
  if (!artifactState) return '';
  const anchor = slugifyReferenceKey(artifactState.targetId) || slugifyReferenceKey(artifactState.label);
  return anchor ? `#${anchor}:state` : '';
}

export function activeDraftReferenceMention(
  body: string,
  selectionStart: number,
): NewLoomDraftActiveReferenceMention | null {
  const cursor = clampTextOffset(selectionStart, body.length);
  const prefix = body.slice(0, cursor);
  const match = /(^|[\s([{])@([A-Za-z0-9._-]*)$/.exec(prefix);
  if (!match) return null;
  const query = match[2] ?? '';
  const start = cursor - query.length - 1;
  if (start > 0 && /[A-Za-z0-9._-]/.test(body[start - 1] ?? '')) return null;
  return { start, end: cursor, query };
}

export function rankDraftReferenceCandidates(
  query: string,
  docs: NewLoomDraftCorpusDoc[],
  options: { alreadyReferenced?: Set<string> } = {},
): NewLoomDraftCorpusDoc[] {
  const referenced = new Set(
    Array.from(options.alreadyReferenced ?? []).map((href) => normalizeCorpusKey(href)),
  );
  const qText = normalizeCorpusKey(query);
  const qSlug = slugifyReferenceKey(query);

  const unreferenced = docs.filter((doc) => !referenced.has(normalizeCorpusKey(doc.href)));
  if (!qText && !qSlug) {
    return [...unreferenced].sort((a, b) => a.title.localeCompare(b.title));
  }

  return unreferenced
    .map((doc) => ({ doc, score: draftReferenceCandidateScore(doc, qText, qSlug) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map((entry) => entry.doc);
}

export function predictDraftNextReferences(input: {
  title: string;
  body: string;
  references: NewLoomDraftReference[];
  docs: NewLoomDraftCorpusDoc[];
  limit?: number;
}): NewLoomDraftPredictedReference[] {
  const tokens = corpusTokens(`${input.title}\n${input.body}`);
  if (!tokens.length) return [];
  const attached = new Set(input.references.map((reference) => normalizeCorpusKey(reference.href)));

  return input.docs
    .map((doc) => ({ ...doc, score: corpusDocScore(doc, tokens) }))
    .filter((doc): doc is NewLoomDraftCorpusHit => (
      Boolean(doc.title.trim()) &&
      Boolean(doc.href.trim()) &&
      doc.score > 0 &&
      !attached.has(normalizeCorpusKey(doc.href))
    ))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, input.limit ?? 3)
    .map((doc) => ({
      ...doc,
      token: draftReferenceMentionToken(doc),
      reason: draftReferencePredictionReason(doc, tokens),
    }));
}

export function draftReferenceFromCorpusDoc(doc: NewLoomDraftCorpusDoc): NewLoomDraftReference {
  const label = cleanOptionalString(doc.title) ?? cleanOptionalString(doc.href) ?? 'Untitled source';
  const href = cleanOptionalString(doc.href) ?? label;
  const artifactState = cleanArtifactState(doc.artifactState);
  const reference: NewLoomDraftReference = {
    label,
    href,
    kind: draftReferenceKindFromCorpusDoc(doc),
    sourceTitle: label,
  };
  const excerpt = cleanOptionalString(doc.excerpt);
  const category = cleanOptionalString(doc.category);
  const sourcePath = cleanOptionalString(doc.sourcePath);
  if (category) reference.category = category;
  if (sourcePath) reference.sourcePath = sourcePath;
  if (excerpt) reference.excerpt = excerpt;
  if (artifactState) reference.artifactState = artifactState;
  return reference;
}

export function insertDraftReferenceMention(
  body: string,
  selectionStart: number,
  selectionEnd: number,
  doc: NewLoomDraftCorpusDoc,
): NewLoomDraftReferenceMentionInsert {
  const start = clampTextOffset(selectionStart, body.length);
  const end = clampTextOffset(Math.max(selectionStart, selectionEnd), body.length);
  const token = draftReferenceMentionToken(doc);
  const before = body.slice(0, start);
  const after = body.slice(end);
  const left = before && !/\s$/.test(before) ? ' ' : '';
  const right = after ? (/^[\s.,!?;:)\]}]/.test(after) ? '' : ' ') : ' ';
  return {
    body: `${before}${left}${token}${right}${after}`,
    reference: draftReferenceFromCorpusDoc(doc),
  };
}

export function insertDraftReferenceCandidateIntoDraft(input: {
  body: string;
  selectionStart: number;
  selectionEnd: number;
  references: NewLoomDraftReference[];
  doc: NewLoomDraftCorpusDoc;
  sourceTileLimit?: number;
}): NewLoomDraftReferenceCandidateInsert {
  const inserted = insertDraftReferenceMention(
    input.body,
    input.selectionStart,
    input.selectionEnd,
    input.doc,
  );
  const references = mergeDraftReferences(input.references, [inserted.reference]);

  return {
    body: inserted.body,
    token: draftReferenceMentionToken(input.doc),
    reference: inserted.reference,
    references,
    sourceTiles: draftSourceTilesFromReferences(references, {
      limit: input.sourceTileLimit,
    }),
  };
}

function draftReferenceKindFromCorpusDoc(doc: NewLoomDraftCorpusDoc): NewLoomDraftReferenceKind {
  if (cleanArtifactState(doc.artifactState)) return 'artifact-state';
  const category = normalizeSearch(doc.category ?? '');
  const href = normalizeCorpusKey(doc.href);
  if (category.includes('capture') || href.includes('/loom-render/capture')) return 'capture';
  if (/^https?:\/\//i.test(doc.href)) return 'url';
  return 'source';
}

function draftReferenceCandidateScore(doc: NewLoomDraftCorpusDoc, qText: string, qSlug: string) {
  const token = draftReferenceMentionToken(doc).slice(1);
  return (
    draftReferenceCandidateFieldScore(token, qText, qSlug, 120, 90, 45) +
    draftReferenceCandidateFieldScore(doc.title, qText, qSlug, 80, 60, 30) +
    draftReferenceCandidateFieldScore(doc.href, qText, qSlug, 42, 28, 18) +
    draftReferenceCandidateFieldScore(doc.category, qText, qSlug, 36, 24, 16) +
    draftReferenceCandidateFieldScore(doc.sourcePath, qText, qSlug, 24, 16, 10) +
    draftReferenceCandidateFieldScore(doc.excerpt, qText, qSlug, 18, 12, 6) +
    draftReferenceCandidateFieldScore(doc.artifactState?.targetId, qText, qSlug, 64, 44, 28) +
    draftReferenceCandidateFieldScore(doc.artifactState?.label, qText, qSlug, 56, 38, 24) +
    draftReferenceCandidateFieldScore(doc.artifactState?.stateLabel, qText, qSlug, 48, 32, 22) +
    draftReferenceCandidateFieldScore(doc.artifactState?.state, qText, qSlug, 40, 26, 18) +
    draftReferenceCandidateFieldScore(doc.artifactState?.kind, qText, qSlug, 24, 16, 10)
  );
}

function draftReferenceCandidateFieldScore(
  value: string | undefined,
  qText: string,
  qSlug: string,
  exactWeight: number,
  prefixWeight: number,
  containsWeight: number,
) {
  const normalized = normalizeCorpusKey(value);
  const slug = slugifyReferenceKey(value);
  if (!normalized && !slug) return 0;
  let score = 0;
  if (qText && normalized === qText) score += exactWeight;
  if (qSlug && slug === qSlug) score += exactWeight;
  if (qText && normalized.startsWith(qText)) score += prefixWeight;
  if (qSlug && slug.startsWith(qSlug)) score += prefixWeight;
  if (qText && normalized.includes(qText)) score += containsWeight;
  if (qSlug && slug.includes(qSlug)) score += containsWeight;

  const terms = qText
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  if (terms.length > 1 && terms.every((term) => normalized.includes(term) || slug.includes(term))) {
    score += containsWeight * terms.length;
  }
  return score;
}

function draftReferencePredictionReason(doc: NewLoomDraftCorpusDoc, tokens: string[]) {
  const searchable = normalizeCorpusKey([
    doc.title,
    doc.href,
    doc.category,
    doc.sourcePath,
    doc.excerpt,
    doc.body,
    doc.artifactState?.targetId,
    doc.artifactState?.label,
    doc.artifactState?.stateLabel,
    doc.artifactState?.state,
    doc.artifactState?.kind,
  ].filter(Boolean).join(' '));
  const matches = tokens.filter((token) => searchable.includes(token)).slice(0, 3);
  return matches.length > 0
    ? `Matches draft context: ${matches.join(', ')}`
    : 'Matches draft context';
}

function clampTextOffset(value: number, length: number) {
  if (!Number.isFinite(value)) return length;
  return Math.max(0, Math.min(Math.trunc(value), length));
}

function normalizeDraftTag(value: string) {
  return value.trim().replace(/^#/, '').toLowerCase();
}

function draftTagKind(tag: string): { kind: NewLoomDraftTagKind; label: string } | undefined {
  switch (tag) {
    case 'thesis':
      return { kind: 'thesis', label: 'Thesis' };
    case 'counter':
      return { kind: 'counter', label: 'Counter' };
    case 'instance':
      return { kind: 'instance', label: 'Instance' };
    case 'question':
      return { kind: 'question', label: 'Question' };
    case 'unclear':
      return { kind: 'fog', label: 'Unclear' };
    case 'fog':
      return { kind: 'fog', label: 'Unclear' };
    case 'connection':
      return { kind: 'weft', label: 'Connection' };
    case 'weft':
      return { kind: 'weft', label: 'Connection' };
    case 'sketch':
      return { kind: 'sketch', label: 'Sketch' };
    default:
      return undefined;
  }
}

function draftCardKindLabel(kind: string | undefined) {
  switch (kind) {
    case 'thesis':
      return 'Thesis';
    case 'counter':
      return 'Counter';
    case 'instance':
      return 'Instance';
    case 'question':
      return 'Question';
    case 'fog':
      return 'Unclear';
    case 'weft':
      return 'Connection';
    case 'sketch':
      return 'Sketch';
    default:
      return 'Card';
  }
}

function draftFromTagCommandFor(value: string): NewLoomDraftFromTagCommand | null {
  const tag = normalizeDraftTag(value);
  if (!/^[a-z0-9_-]+$/.test(tag)) return null;
  const mapped = draftTagKind(tag);
  return {
    token: `#${tag}`,
    tag,
    label: mapped?.label ?? `#${tag}`,
    ...(mapped ? { kind: mapped.kind } : {}),
  };
}

export function parseDraftFromTagCommand(body: string): NewLoomDraftFromTagCommand | null {
  const match = /(?:^|\n)\s*(\/draft\s+from\s+#([A-Za-z0-9_-]+))/i.exec(body);
  if (!match) return null;
  const command = draftFromTagCommandFor(match[2] ?? '');
  if (!command) return null;
  return { ...command, token: match[1] ?? command.token };
}

function hasHashtag(value: string | undefined, tag: string) {
  if (!value) return false;
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9_-])#${escaped}(?=$|[^A-Za-z0-9_-])`, 'i').test(value);
}

export function draftCardMatchesTag(
  card: NewLoomDraftTaggedCard,
  commandOrTag: NewLoomDraftFromTagCommand | string,
): boolean {
  const command = typeof commandOrTag === 'string'
    ? draftFromTagCommandFor(commandOrTag)
    : commandOrTag;
  if (!command) return false;
  if (command.kind && normalizeDraftTag(card.kind ?? '') === command.kind) return true;
  return (
    hasHashtag(card.title, command.tag) ||
    hasHashtag(card.body, command.tag) ||
    hasHashtag(card.source, command.tag)
  );
}

function compactDraftCardText(value: string | undefined, maxLength = 600) {
  const compacted = cleanOptionalString(value)?.replace(/\s+/g, ' ');
  if (!compacted) return undefined;
  return compacted.length > maxLength ? `${compacted.slice(0, maxLength - 1)}...` : compacted;
}

export function draftFromTagPromptLines(
  command: NewLoomDraftFromTagCommand,
  cards: NewLoomDraftTaggedCard[],
): string[] {
  return cards
    .filter((card) => draftCardMatchesTag(card, command))
    .map((card, index) => {
      const label = draftCardKindLabel(card.kind);
      const title = compactDraftCardText(card.title) ?? compactDraftCardText(card.body, 80) ?? 'Untitled card';
      const body = compactDraftCardText(card.body) ?? '';
      const source = compactDraftCardText(card.source);
      return [
        `${index + 1}. ${label}: ${title}`,
        source ? `source=${source}` : '',
        body ? `body=${body}` : '',
      ].filter(Boolean).join(' | ');
    });
}

export function buildDraftFromTagPrompt(input: {
  title: string;
  body: string;
  command: NewLoomDraftFromTagCommand;
  cards: NewLoomDraftTaggedCard[];
}) {
  const title = input.title.trim() || 'Untitled draft';
  const body = input.body.trim() || '(empty draft)';
  const lines = draftFromTagPromptLines(input.command, input.cards);
  const taggedCards = lines.length > 0 ? lines.join('\n') : `No draft cards matched ${input.command.label}.`;

  return [
    'You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.',
    `Draft from tag: ${input.command.label}`,
    'Use the tagged draft cards as source material. Preserve the user voice. Do not invent source claims.',
    `Title:\n${title}`,
    `Current draft:\n${body}`,
    `Tagged draft cards:\n${taggedCards}`,
    'Return only draft text that can be inserted into the body.',
  ].join('\n\n');
}

export function appendReferenceExcerptToDraft(
  body: string,
  reference: NewLoomDraftReference,
): string {
  const excerpt = normalizeExcerpt(reference.excerpt);
  if (!excerpt) return body;
  const source = referenceSourceLabel(reference);
  const artifactState = draftArtifactStateLabel(reference.artifactState);
  const quoteBlock = artifactState
    ? `> ${excerpt}\n\nSource: ${source}\nArtifact state: ${artifactState}`
    : `> ${excerpt}\n\nSource: ${source}`;
  const prefix = body.trimEnd();
  return prefix ? `${prefix}\n\n${quoteBlock}` : quoteBlock;
}

export function insertDraftReferenceQuoteIntoDraft(input: {
  body: string;
  reference: NewLoomDraftReference;
  references: NewLoomDraftReference[];
}): NewLoomDraftReferenceQuoteInsert {
  const body = appendReferenceExcerptToDraft(input.body, input.reference);
  return {
    body,
    provenanceMatches: draftProvenanceMatches(body, input.references),
  };
}

export function draftProvenanceMatches(
  body: string,
  references: NewLoomDraftReference[],
): NewLoomDraftProvenanceMatch[] {
  const haystack = normalizeSearch(body);
  if (!haystack) return [];

  const matches: NewLoomDraftProvenanceMatch[] = [];
  const seen = new Set<string>();
  for (const reference of references) {
    const excerpt = normalizeExcerpt(reference.excerpt);
    if (!excerpt || seen.has(reference.href)) continue;
    const needle = normalizeSearch(excerpt);
    if (!needle || !haystack.includes(needle)) continue;
    seen.add(reference.href);
    matches.push({
      n: matches.length + 1,
      phrase: excerpt,
      label: referenceSourceLabel(reference),
      href: reference.href,
      ...(cleanArtifactState(reference.artifactState)
        ? { artifactState: cleanArtifactState(reference.artifactState) }
        : {}),
    });
  }
  return matches;
}

export function draftWordCount(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function draftBlocksFromBody(
  body: string,
  references: NewLoomDraftReference[] = [],
): NewLoomDraftBlock[] {
  const source = body.replace(/\r\n?/g, '\n');
  const blocks: Omit<NewLoomDraftBlock, 'id'>[] = [];
  const lines = source.split('\n');
  let offset = 0;
  let currentStart = 0;
  let currentEnd = 0;
  let currentLines: string[] = [];
  let insideFence = false;

  const flush = () => {
    if (currentLines.length === 0) return;
    const text = currentLines.join('\n');
    const kind = draftBlockKind(text);
    blocks.push({
      kind,
      text,
      start: currentStart,
      end: currentEnd,
      wordCount: draftBlockWordCount(text),
      referenceHrefs: draftBlockReferenceHrefs(text, references),
    });
    currentLines = [];
  };

  lines.forEach((line, index) => {
    const lineStart = offset;
    const lineEnd = lineStart + line.length;
    const isFence = line.trim().startsWith('```');
    const isBlank = line.trim().length === 0;
    if (isBlank && !insideFence) {
      flush();
    } else {
      if (currentLines.length === 0) currentStart = lineStart;
      currentLines.push(line);
      currentEnd = lineEnd;
    }
    if (isFence) insideFence = !insideFence;
    offset = lineEnd + (index < lines.length - 1 ? 1 : 0);
  });
  flush();

  const used = new Map<string, number>();
  return blocks.map((block) => {
    const baseId = `${block.kind}-${draftBlockSlug(block.text, block.kind) || 'block'}`;
    const count = used.get(baseId) ?? 0;
    used.set(baseId, count + 1);
    return {
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      ...block,
    };
  });
}

export function draftBlockReferenceLabels(
  block: Pick<NewLoomDraftBlock, 'referenceHrefs'>,
  references: NewLoomDraftReference[],
): NewLoomDraftBlockReferenceLabel[] {
  const byHref = new Map(references.map((reference) => [reference.href.trim(), reference]));
  const labels: NewLoomDraftBlockReferenceLabel[] = [];
  const seen = new Set<string>();

  for (const href of block.referenceHrefs) {
    const cleanHref = href.trim();
    if (!cleanHref || seen.has(cleanHref)) continue;
    const reference = byHref.get(cleanHref);
    labels.push({
      href: cleanHref,
      label: draftBlockReferenceLabel(reference, cleanHref),
      kind: reference?.kind ?? 'source',
    });
    seen.add(cleanHref);
  }

  return labels;
}

function draftBlockReferenceLabel(reference: NewLoomDraftReference | undefined, fallback: string) {
  if (!reference) return fallback;
  if (reference.kind === 'artifact-state') {
    return `${reference.artifactState?.label ?? reference.label} · artifact state`;
  }
  return reference.sourceTitle ?? reference.label ?? fallback;
}

export function applyDraftBlockEdit(body: string, edit: NewLoomDraftBlockEdit): string {
  const replacement = edit.replacement.trim();
  if (!replacement) return body;
  const block = draftBlocksFromBody(body).find((item) => item.id === edit.blockId);
  if (!block || block.text !== edit.original) return body;
  return `${body.slice(0, block.start)}${replacement}${body.slice(block.end)}`;
}

export function applyDraftBlockOperation(body: string, operation: NewLoomDraftBlockOperation): string {
  const replacement = operation.replacement.trim();
  if (!replacement) return body;
  if (
    operation.blockIds.length === 0 ||
    operation.blockIds.length !== operation.originals.length ||
    new Set(operation.blockIds).size !== operation.blockIds.length
  ) {
    return body;
  }

  const blocks = draftBlocksFromBody(body);
  const selected = operation.blockIds.map((blockId) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    return index >= 0 ? { index, block: blocks[index] } : null;
  });
  if (selected.some((entry) => entry === null)) return body;

  const entries = selected as { index: number; block: NewLoomDraftBlock }[];
  const firstIndex = entries[0]?.index;
  if (firstIndex === undefined) return body;
  if (entries.some((entry, index) => entry.index !== firstIndex + index)) return body;
  if (entries.some((entry, index) => entry.block.text !== operation.originals[index])) return body;

  const first = entries[0].block;
  const last = entries[entries.length - 1].block;
  return `${body.slice(0, first.start)}${replacement}${body.slice(last.end)}`;
}

export function draftBlockOperationDiffHunks(
  blocks: Pick<NewLoomDraftBlock, 'text'>[],
  replacement: string,
): NewLoomDraftInlineEditDiffHunk[] {
  if (!blocks.length) return [];
  return draftInlineEditDiffHunks(
    blocks.map((block) => block.text).join('\n\n'),
    replacement,
  ).filter((hunk) => hunk.text.trim().length > 0);
}

export function applyDraftInlineEdit(body: string, edit: NewLoomDraftInlineEdit): string {
  const replacement = edit.replacement.trim();
  if (!replacement) return body;
  if (!Number.isInteger(edit.start) || !Number.isInteger(edit.end)) return body;
  if (edit.start < 0 || edit.end <= edit.start || edit.end > body.length) return body;
  if (body.slice(edit.start, edit.end) !== edit.original) return body;
  return `${body.slice(0, edit.start)}${replacement}${body.slice(edit.end)}`;
}

export function draftInlineEditDiffHunks(
  original: string,
  replacement: string,
): NewLoomDraftInlineEditDiffHunk[] {
  const next = cleanOptionalString(replacement);
  if (!next) return [];

  const originalLines = diffLines(original);
  const replacementLines = diffLines(next);
  if (!originalLines.length && !replacementLines.length) return [];

  const table = Array.from({ length: originalLines.length + 1 }, () => (
    Array<number>(replacementLines.length + 1).fill(0)
  ));
  for (let i = originalLines.length - 1; i >= 0; i -= 1) {
    for (let j = replacementLines.length - 1; j >= 0; j -= 1) {
      table[i][j] = originalLines[i] === replacementLines[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const hunks: NewLoomDraftInlineEditDiffHunk[] = [];
  let i = 0;
  let j = 0;
  while (i < originalLines.length && j < replacementLines.length) {
    if (originalLines[i] === replacementLines[j]) {
      hunks.push({ kind: 'unchanged', text: originalLines[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      hunks.push({ kind: 'removed', text: originalLines[i] });
      i += 1;
    } else {
      hunks.push({ kind: 'added', text: replacementLines[j] });
      j += 1;
    }
  }
  while (i < originalLines.length) {
    hunks.push({ kind: 'removed', text: originalLines[i] });
    i += 1;
  }
  while (j < replacementLines.length) {
    hunks.push({ kind: 'added', text: replacementLines[j] });
    j += 1;
  }
  return hunks;
}

function diffLines(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  return normalized ? normalized.split('\n') : [];
}

function draftBlockKind(text: string): NewLoomDraftBlockKind {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines[0]?.startsWith('```')) return 'code';
  if (lines[0] && /^#{1,6}\s+/.test(lines[0])) return 'heading';
  if (lines.length > 0 && lines.every((line) => line.startsWith('>'))) return 'quote';
  if (lines.length > 0 && lines.every((line) => /^([-*+]\s+|\d+[.)]\s+)/.test(line))) return 'list';
  return 'paragraph';
}

function draftBlockWordCount(text: string): number {
  const cleaned = text
    .split('\n')
    .map((line) => stripDraftBlockSyntax(line))
    .join(' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

function draftBlockReferenceHrefs(text: string, references: NewLoomDraftReference[]) {
  const block = normalizeSearch(text);
  const hrefs: string[] = [];
  const seen = new Set<string>();
  for (const reference of references) {
    const href = reference.href.trim();
    if (!href || seen.has(href)) continue;
    const excerpt = normalizeExcerpt(reference.excerpt);
    const excerptNeedle = excerpt ? normalizeSearch(excerpt) : '';
    const labelNeedle = normalizeSearch(reference.sourceTitle ?? reference.label);
    const mentionToken = draftReferenceMentionToken({
      title: reference.sourceTitle ?? reference.label,
      href: reference.href,
      sourcePath: reference.sourcePath,
      artifactState: reference.artifactState,
    });
    if (
      (excerptNeedle && block.includes(excerptNeedle)) ||
      (labelNeedle && block.includes(labelNeedle)) ||
      hasDraftReferenceMention(block, mentionToken)
    ) {
      hrefs.push(href);
      seen.add(href);
    }
  }
  return hrefs;
}

function hasDraftReferenceMention(normalizedBlock: string, token: string) {
  const needle = normalizeSearch(token);
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9._#:-])${escaped}(?=$|[^A-Za-z0-9._#:-])`).test(
    normalizedBlock,
  );
}

function draftBlockSlug(text: string, kind: NewLoomDraftBlockKind) {
  const sourceLine = text.split('\n').find((line) => line.trim()) ?? '';
  return stripDraftBlockSyntax(sourceLine)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, kind === 'paragraph' ? 7 : 6)
    .join('-');
}

function stripDraftBlockSyntax(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/^([-*+]\s+|\d+[.)]\s+)/, '')
    .replace(/^\[[ xX]\]\s+/, '');
}

export function parseDraftInlineReferences(body: string): NewLoomDraftInlineReference[] {
  const mentions: NewLoomDraftInlineReference[] = [];
  const pattern =
    /(^|[^A-Za-z0-9_.])@([A-Za-z0-9][A-Za-z0-9._-]*)(?:(:p([0-9]+)(?:-([0-9]+))?)|#([A-Za-z0-9._:-]+))?/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const target = trimInlineReferenceTargetPunctuation(match[2]);
    const pageStart = match[4] ? Number.parseInt(match[4], 10) : undefined;
    const pageEnd = match[5] ? Number.parseInt(match[5], 10) : pageStart;
    const fragment = trimInlineReferencePunctuation(match[6]);
    let anchor: NewLoomDraftInlineReferenceAnchor | undefined;
    let suffix = '';

    if (pageStart && pageEnd) {
      const kind = inferPageOrSlideKind(target);
      const plural = pageStart === pageEnd ? kind : `${kind}s`;
      anchor = {
        kind,
        label: pageStart === pageEnd ? `${kind} ${pageStart}` : `${plural} ${pageStart}-${pageEnd}`,
        start: pageStart,
        end: pageEnd,
      };
      suffix = `:p${pageStart}${pageEnd === pageStart ? '' : `-${pageEnd}`}`;
    } else if (fragment) {
      const kind = fragment.includes(':') ? 'artifact-state' : 'heading';
      anchor = {
        kind,
        label: kind === 'artifact-state' ? `artifact-state ${fragment}` : `heading ${fragment}`,
        value: fragment,
      };
      suffix = `#${fragment}`;
    }

    mentions.push({
      token: `@${target}${suffix}`,
      target,
      ...(anchor ? { anchor } : {}),
    });
  }

  return mentions;
}

export function draftInlineReferencePromptLines(
  body: string,
  references: NewLoomDraftReference[],
  corpusHits: NewLoomDraftCorpusDoc[] = [],
): string[] {
  return parseDraftInlineReferences(body).map((mention, index) => {
    const artifactReference = findInlineArtifactStateReference(mention, references);
    const reference = artifactReference ?? findInlineReferenceMatch(mention, references);
    const corpusHit = reference ? undefined : findInlineReferenceCorpusMatch(mention, corpusHits);
    const artifactState = inlinePromptArtifactState(mention, reference?.artifactState, corpusHit?.artifactState);
    const artifactStateLabel = draftArtifactStateLabel(artifactState);
    const artifactStateData = draftArtifactStatePromptData(artifactState);
    const parts = [
      `${index + 1}. ${mention.token}`,
      `target=${mention.target}`,
      mention.anchor ? `anchor=${mention.anchor.label}` : '',
      reference
        ? `source=${referenceSourceLabel(reference)}`
        : corpusHit
          ? `source=Corpus: ${corpusHit.title.trim()}`
          : 'source=unattached',
      reference?.href ? `href=${reference.href}` : corpusHit?.href ? `href=${corpusHit.href.trim()}` : '',
      !reference && corpusHit?.category ? `category=${corpusHit.category.trim()}` : '',
      !reference && corpusHit?.sourcePath ? `sourcePath=${corpusHit.sourcePath.trim()}` : '',
      artifactStateLabel ? `artifactState=${artifactStateLabel}` : '',
      artifactStateData ? `artifactStateData=${artifactStateData}` : '',
    ].filter(Boolean);
    return parts.join(' | ');
  });
}

function inlinePromptArtifactState(
  mention: NewLoomDraftInlineReference,
  referenceState: NewLoomDraftArtifactState | undefined,
  corpusState: NewLoomDraftArtifactState | undefined,
) {
  const artifactState = cleanArtifactState(referenceState ?? corpusState);
  if (!artifactState) return undefined;
  const anchorValue = mention.anchor?.kind === 'artifact-state'
    ? cleanOptionalString(mention.anchor.value)
    : undefined;
  if (!anchorValue) return artifactState;
  return inlineArtifactStateMatchesAnchor(artifactState, anchorValue) ? artifactState : undefined;
}

function trimInlineReferencePunctuation(value: string | undefined) {
  return value?.replace(/[.,!?;)]+$/g, '');
}

function trimInlineReferenceTargetPunctuation(value: string | undefined) {
  return (value ?? '').replace(/[.,!?;)]+$/g, '');
}

function inferPageOrSlideKind(target: string): 'page' | 'slide' {
  const normalized = target.toLowerCase();
  return /(^|[-_.])(slides?|pptx?|keynote|key)([-_.]|$)/.test(normalized) ? 'slide' : 'page';
}

function findInlineReferenceMatch(
  mention: NewLoomDraftInlineReference,
  references: NewLoomDraftReference[],
) {
  const target = normalizeReferenceKey(mention.target);
  const targetSlug = slugifyReferenceKey(mention.target);
  const exactMatch = references.find((reference) => {
    const keys = referenceMatchKeys(reference);
    return keys.has(target) || keys.has(targetSlug);
  });
  if (exactMatch) return exactMatch;
  return uniqueScoredReferenceMatch(mention.target, references);
}

function findInlineArtifactStateReference(
  mention: NewLoomDraftInlineReference,
  references: NewLoomDraftReference[],
) {
  const anchorValue = mention.anchor?.kind === 'artifact-state'
    ? cleanOptionalString(mention.anchor.value)
    : undefined;
  if (!anchorValue) return undefined;
  return references.find((reference) => {
    const artifactState = cleanArtifactState(reference.artifactState);
    return artifactState ? inlineArtifactStateMatchesAnchor(artifactState, anchorValue) : false;
  });
}

function inlineArtifactStateMatchesAnchor(
  artifactState: NewLoomDraftArtifactState,
  anchorValue: string,
) {
  const anchorBase = anchorValue.split(':')[0] ?? anchorValue;
  const anchorKey = normalizeReferenceKey(anchorBase);
  const anchorSlug = slugifyReferenceKey(anchorBase);
  return [artifactState.targetId, artifactState.label]
    .some((value) => {
      const key = normalizeReferenceKey(value);
      const slug = slugifyReferenceKey(value);
      return Boolean((key && key === anchorKey) || (slug && slug === anchorSlug));
    });
}

function findInlineReferenceCorpusMatch(
  mention: NewLoomDraftInlineReference,
  corpusHits: NewLoomDraftCorpusDoc[],
) {
  const target = normalizeReferenceKey(mention.target);
  const targetSlug = slugifyReferenceKey(mention.target);
  const exactMatch = corpusHits.find((hit) => {
    const keys = corpusMatchKeys(hit);
    return keys.has(target) || keys.has(targetSlug);
  });
  if (exactMatch) return exactMatch;
  return uniqueScoredCorpusMatch(mention.target, corpusHits);
}

function referenceMatchKeys(reference: NewLoomDraftReference): Set<string> {
  const keys = new Set<string>();
  const add = (value: string | undefined) => {
    const normalized = normalizeReferenceKey(value);
    const slug = slugifyReferenceKey(value);
    if (normalized) keys.add(normalized);
    if (slug) keys.add(slug);
  };

  add(reference.label);
  add(reference.sourceTitle);
  add(reference.category);
  add(reference.sourcePath);
  add(reference.href);
  add(reference.artifactState?.targetId);
  add(reference.artifactState?.label);

  const basename = referenceHrefBasename(reference.href);
  add(basename);
  add(stripKnownExtension(basename));

  return keys;
}

function uniqueScoredReferenceMatch(
  target: string,
  references: NewLoomDraftReference[],
): NewLoomDraftReference | undefined {
  const qText = normalizeReferenceKey(target);
  const qSlug = slugifyReferenceKey(target);
  const scored = references
    .map((reference) => ({
      reference,
      score: referenceAliasScore(reference, qText, qSlug),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.reference.label.localeCompare(b.reference.label));
  if (scored.length === 0) return undefined;
  const top = scored[0];
  const runnerUp = scored[1];
  return runnerUp && runnerUp.score === top.score ? undefined : top.reference;
}

function referenceAliasScore(
  reference: NewLoomDraftReference,
  qText: string,
  qSlug: string,
) {
  const basename = referenceHrefBasename(reference.href);
  return (
    draftReferenceCandidateFieldScore(reference.label, qText, qSlug, 80, 56, 28) +
    draftReferenceCandidateFieldScore(reference.sourceTitle, qText, qSlug, 80, 56, 28) +
    draftReferenceCandidateFieldScore(reference.category, qText, qSlug, 36, 24, 16) +
    draftReferenceCandidateFieldScore(reference.sourcePath, qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(reference.href, qText, qSlug, 24, 16, 8) +
    draftReferenceCandidateFieldScore(basename, qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(stripKnownExtension(basename), qText, qSlug, 56, 40, 22) +
    draftReferenceCandidateFieldScore(reference.artifactState?.targetId, qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(reference.artifactState?.label, qText, qSlug, 48, 34, 18)
  );
}

function corpusMatchKeys(hit: NewLoomDraftCorpusDoc): Set<string> {
  const keys = new Set<string>();
  const add = (value: string | undefined) => {
    const normalized = normalizeReferenceKey(value);
    const slug = slugifyReferenceKey(value);
    if (normalized) keys.add(normalized);
    if (slug) keys.add(slug);
  };

  add(hit.title);
  add(hit.href);
  add(hit.category);
  add(hit.sourcePath);
  add(hit.artifactState?.targetId);
  add(hit.artifactState?.label);

  const basename = referenceHrefBasename(hit.href);
  add(basename);
  add(stripKnownExtension(basename));

  return keys;
}

function uniqueScoredCorpusMatch(
  target: string,
  corpusHits: NewLoomDraftCorpusDoc[],
): NewLoomDraftCorpusDoc | undefined {
  const qText = normalizeReferenceKey(target);
  const qSlug = slugifyReferenceKey(target);
  const scored = corpusHits
    .map((hit) => ({
      hit,
      score: corpusAliasScore(hit, qText, qSlug),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title));
  if (scored.length === 0) return undefined;
  const top = scored[0];
  const runnerUp = scored[1];
  return runnerUp && runnerUp.score === top.score ? undefined : top.hit;
}

function corpusAliasScore(
  hit: NewLoomDraftCorpusDoc,
  qText: string,
  qSlug: string,
) {
  const basename = referenceHrefBasename(hit.href);
  const sourceBasename = referenceHrefBasename(hit.sourcePath);
  return (
    draftReferenceCandidateFieldScore(hit.title, qText, qSlug, 80, 56, 28) +
    draftReferenceCandidateFieldScore(hit.href, qText, qSlug, 24, 16, 8) +
    draftReferenceCandidateFieldScore(hit.category, qText, qSlug, 36, 24, 12) +
    draftReferenceCandidateFieldScore(hit.sourcePath, qText, qSlug, 24, 16, 8) +
    draftReferenceCandidateFieldScore(basename, qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(stripKnownExtension(basename), qText, qSlug, 56, 40, 22) +
    draftReferenceCandidateFieldScore(sourceBasename, qText, qSlug, 40, 28, 14) +
    draftReferenceCandidateFieldScore(stripKnownExtension(sourceBasename), qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(hit.artifactState?.targetId, qText, qSlug, 48, 34, 18) +
    draftReferenceCandidateFieldScore(hit.artifactState?.label, qText, qSlug, 48, 34, 18)
  );
}

function normalizeReferenceKey(value: string | undefined) {
  return decodeURIComponent(value ?? '').trim().toLowerCase();
}

function slugifyReferenceKey(value: string | undefined) {
  return normalizeReferenceKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function referenceHrefBasename(href: string | undefined) {
  const cleaned = (href ?? '').split(/[?#]/, 1)[0] ?? '';
  return cleaned.split('/').filter(Boolean).pop() ?? '';
}

function stripKnownExtension(value: string | undefined) {
  return (value ?? '').replace(/\.(pdf|pptx?|key|pages|mdx?|markdown|txt|docx?|rtfd?)$/i, '');
}

export function createDraft(
  adapter: DraftStorageAdapter,
  input: {
    title?: string;
    body?: string;
    references?: NewLoomDraftReference[];
  } = {},
  options: {
    key?: string;
    now?: DraftClock;
    createId?: DraftIdFactory;
  } = {},
): NewLoomDraftRecord {
  const now = options.now ?? defaultClock;
  const createId = options.createId ?? defaultIdFactory;
  const timestamp = now();
  const draft: NewLoomDraftRecord = {
    id: createId(),
    title: input.title?.trim() || 'Untitled draft',
    body: input.body ?? '',
    references: input.references ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const drafts = readDrafts(adapter, options.key);
  writeDrafts(adapter, [draft, ...drafts], options.key);
  return draft;
}

export function updateDraft(
  adapter: DraftStorageAdapter,
  id: string,
  patch: Partial<Pick<NewLoomDraftRecord, 'title' | 'body' | 'references'>>,
  options: {
    key?: string;
    now?: DraftClock;
  } = {},
): NewLoomDraftRecord {
  const drafts = readDrafts(adapter, options.key);
  const index = drafts.findIndex((draft) => draft.id === id);
  if (index < 0) throw new Error(`Draft not found: ${id}`);

  const existing = drafts[index]!;
  const next: NewLoomDraftRecord = {
    ...existing,
    title: patch.title?.trim() || existing.title,
    body: patch.body ?? existing.body,
    references: patch.references ?? existing.references,
    updatedAt: (options.now ?? defaultClock)(),
  };
  drafts[index] = next;
  writeDrafts(adapter, drafts, options.key);
  return next;
}

export function importWorkbenchDraft(
  adapter: DraftStorageAdapter,
  draft: NewLoomDraftRecord,
  options: {
    key?: string;
    now?: DraftClock;
  } = {},
): NewLoomDraftRecord {
  if (adapter.getItem(NEW_LOOM_WORKBENCH_IMPORT_KEY)) return draft;

  const legacyBody = adapter.getItem(NEW_LOOM_WORKBENCH_DRAFT_KEY)?.trim() ?? '';
  adapter.setItem(NEW_LOOM_WORKBENCH_IMPORT_KEY, '1');
  if (!legacyBody || draft.body.trim()) return draft;

  return updateDraft(adapter, draft.id, { body: legacyBody }, options);
}
