import { statSync } from 'node:fs';
import path from 'node:path';
import type { KnowledgeCategory, KnowledgeDoc, SourceLibraryGroup } from '../knowledge-types';
import {
  readReferenceSourceManifest,
  referenceWikiRoot,
  type ReferenceArtifactSource,
  type ReferenceSourceManifestOptions,
} from './reference-artifact-bindings';

export type ReferenceSourceRecord = {
  id: string;
  title: string;
  href: string;
  category: string;
  categorySlug: string;
  fileSlug: string;
  sourcePath: string;
  ext: string;
  size: number;
  hasText: boolean;
  preview: string;
  role: string;
  subcategory: string;
  kind: 'reference-source';
};

export type ReferenceCitationCandidate = {
  id: string;
  sourceId: string;
  title: string;
  label: string;
  href: string;
  category: string;
  categorySlug: string;
  sourcePath: string;
  ext: string;
  role: string;
  subcategory: string;
  preview: string;
  promptLine: string;
  draftCorpusDoc: {
    title: string;
    href: string;
    category: string;
    sourcePath: string;
    excerpt: string;
    body: string;
  };
  kind: 'reference-citation';
};

const REFERENCE_SOURCE_GROUP_ID = 'reference-shelves';

type StoredSearchField = {
  title?: string;
  href?: string;
  category?: string;
  sourcePath?: string;
  preview?: string;
  body?: string;
  kind?: string;
};

