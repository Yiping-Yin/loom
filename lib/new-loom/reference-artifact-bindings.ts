import { existsSync, readFileSync, statSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { KnowledgeDoc } from '../knowledge-types';
import type {
  VerifiedDossierArtifact,
  VerifiedDossierFileKind,
} from './verified-dossier-home';

type ReferenceShelfSlug = 'quantnet' | 'wqu' | 'claude';

type ReferenceArtifactSource = {
  id: string;
  categorySlug: ReferenceShelfSlug;
  categoryLabel: string;
  title: string;
  fileSlug: string;
  sourcePath: string;
  role: string;
  subcategory: string;
  previewLines: readonly string[];
};

type ReferenceWikiRootOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
};

type ReferenceSourceManifestOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
};

type ReferenceSourceManifest = {
  sources: readonly ReferenceArtifactSource[];
};

export function referenceWikiRoot(options: ReferenceWikiRootOptions = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const configured = env.LOOM_REFERENCE_WIKI_ROOT?.trim();
  if (configured) return path.resolve(configured);
  return path.basename(cwd) === 'LOOM' ? path.dirname(cwd) : path.resolve(cwd, '..');
}

export function referenceSourceManifestPath(options: ReferenceSourceManifestOptions = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const configured = env.LOOM_REFERENCE_SOURCE_MANIFEST?.trim();
  if (configured) return path.resolve(configured);
  return path.join(cwd, 'lib/new-loom/reference-source-manifest.json');
}

function isReferenceShelfSlug(value: string): value is ReferenceShelfSlug {
  return value === 'quantnet' || value === 'wqu' || value === 'claude';
}

function readString(value: unknown, field: string, index: number) {
  if (typeof value === 'string' && value.trim()) return value;
  throw new Error(`Invalid reference source manifest entry ${index}: ${field} must be a non-empty string`);
}

function readPreviewLines(value: unknown, index: number) {
  if (
    Array.isArray(value)
    && value.length > 0
    && value.every((item) => typeof item === 'string' && item.trim())
  ) {
    return value;
  }
  throw new Error(`Invalid reference source manifest entry ${index}: previewLines must be non-empty strings`);
}

function parseReferenceSource(value: unknown, index: number): ReferenceArtifactSource {
  if (!value || typeof value !== 'object') {
    throw new Error(`Invalid reference source manifest entry ${index}: expected object`);
  }
  const record = value as Record<string, unknown>;
  const categorySlug = readString(record.categorySlug, 'categorySlug', index);
  if (!isReferenceShelfSlug(categorySlug)) {
    throw new Error(`Invalid reference source manifest entry ${index}: unsupported categorySlug`);
  }
  return {
    id: readString(record.id, 'id', index),
    categorySlug,
    categoryLabel: readString(record.categoryLabel, 'categoryLabel', index),
    title: readString(record.title, 'title', index),
    fileSlug: readString(record.fileSlug, 'fileSlug', index),
    sourcePath: readString(record.sourcePath, 'sourcePath', index),
    role: readString(record.role, 'role', index),
    subcategory: readString(record.subcategory, 'subcategory', index),
    previewLines: readPreviewLines(record.previewLines, index),
  };
}

export function readReferenceSourceManifest(
  options: ReferenceSourceManifestOptions = {},
): ReferenceSourceManifest {
  const raw = readFileSync(referenceSourceManifestPath(options), 'utf8');
  const parsed = JSON.parse(raw) as { sources?: unknown };
  if (!Array.isArray(parsed.sources)) {
    throw new Error('Invalid reference source manifest: sources must be an array');
  }
  return {
    sources: parsed.sources.map(parseReferenceSource),
  };
}

function referenceSources() {
  return readReferenceSourceManifest().sources;
}

function absolutePathFor(sourcePath: string) {
  return path.join(referenceWikiRoot(), sourcePath);
}

function extFor(sourcePath: string) {
  return path.extname(sourcePath).toLowerCase();
}

function fileKindForExt(ext: string): VerifiedDossierFileKind {
  if (ext === '.pdf') return 'pdf';
  if (ext === '.doc' || ext === '.docx') return 'word';
  if (ext === '.ppt' || ext === '.pptx') return 'ppt';
  if (ext === '.xls' || ext === '.xlsx') return 'excel';
  if (ext === '.md' || ext === '.mdx') return 'markdown';
  if (ext === '.html' || ext === '.htm') return 'html';
  return 'text';
}

