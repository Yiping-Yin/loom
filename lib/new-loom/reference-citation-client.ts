export type ReferenceCitationDraftCorpusDoc = {
  title: string;
  href: string;
  category?: string;
  sourcePath?: string;
  excerpt?: string;
  body?: string;
};

export type ReferenceCitationClientCandidate = {
  id?: string;
  sourceId?: string;
  title: string;
  label?: string;
  href: string;
  category?: string;
  categorySlug?: string;
  sourcePath?: string;
  preview?: string;
  promptLine?: string;
  kind?: string;
  draftCorpusDoc?: ReferenceCitationDraftCorpusDoc;
};

type ReferenceCitationFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function draftCorpusDocFromRecord(record: Record<string, unknown>): ReferenceCitationDraftCorpusDoc | null {
  const title = cleanString(record.title);
  const href = cleanString(record.href);
  if (!title || !href) return null;

  return {
    title,
    href,
    ...(cleanString(record.category) ? { category: cleanString(record.category) } : {}),
    ...(cleanString(record.sourcePath) ? { sourcePath: cleanString(record.sourcePath) } : {}),
    ...(cleanString(record.excerpt) ? { excerpt: cleanString(record.excerpt) } : {}),
    ...(cleanString(record.body) ? { body: cleanString(record.body) } : {}),
  };
}

function candidateFromRecord(record: Record<string, unknown>): ReferenceCitationClientCandidate | null {
  const embeddedDoc = isRecord(record.draftCorpusDoc)
    ? draftCorpusDocFromRecord(record.draftCorpusDoc)
    : null;
  const title = cleanString(record.title) ?? cleanString(record.label) ?? embeddedDoc?.title;
  const href = cleanString(record.href) ?? embeddedDoc?.href;
  if (!title || !href) return null;

  const fallbackDoc: ReferenceCitationDraftCorpusDoc = {
    title,
    href,
    ...(cleanString(record.category) ? { category: cleanString(record.category) } : {}),
    ...(cleanString(record.sourcePath) ? { sourcePath: cleanString(record.sourcePath) } : {}),
    ...(cleanString(record.preview) ? { excerpt: cleanString(record.preview) } : {}),
    ...(cleanString(record.promptLine) ? { body: cleanString(record.promptLine) } : {}),
  };

  return {
    title,
    href,
    ...(cleanString(record.id) ? { id: cleanString(record.id) } : {}),
    ...(cleanString(record.sourceId) ? { sourceId: cleanString(record.sourceId) } : {}),
    ...(cleanString(record.label) ? { label: cleanString(record.label) } : {}),
    ...(cleanString(record.category) ? { category: cleanString(record.category) } : {}),
    ...(cleanString(record.categorySlug) ? { categorySlug: cleanString(record.categorySlug) } : {}),
    ...(cleanString(record.sourcePath) ? { sourcePath: cleanString(record.sourcePath) } : {}),
    ...(cleanString(record.preview) ? { preview: cleanString(record.preview) } : {}),
    ...(cleanString(record.promptLine) ? { promptLine: cleanString(record.promptLine) } : {}),
    ...(cleanString(record.kind) ? { kind: cleanString(record.kind) } : {}),
    draftCorpusDoc: embeddedDoc ?? fallbackDoc,
  };
}

export function referenceCitationCandidatesFromPayload(
  payload: unknown,
): ReferenceCitationClientCandidate[] {
  const candidates = isRecord(payload) && Array.isArray(payload.candidates)
    ? payload.candidates
    : [];

  return candidates
    .map((candidate) => isRecord(candidate) ? candidateFromRecord(candidate) : null)
    .filter((candidate): candidate is ReferenceCitationClientCandidate => Boolean(candidate));
}

export function referenceCitationDraftCorpusDocs(payload: unknown): ReferenceCitationDraftCorpusDoc[] {
  return referenceCitationCandidatesFromPayload(payload)
    .map((candidate) => candidate.draftCorpusDoc)
    .filter((doc): doc is ReferenceCitationDraftCorpusDoc => Boolean(doc));
}

export function mergeDraftCorpusDocs<T extends { href: string }>(
  primary: readonly T[],
  secondary: readonly T[],
): T[] {
  const indexes = new Map<string, number>();
  const merged: T[] = [];

  for (const doc of [...primary, ...secondary]) {
    const existingIndex = indexes.get(doc.href);
    if (existingIndex !== undefined) {
      merged[existingIndex] = mergeMissingDraftCorpusFields(merged[existingIndex], doc);
      continue;
    }
    indexes.set(doc.href, merged.length);
    merged.push(doc);
  }

  return merged;
}

function mergeMissingDraftCorpusFields<T extends { href: string }>(current: T, incoming: T): T {
  const merged = { ...current } as Record<string, unknown>;
  const source = incoming as Record<string, unknown>;

  for (const field of ['category', 'sourcePath', 'excerpt', 'body', 'artifactState']) {
    if (merged[field] === undefined && source[field] !== undefined) {
      merged[field] = source[field];
    }
  }

  return merged as T;
}

export async function loadReferenceCitationCandidates(
  fetcher: ReferenceCitationFetcher = fetch,
): Promise<ReferenceCitationClientCandidate[]> {
  try {
    const response = await fetcher('/api/reference-citations');
    if (!response.ok) return [];
    return referenceCitationCandidatesFromPayload(await response.json());
  } catch {
    return [];
  }
}

export async function loadReferenceCitationDraftCorpusDocs(
  fetcher: ReferenceCitationFetcher = fetch,
): Promise<ReferenceCitationDraftCorpusDoc[]> {
  try {
    const response = await fetcher('/api/reference-citations');
    if (!response.ok) return [];
    return referenceCitationDraftCorpusDocs(await response.json());
  } catch {
    return [];
  }
}