type SearchIndexPayload = {
  generatedAt?: unknown;
  count?: number;
  index?: {
    storedFields?: Record<string, StoredSearchField>;
    documentCount?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function absolutePathFor(source: ReferenceArtifactSource, options: ReferenceSourceManifestOptions) {
  return path.join(referenceWikiRoot(options), source.sourcePath);
}

function extFor(sourcePath: string) {
  return path.extname(sourcePath).toLowerCase();
}

function hasTextForExt(ext: string) {
  return ['.html', '.htm', '.md', '.txt', '.json', '.ipynb'].includes(ext);
}

function sourceToRecord(
  source: ReferenceArtifactSource,
  options: ReferenceSourceManifestOptions,
): ReferenceSourceRecord | null {
  try {
    const stats = statSync(absolutePathFor(source, options));
    if (!stats.isFile()) return null;
    const ext = extFor(source.sourcePath);
    const preview = source.previewLines.join(' ');
    return {
      id: source.id,
      title: source.title,
      href: `/knowledge/${source.categorySlug}/${source.fileSlug}`,
      category: source.categoryLabel,
      categorySlug: source.categorySlug,
      fileSlug: source.fileSlug,
      sourcePath: source.sourcePath,
      ext,
      size: stats.size,
      hasText: hasTextForExt(ext),
      preview,
      role: source.role,
      subcategory: source.subcategory,
      kind: 'reference-source',
    };
  } catch {
    return null;
  }
}

export function listReferenceSourceRecords(
  options: ReferenceSourceManifestOptions = {},
): ReferenceSourceRecord[] {
  let sources: readonly ReferenceArtifactSource[];
  try {
    sources = readReferenceSourceManifest(options).sources;
  } catch {
    return [];
  }

  return sources
    .map((source) => sourceToRecord(source, options))
    .filter((record): record is ReferenceSourceRecord => Boolean(record));
}

export function listReferenceSourceDocs(options: ReferenceSourceManifestOptions = {}): KnowledgeDoc[] {
  return listReferenceSourceRecords(options).map((record) => ({
    id: record.id,
    title: record.title,
    category: record.category,
    categorySlug: record.categorySlug,
    subcategory: record.subcategory,
    subOrder: 10,
    fileSlug: record.fileSlug,
    sourcePath: record.sourcePath,
    ext: record.ext,
    size: record.size,
    hasText: record.hasText,
    preview: record.preview,
  }));
}

export function listReferenceSourceCategories(
  options: ReferenceSourceManifestOptions = {},
): KnowledgeCategory[] {
  const records = listReferenceSourceRecords(options);
  const categories = new Map<string, {
    label: string;
    records: ReferenceSourceRecord[];
  }>();

  for (const record of records) {
    const category = categories.get(record.categorySlug) ?? {
      label: record.category,
      records: [],
    };
    category.records.push(record);
    categories.set(record.categorySlug, category);
  }

  return Array.from(categories.entries())
    .map(([slug, category]) => {
      const subcategoryCounts = new Map<string, number>();
      for (const record of category.records) {
        subcategoryCounts.set(record.subcategory, (subcategoryCounts.get(record.subcategory) ?? 0) + 1);
      }
      return {
        slug,
        label: category.label,
        count: category.records.length,
        kind: 'source' as const,
        subs: Array.from(subcategoryCounts.entries())
          .map(([label, count], index) => ({ label, count, order: index + 1 }))
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function mergeReferenceCategories(
  categories: readonly KnowledgeCategory[],
  options: ReferenceSourceManifestOptions = {},
): KnowledgeCategory[] {
  const existing = new Set(categories.map((category) => category.slug));
  const referenceCategories = listReferenceSourceCategories(options).filter(
    (category) => !existing.has(category.slug),
  );
  return [
    ...categories.map((category) => ({
      ...category,
      subs: category.subs.map((sub) => ({ ...sub })),
    })),
    ...referenceCategories,
  ];
}

export function appendReferenceCategoriesToSourceGroups(
  groups: readonly SourceLibraryGroup[],
  options: ReferenceSourceManifestOptions = {},
): SourceLibraryGroup[] {
  const groupedSlugs = new Set(groups.flatMap((group) => group.categories.map((category) => category.slug)));
  const referenceCategories = listReferenceSourceCategories(options).filter(
    (category) => !groupedSlugs.has(category.slug),
  );
  const clonedGroups = groups.map((group) => ({
    ...group,
    categories: group.categories.map((category) => ({
      ...category,
      subs: category.subs.map((sub) => ({ ...sub })),
    })),
  }));

  if (referenceCategories.length === 0) return clonedGroups;
  return [
    ...clonedGroups,
    {
      id: REFERENCE_SOURCE_GROUP_ID,
      label: 'Reference shelves',
      order: 5000,
      count: referenceCategories.length,
      categories: referenceCategories,
    },
  ];
}

function citationPromptLine(record: ReferenceSourceRecord) {
  return [
    `sourceId=${record.id}`,
    `title=${record.title}`,
    `category=${record.category}`,
    `role=${record.role}`,
    `href=${record.href}`,
    `sourcePath=${record.sourcePath}`,
    `preview=${record.preview}`,
  ].join(' | ');
}

export function listReferenceCitationCandidates(
  options: ReferenceSourceManifestOptions = {},
): ReferenceCitationCandidate[] {
  return listReferenceSourceRecords(options).map((record) => {
    const promptLine = citationPromptLine(record);
    return {
      id: `citation:${record.id}`,
      sourceId: record.id,
      title: record.title,
      label: record.title,
      href: record.href,
      category: record.category,
      categorySlug: record.categorySlug,
      sourcePath: record.sourcePath,
      ext: record.ext,
      role: record.role,
      subcategory: record.subcategory,
      preview: record.preview,
      promptLine,
      draftCorpusDoc: {
        title: record.title,
        href: record.href,
        category: record.category,
        sourcePath: record.sourcePath,
        excerpt: record.preview,
        body: promptLine,
      },
      kind: 'reference-citation',
    };
  });
}

function toSearchField(record: ReferenceSourceRecord): StoredSearchField {
  const body = [
    record.title,
    record.category,
    record.subcategory,
    record.role,
    record.preview,
  ].filter(Boolean).join(' ');

  return {
    title: record.title,
    href: record.href,
    category: record.category,
    sourcePath: record.sourcePath,
    preview: record.preview,
    body,
    kind: record.kind,
  };
}

export function appendReferenceSourcesToSearchIndex(
  payload: unknown,
  options: ReferenceSourceManifestOptions = {},
): SearchIndexPayload {
  const sourcePayload = (payload && typeof payload === 'object' ? payload : {}) as SearchIndexPayload;
  const sourceIndex = sourcePayload.index && typeof sourcePayload.index === 'object'
    ? sourcePayload.index
    : {};
  const sourceStored = sourceIndex.storedFields && typeof sourceIndex.storedFields === 'object'
    ? sourceIndex.storedFields
    : {};
  const storedFields: Record<string, StoredSearchField> = { ...sourceStored };
  const existingHrefs = new Set(
    Object.values(storedFields)
      .map((field) => field?.href)
      .filter((href): href is string => typeof href === 'string' && href.length > 0),
  );

  for (const record of listReferenceSourceRecords(options)) {
    if (existingHrefs.has(record.href)) continue;
    storedFields[`reference:${record.id}`] = toSearchField(record);
    existingHrefs.add(record.href);
  }

  const count = Object.keys(storedFields).length;
  return {
    ...sourcePayload,
    count,
    index: {
      ...sourceIndex,
      documentCount: count,
      storedFields,
    },
  };
}
