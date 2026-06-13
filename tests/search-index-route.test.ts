import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { GET } from '../app/api/search-index/route';

const repoRoot = path.resolve(__dirname, '..');

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

test('search index route degrades to an empty usable index instead of a dev-overlay 503', async () => {
  const response = await GET();
  const payload = await response.json() as {
    index?: {
      storedFields?: Record<string, unknown>;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(typeof payload.index?.storedFields, 'object');
});

test('search index grafts manifest-backed reference sources into stored fields', async () => {
  const registryPath = path.join(repoRoot, 'lib/new-loom/reference-source-registry.ts');
  assert.ok(fs.existsSync(registryPath), 'reference source registry should exist');

  const root = await mkdtemp(path.join(os.tmpdir(), 'loom-reference-registry-'));
  const wikiRoot = path.join(root, 'wiki');
  const manifestPath = path.join(root, 'reference-source-manifest.json');
  await mkdir(path.join(wikiRoot, 'Quant'), { recursive: true });
  await mkdir(path.join(wikiRoot, 'Claude'), { recursive: true });
  await writeFile(path.join(wikiRoot, 'Quant', 'Python Foundations.pdf'), 'pdf bytes', 'utf8');
  await writeFile(path.join(wikiRoot, 'Claude', 'Claude Certificate.html'), '<h1>Claude Certificate</h1>', 'utf8');
  await writeFile(
    manifestPath,
    JSON.stringify({
      sources: [
        {
          id: 'ref-quantnet-python-foundations',
          categorySlug: 'quantnet',
          categoryLabel: 'QuantNet',
          title: 'Python Foundations.pdf',
          fileSlug: 'python-foundations',
          sourcePath: 'Quant/Python Foundations.pdf',
          role: 'Programming source',
          subcategory: 'Python for Quant',
          previewLines: ['Python foundations for quant work'],
        },
        {
          id: 'ref-claude-certificate',
          categorySlug: 'claude',
          categoryLabel: 'Claude',
          title: 'Claude Certificate.html',
          fileSlug: 'claude-certificate',
          sourcePath: 'Claude/Claude Certificate.html',
          role: 'Certificate source',
          subcategory: 'Credential evidence',
          previewLines: ['Claude certificate evidence'],
        },
      ],
    }),
    'utf8',
  );

  const registry = await repoImport('lib/new-loom/reference-source-registry.ts') as {
    appendReferenceSourcesToSearchIndex: (
      payload: unknown,
      options: { env: Record<string, string>; cwd: string },
    ) => {
      count: number;
      index: {
        storedFields: Record<string, {
          title?: string;
          href?: string;
          category?: string;
          sourcePath?: string;
          kind?: string;
        }>;
      };
    };
  };
  const merged = registry.appendReferenceSourcesToSearchIndex(
    {
      generatedAt: null,
      count: 1,
      index: {
        storedFields: {
          '0': { title: 'Existing document', href: '/wiki/existing', category: 'Wiki' },
        },
      },
    },
    {
      cwd: repoRoot,
      env: {
        LOOM_REFERENCE_WIKI_ROOT: wikiRoot,
        LOOM_REFERENCE_SOURCE_MANIFEST: manifestPath,
      },
    },
  );

  const storedFields = Object.values(merged.index.storedFields);
  assert.equal(merged.count, 3);
  assert.ok(storedFields.some((field) => field.title === 'Existing document'));
  assert.ok(storedFields.some((field) =>
    field.title === 'Python Foundations.pdf' &&
    field.href === '/knowledge/quantnet/python-foundations' &&
    field.category === 'QuantNet' &&
    field.kind === 'reference-source' &&
    field.sourcePath === 'Quant/Python Foundations.pdf'
  ));
  assert.ok(storedFields.some((field) =>
    field.title === 'Claude Certificate.html' &&
    field.href === '/knowledge/claude/claude-certificate' &&
    field.kind === 'reference-source'
  ));

  const routeSource = fs.readFileSync(path.join(repoRoot, 'app/api/search-index/route.ts'), 'utf8');
  assert.match(routeSource, /appendReferenceSourcesToSearchIndex/);
});

test('search index keeps the existing payload when the reference manifest is not installed', async () => {
  const registry = await repoImport('lib/new-loom/reference-source-registry.ts') as {
    appendReferenceSourcesToSearchIndex: (
      payload: unknown,
      options: { env: Record<string, string>; cwd: string },
    ) => {
      count: number;
      index: {
        storedFields: Record<string, { title?: string; href?: string }>;
      };
    };
  };

  const merged = registry.appendReferenceSourcesToSearchIndex(
    {
      count: 1,
      index: {
        storedFields: {
          '0': { title: 'Existing document', href: '/wiki/existing' },
        },
      },
    },
    {
      cwd: repoRoot,
      env: {
        LOOM_REFERENCE_WIKI_ROOT: '/missing/wiki-root',
        LOOM_REFERENCE_SOURCE_MANIFEST: '/missing/reference-source-manifest.json',
      },
    },
  );

  assert.equal(merged.count, 1);
  assert.deepEqual(Object.values(merged.index.storedFields), [
    { title: 'Existing document', href: '/wiki/existing' },
  ]);
});
