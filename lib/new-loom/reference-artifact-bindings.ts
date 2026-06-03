import { existsSync, statSync } from 'node:fs';
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

const PRIVATE_WIKI_ROOT = '/Users/yinyiping/Desktop/Private Wiki';

const REFERENCE_SOURCES: readonly ReferenceArtifactSource[] = [
  {
    id: 'ref-quantnet-cpp-course',
    categorySlug: 'quantnet',
    categoryLabel: 'Quantnet',
    title: 'QuantNet Online C++ Course.pdf',
    fileSlug: 'quantnet-online-cpp-course',
    sourcePath: 'Quant/C++/00_Course_Info/QuantNet_Online_C++_Course.pdf',
    role: 'Course source',
    subcategory: 'C++ / Course info',
    previewLines: [
      'Financial engineering course source',
      'C++ learning path and preparation',
      'Anchors the Quantnet shelf with a real PDF',
    ],
  },
  {
    id: 'ref-quantnet-python-foundations',
    categorySlug: 'quantnet',
    categoryLabel: 'Quantnet',
    title: 'Python Foundations.pdf',
    fileSlug: 'python-foundations',
    sourcePath: 'Quant/Python for Quant/Python Foundations/Section 1 Orientation/Python Foundations.pdf',
    role: 'Programming source',
    subcategory: 'Python for Quant / Python Foundations',
    previewLines: [
      'Python foundations for quant work',
      'Orientation material and notebook path',
      'Direct source behind the programming artifact',
    ],
  },
  {
    id: 'ref-quantnet-options-python',
    categorySlug: 'quantnet',
    categoryLabel: 'Quantnet',
    title: 'Options Pricing with Python.pdf',
    fileSlug: 'options-pricing-with-python',
    sourcePath:
      'Quant/Python for Quant/The 46-Page Ultimate Guide to Pricing Options and Implied Volatility With Python/The 46-Page Ultimate Guide to Pricing Options and Implied Volatility With Python (PDF + code).pdf',
    role: 'Pricing source',
    subcategory: 'Python for Quant / Options pricing',
    previewLines: [
      'Options pricing and implied volatility',
      'PDF plus code path',
      'Connects programming practice to finance artifacts',
    ],
  },
  {
    id: 'ref-wqu-index',
    categorySlug: 'wqu',
    categoryLabel: 'WQU',
    title: 'WQU index.html',
    fileSlug: 'wqu-index',
    sourcePath: 'WQU/index.html',
    role: 'Credential source',
    subcategory: 'Program page',
    previewLines: [
      'WorldQuant University shelf entry',
      'Credential and program record',
      'Real local HTML source',
    ],
  },
  {
    id: 'ref-claude-certificate',
    categorySlug: 'claude',
    categoryLabel: 'Claude',
    title: 'Claude Certificate.html',
    fileSlug: 'claude-certificate',
    sourcePath: 'Claude Certificate/Claude Certificate.html',
    role: 'Certificate source',
    subcategory: 'Credential evidence',
    previewLines: [
      'Claude certificate evidence',
      'Training and AI workflow record',
      'Real local HTML source',
    ],
  },
];

function absolutePathFor(sourcePath: string) {
  return path.join(PRIVATE_WIKI_ROOT, sourcePath);
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
  return REFERENCE_SOURCES
    .filter((source) => source.categorySlug === categorySlug)
    .map(sourceToDoc)
    .filter((doc): doc is KnowledgeDoc => Boolean(doc));
}

export function findReferenceDoc(categorySlug: string, fileSlug: string): KnowledgeDoc | null {
  const source = REFERENCE_SOURCES.find(
    (item) => item.categorySlug === categorySlug && item.fileSlug === fileSlug,
  );
  return source ? sourceToDoc(source) : null;
}

export function findReferenceDocById(id: string): KnowledgeDoc | null {
  const source = REFERENCE_SOURCES.find((item) => item.id === id);
  return source ? sourceToDoc(source) : null;
}

export function referenceSourceAbsolutePath(id: string): string | null {
  const source = REFERENCE_SOURCES.find((item) => item.id === id);
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
  for (const source of REFERENCE_SOURCES) {
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
