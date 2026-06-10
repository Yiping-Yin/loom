import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Draft Library route loads persistent Draft Records', () => {
  const page = read('app/drafts/page.tsx');
  const client = read('app/drafts/DraftsClient.tsx');

  assert.match(page, /DraftsClient/);
  assert.match(client, /loadDraftRecords/);
  assert.match(client, /NEW_LOOM_DRAFT_RECORDS_KEY/);
  assert.match(client, /Draft Library/);
  assert.match(client, /Sources\s*→\s*Draft\s*→\s*Answer/);
  assert.match(client, /No Draft records yet/);
  assert.match(client, /Open Draft/);
});

test('Draft Detail route renders a persistent Draft Record as a published artifact', () => {
  const page = read('app/drafts/[recordId]/page.tsx');
  const client = read('app/drafts/[recordId]/DraftDetailClient.tsx');

  assert.match(page, /DraftDetailClient/);
  assert.match(page, /decodeURIComponent/);
  assert.match(client, /loadDraftRecordById/);
  assert.match(client, /Published Artifact/);
  assert.match(client, /Source trail/);
  assert.match(client, /Back to Draft Library/);
  assert.match(client, /Open Draft/);
  assert.match(client, /Record not found/);
});

test('Draft Library is the canonical entrypoint for Draft Records', () => {
  const homeData = read('lib/new-loom/verified-dossier-home.ts');
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const answerInspector = read('components/verified-dossier/AnswerInspector.tsx');
  const evidenceWorkbench = read('components/verified-dossier/EvidenceWorkbench.tsx');
  const draftLibrary = read('app/drafts/DraftsClient.tsx');

  assert.doesNotMatch(homeData, /\{\s*label:\s*'Draft',\s*href:\s*'\/drafts'\s*\}/);
  assert.match(homeData, /Digital Me/);
  assert.match(draftLibrary, /Draft Library/);
  assert.doesNotMatch(home, /draftRecordDetailHref\(recentDraftRecord\)/);
  assert.doesNotMatch(home, /recentDraftRecord/);
  assert.match(answerInspector, /draftRecordDetailHref\(draftRecord\)/);
  assert.match(evidenceWorkbench, /draftRecordDetailHref\(record\)/);
  assert.match(draftLibrary, /draftRecordDetailHref\(record\)/);
  assert.match(draftLibrary, /View Artifact/);
});