function readStats(source: ReferenceArtifactSource) {
  try {
    const stats = statSync(absolutePathFor(source.sourcePath));
    return stats.isFile() ? stats : null;
  } catch {
    return null;
  }
}

function sourceToDoc(source: ReferenceArtifactSource): KnowledgeDoc | null {
  const stats = readStats(source);
  if (!stats) return null;
  const ext = extFor(source.sourcePath);
  return {
    id: source.id,
    title: source.title,
    category: source.categoryLabel,
    categorySlug: source.categorySlug,
    subcategory: source.subcategory,
    subOrder: 10,
    fileSlug: source.fileSlug,
    sourcePath: source.sourcePath,
    ext,
    size: stats.size,
    hasText: ['.html', '.htm', '.md', '.txt', '.json', '.ipynb'].includes(ext),
    preview: source.previewLines.join(' '),
  };
}

export function referenceDocsByCategory(categorySlug: string): KnowledgeDoc[] {
  return referenceSources()
    .filter((source) => source.categorySlug === categorySlug)
    .map(sourceToDoc)
    .filter((doc): doc is KnowledgeDoc => Boolean(doc));
}

export function findReferenceDoc(categorySlug: string, fileSlug: string): KnowledgeDoc | null {
  const source = referenceSources().find(
    (item) => item.categorySlug === categorySlug && item.fileSlug === fileSlug,
  );
  return source ? sourceToDoc(source) : null;
}

export function findReferenceDocById(id: string): KnowledgeDoc | null {
  const source = referenceSources().find((item) => item.id === id);
  return source ? sourceToDoc(source) : null;
}

export function referenceSourceAbsolutePath(id: string): string | null {
  const source = referenceSources().find((item) => item.id === id);
  if (!source) return null;
  const abs = absolutePathFor(source.sourcePath);
  return existsSync(abs) ? abs : null;
}

export function referenceSourceFilename(id: string): string | null {
  const doc = findReferenceDocById(id);
  return doc ? path.basename(doc.sourcePath) : null;
}

export function referenceSourceMime(id: string): string {
  const doc = findReferenceDocById(id);
  const ext = doc?.ext ?? '';
  const mime: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.ipynb': 'application/x-ipynb+json; charset=utf-8',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
  };
  return mime[ext] ?? 'application/octet-stream';
}

function artifactPreviewFor(doc: KnowledgeDoc, role: string): VerifiedDossierArtifact['preview'] {
  return {
    title: doc.title.replace(/\.[^.]+$/, ''),
    kicker: `${doc.category} / ${doc.subcategory ?? 'Source'}`,
    metadata: `${doc.ext.replace(/^\./, '').toUpperCase()} - Real local source`,
    tag: role,
    lines: doc.preview.split(/(?<=\.)\s+/).filter(Boolean).slice(0, 3),
  };
}

export function referenceArtifactsByCategory(categorySlug: string): VerifiedDossierArtifact[] {
  const artifacts: VerifiedDossierArtifact[] = [];
  for (const source of referenceSources()) {
    if (source.categorySlug !== categorySlug) continue;
    const doc = sourceToDoc(source);
    if (!doc) continue;
    artifacts.push({
      id: doc.id,
      label: doc.title,
      kind: fileKindForExt(doc.ext),
      shelf: source.categorySlug,
      role: source.role,
      href: `/knowledge/${doc.categorySlug}/${doc.fileSlug}`,
      preview: artifactPreviewFor(doc, source.role),
    });
  }
  return artifacts;
}

export async function readReferenceDocBody(id: string): Promise<string> {
  const doc = findReferenceDocById(id);
  const abs = referenceSourceAbsolutePath(id);
  if (!doc || !abs) return '';
  if (!['.html', '.htm', '.md', '.txt', '.json', '.ipynb'].includes(doc.ext)) {
    return `[Binary source: ${doc.title}]`;
  }

  const raw = await fs.readFile(abs, 'utf8');
  if (doc.ext === '.html' || doc.ext === '.htm') {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60_000);
  }
  return raw.slice(0, 60_000);
}
