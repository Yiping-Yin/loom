import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(__dirname, '..');

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

async function buildCitationFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'loom-reference-citations-'));
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
          categoryLabel: 'Quantnet',
          title: 'Python Foundations.pdf',
          fileSlug: 'python-foundations',
          sourcePath: 'Quant/Python Foundations.pdf',
          role: 'Programming source',
          subcategory: 'Python for Quant',
          previewLines: ['Python foundations for quant work', 'Direct source behind the programming artifact'],
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
  return {
    cwd: repoRoot,
    env: {
      LOOM_REFERENCE_WIKI_ROOT: wikiRoot,
      LOOM_REFERENCE_SOURCE_MANIFEST: manifestPath,
    },
  };
}

test('reference registry exposes AI citation candidates from the same manifest sources', async () => {
  const registry = await repoImport('lib/new-loom/reference-source-registry.ts') as {
    listReferenceCitationCandidates?: (options: {
      cwd: string;
      env: Record<string, string>;
    }) => Array<{
      sourceId: string;
      title: string;
      href: string;
      category: string;
      sourcePath: string;
      preview: string;
      promptLine: string;
      kind: string;
      draftCorpusDoc?: {
        title: string;
        href: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
        body?: string;
      };
    }>;
  };

  assert.equal(typeof registry.listReferenceCitationCandidates, 'function');
  const candidates = registry.listReferenceCitationCandidates!(await buildCitationFixture());
  assert.equal(candidates.length, 2);

  const quantnet = candidates.find((candidate) => candidate.sourceId === 'ref-quantnet-python-foundations');
  assert.ok(quantnet);
  assert.equal(quantnet.title, 'Python Foundations.pdf');
  assert.equal(quantnet.href, '/knowledge/quantnet/python-foundations');
  assert.equal(quantnet.category, 'Quantnet');
  assert.equal(quantnet.sourcePath, 'Quant/Python Foundations.pdf');
  assert.equal(quantnet.kind, 'reference-citation');
  assert.match(quantnet.preview, /Python foundations for quant work/);
  assert.match(quantnet.promptLine, /sourceId=ref-quantnet-python-foundations/);
  assert.match(quantnet.promptLine, /href=\/knowledge\/quantnet\/python-foundations/);
  assert.match(quantnet.promptLine, /sourcePath=Quant\/Python Foundations\.pdf/);
  assert.deepEqual(quantnet.draftCorpusDoc, {
    title: 'Python Foundations.pdf',
    href: '/knowledge/quantnet/python-foundations',
    category: 'Quantnet',
    sourcePath: 'Quant/Python Foundations.pdf',
    excerpt: 'Python foundations for quant work Direct source behind the programming artifact',
    body: quantnet.promptLine,
  });
});

test('reference citation API returns registry candidates for Draft and Ask surfaces', async (t) => {
  const previousWikiRoot = process.env.LOOM_REFERENCE_WIKI_ROOT;
  const previousManifest = process.env.LOOM_REFERENCE_SOURCE_MANIFEST;
  const fixture = await buildCitationFixture();
  process.env.LOOM_REFERENCE_WIKI_ROOT = fixture.env.LOOM_REFERENCE_WIKI_ROOT;
  process.env.LOOM_REFERENCE_SOURCE_MANIFEST = fixture.env.LOOM_REFERENCE_SOURCE_MANIFEST;
  t.after(() => {
    if (previousWikiRoot === undefined) delete process.env.LOOM_REFERENCE_WIKI_ROOT;
    else process.env.LOOM_REFERENCE_WIKI_ROOT = previousWikiRoot;
    if (previousManifest === undefined) delete process.env.LOOM_REFERENCE_SOURCE_MANIFEST;
    else process.env.LOOM_REFERENCE_SOURCE_MANIFEST = previousManifest;
  });

  const route = await repoImport('app/api/reference-citations/route.ts') as {
    GET: () => Promise<Response>;
  };
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  const payload = await response.json() as {
    candidates: Array<{ sourceId: string; href: string; promptLine: string }>;
  };
  assert.deepEqual(
    payload.candidates.map((candidate) => candidate.sourceId).sort(),
    ['ref-claude-certificate', 'ref-quantnet-python-foundations'],
  );
  assert.ok(payload.candidates.every((candidate) => candidate.href.startsWith('/knowledge/')));
  assert.ok(payload.candidates.every((candidate) => candidate.promptLine.includes('sourceId=')));
});
