import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifact,
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

test('verified source artifacts build a Draft URL with source context and AI Answer mode', async () => {
  const module = await repoImport('lib/new-loom/source-to-draft.ts') as {
    buildDraftUrlFromArtifacts?: (
      artifacts: readonly VerifiedDossierArtifact[],
      input?: { type?: string },
    ) => string;
  };

  assert.equal(typeof module.buildDraftUrlFromArtifacts, 'function');

  const url = module.buildDraftUrlFromArtifacts!([
    resolveVerifiedDossierArtifact('econ-slides'),
    resolveVerifiedDossierArtifact('econ-tutorial'),
  ], { type: 'ai-answer' });

  assert.ok(url.startsWith('/draft?'), url);
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));

  assert.equal(params.get('draftType'), 'ai-answer');
  assert.deepEqual(params.getAll('ref'), [
    '/knowledge/unsw/econ3202#econ-slides',
    '/knowledge/unsw/econ3202#econ-tutorial',
  ]);
  assert.deepEqual(params.getAll('label'), [
    'W8 A Concave-Functions.pdf',
    'W8 C Suggested Exercises.pdf',
  ]);
  assert.deepEqual(params.getAll('source'), [
    'W8 A Concave-Functions.pdf',
    'W8 C Suggested Exercises.pdf',
  ]);
  assert.deepEqual(params.getAll('kind'), ['source', 'source']);
  assert.match(params.getAll('excerpt')[0] ?? '', /Lecture source/);
  assert.match(params.getAll('artifactTargetId')[0] ?? '', /econ-slides/);
});

test('home active evidence story exposes a direct source to Draft action', () => {
  const evidenceWorkbench = read('components/verified-dossier/EvidenceWorkbench.tsx');

  assert.match(evidenceWorkbench, /buildDraftUrlFromArtifacts/);
  assert.match(evidenceWorkbench, /Draft with sources/);
});

test('home active evidence story can show Draft records created from its sources', () => {
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const evidenceWorkbench = read('components/verified-dossier/EvidenceWorkbench.tsx');

  assert.match(home, /draftRecords=\{recentDraftRecord \? \[recentDraftRecord\] : \[\]\}/);
  assert.match(evidenceWorkbench, /draftRecords/);
  assert.match(evidenceWorkbench, /Draft records/);
  assert.match(evidenceWorkbench, /draftRecordDetailHref\(record\)/);
});

test('Draft can select the requested output type from the source handoff URL', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /draftType/);
  assert.match(draftClient, /newLoomDraftOutputTypeForId\(requestedDraftType\)/);
});
