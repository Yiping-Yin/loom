import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

test('reference citation client converts API candidates into Draft corpus docs', async () => {
  const clientPath = path.join(repoRoot, 'lib/new-loom/reference-citation-client.ts');
  assert.ok(fs.existsSync(clientPath), 'reference citation client should exist');

  const client = await repoImport('lib/new-loom/reference-citation-client.ts') as {
    referenceCitationDraftCorpusDocs?: (payload: unknown) => Array<{
      title: string;
      href: string;
      category?: string;
      sourcePath?: string;
      excerpt?: string;
      body?: string;
    }>;
    mergeDraftCorpusDocs?: <T extends { href: string }>(
      primary: T[],
      secondary: T[],
    ) => T[];
  };

  assert.equal(typeof client.referenceCitationDraftCorpusDocs, 'function');
  assert.equal(typeof client.mergeDraftCorpusDocs, 'function');

  const docs = client.referenceCitationDraftCorpusDocs!({
    candidates: [
      {
        sourceId: 'ref-quantnet-python-foundations',
        draftCorpusDoc: {
          title: 'Python Foundations.pdf',
          href: '/knowledge/quantnet/python-foundations',
          category: 'Quantnet',
          sourcePath: 'Quant/Python Foundations.pdf',
          excerpt: 'Python foundations for quant work',
          body: 'sourceId=ref-quantnet-python-foundations | href=/knowledge/quantnet/python-foundations',
        },
      },
    ],
  });

  assert.deepEqual(docs, [
    {
      title: 'Python Foundations.pdf',
      href: '/knowledge/quantnet/python-foundations',
      category: 'Quantnet',
      sourcePath: 'Quant/Python Foundations.pdf',
      excerpt: 'Python foundations for quant work',
      body: 'sourceId=ref-quantnet-python-foundations | href=/knowledge/quantnet/python-foundations',
    },
  ]);

  const existingDocs: Array<{
    title: string;
    href: string;
    category?: string;
    sourcePath?: string;
    excerpt?: string;
    body?: string;
  }> = [{ title: 'Existing', href: '/knowledge/quantnet/python-foundations' }];

  assert.deepEqual(client.mergeDraftCorpusDocs!(existingDocs, docs), [
    {
      title: 'Existing',
      href: '/knowledge/quantnet/python-foundations',
      category: 'Quantnet',
      sourcePath: 'Quant/Python Foundations.pdf',
      excerpt: 'Python foundations for quant work',
      body: 'sourceId=ref-quantnet-python-foundations | href=/knowledge/quantnet/python-foundations',
    },
  ]);
});

test('Digital Me renders source-grounded citations instead of a homepage ask profile', () => {
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const digitalMePage = read('app/digital-me/page.tsx');
  const homeData = read('lib/new-loom/verified-dossier-home.ts');

  assert.doesNotMatch(home, /loadReferenceCitationCandidates/);
  assert.doesNotMatch(home, /useReferenceCitationCandidates/);
  assert.doesNotMatch(home, /citationCandidates\.length/);
  assert.doesNotMatch(home, /citationRegistryLabels=\{citationRegistryLabels\}/);
  assert.match(digitalMePage, /DIGITAL_ME_PROOF_PATH/);
  assert.match(digitalMePage, /DigitalMeRoleOSClient/);
  assert.match(digitalMePage, /digital-me-answer-title/);
  assert.match(homeData, /citations:\s*\[/);
  assert.match(homeData, /econ-ps2/);
  assert.match(homeData, /econ-slides/);
});

test('reference citation candidates stay available to Draft source corpora', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const referenceClient = read('lib/new-loom/reference-citation-client.ts');

  assert.match(referenceClient, /loadReferenceCitationDraftCorpusDocs/);
  assert.match(referenceClient, /referenceCitationDraftCorpusDocs/);
  assert.match(referenceClient, /mergeDraftCorpusDocs/);
  assert.match(draftClient, /loadReferenceCitationDraftCorpusDocs\(\)/);
  assert.match(draftClient, /mergeDraftCorpusDocs<NewLoomDraftCorpusDoc>/);
  assert.doesNotMatch(draftClient, /citationRegistryLabels/);
});
