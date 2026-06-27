import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Studio Library route loads persistent Studio records', () => {
  const page = read('app/drafts/page.tsx');
  const client = read('app/drafts/DraftsClient.tsx');

  assert.match(page, /DraftsClient/);
  assert.match(client, /loadDraftRecords/);
  assert.match(client, /NEW_LOOM_DRAFT_RECORDS_KEY/);
  assert.match(client, /Studio Library/);
  assert.match(client, /Sources\s*→\s*Studio\s*→\s*Digital Me/);
  assert.match(client, /No Studio records yet/);
  assert.match(client, /Open Studio/);
});

test('Draft Detail route renders a persistent Draft Record as a published artifact', () => {
  const page = read('app/drafts/[recordId]/page.tsx');
  const client = read('app/drafts/[recordId]/DraftDetailClient.tsx');

  assert.match(page, /DraftDetailClient/);
  assert.match(page, /decodeURIComponent/);
  assert.match(client, /loadDraftRecordById/);
  assert.match(client, /Published Artifact/);
  assert.match(client, /Source trail/);
  assert.match(client, /Back to Studio Library/);
  assert.match(client, /Open Studio/);
  assert.match(client, /Record not found/);
});

test('Studio Library is the canonical entrypoint for Studio records', () => {
  const homeData = read('lib/new-loom/verified-dossier-home.ts');
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const answerInspector = read('components/verified-dossier/AnswerInspector.tsx');
  const evidenceWorkbench = read('components/verified-dossier/EvidenceWorkbench.tsx');
  const draftLibrary = read('app/drafts/DraftsClient.tsx');

  assert.doesNotMatch(homeData, /\{\s*label:\s*'Draft',\s*href:\s*'\/drafts'\s*\}/);
  assert.match(homeData, /Digital Me/);
  assert.match(draftLibrary, /Studio Library/);
  assert.doesNotMatch(home, /draftRecordDetailHref\(recentDraftRecord\)/);
  assert.doesNotMatch(home, /recentDraftRecord/);
  assert.match(answerInspector, /draftRecordDetailHref\(draftRecord\)/);
  assert.match(evidenceWorkbench, /draftRecordDetailHref\(record\)/);
  assert.match(draftLibrary, /draftRecordDetailHref\(record\)/);
  assert.match(draftLibrary, /View Artifact/);
});
