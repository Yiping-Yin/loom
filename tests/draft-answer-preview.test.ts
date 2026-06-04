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

test('Draft AI Answer builds a homepage answer preview with source labels', async () => {
  const preview = await repoImport('lib/new-loom/draft-answer-preview.ts') as {
    NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY?: string;
    extractDraftAnswerFromBody?: (body: string) => string;
    buildDraftAnswerPreview?: (input: {
      title: string;
      body: string;
      answer: string;
      references: Array<{ label: string; href: string; sourceTitle?: string }>;
      now?: () => string;
    }) => {
      question: string;
      answer: string;
      draftTitle: string;
      sourceLabels: string[];
      sourceHrefs: string[];
      updatedAt: string;
    };
  };

  assert.equal(preview.NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY, 'loom.new.draft.answer-preview.v1');
  assert.equal(typeof preview.buildDraftAnswerPreview, 'function');
  assert.equal(typeof preview.extractDraftAnswerFromBody, 'function');

  assert.equal(
    preview.extractDraftAnswerFromBody!([
      '# AI Answer',
      '',
      '## Question',
      'How does concavity connect to optimisation?',
      '',
      '## Answer',
      'Concavity identifies stable maximum conditions.',
      '',
      '## Sources used',
      'Lecture 8.',
    ].join('\n')),
    'Concavity identifies stable maximum conditions.',
  );

  const result = preview.buildDraftAnswerPreview!({
    title: 'Phillips Curve answer',
    body: ['# AI Answer', '', '## Question', 'What is the Phillips Curve?', '', '## Answer', 'Draft answer.'].join('\n'),
    answer: 'The Phillips Curve describes a short-run inflation and unemployment trade-off.',
    references: [
      {
        label: 'Lecture 8 Slides',
        href: '/knowledge/unsw/econ3202',
        sourceTitle: 'ECON3202 Lecture 8 Notes',
      },
    ],
    now: () => '2026-06-04T00:00:00.000Z',
  });

  assert.deepEqual(result, {
    question: 'What is the Phillips Curve?',
    answer: 'The Phillips Curve describes a short-run inflation and unemployment trade-off.',
    draftTitle: 'Phillips Curve answer',
    sourceLabels: ['ECON3202 Lecture 8 Notes'],
    sourceHrefs: ['/knowledge/unsw/econ3202'],
    updatedAt: '2026-06-04T00:00:00.000Z',
  });
});

test('Draft page can publish AI Answer output for the Digital Me answer surface', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /saveDraftAnswerPreview/);
  assert.match(draftClient, /selectedOutputTypeId === 'ai-answer'/);
  assert.match(draftClient, />\s*Publish answer preview\s*</);
});

test('Draft publish writes a persistent Draft record next to the answer preview', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /buildDraftRecord/);
  assert.match(draftClient, /saveDraftRecord/);
  assert.match(draftClient, /status:\s*'previewed'/);
  assert.match(draftClient, /draftUrl:\s*currentDraftUrl/);
});

test('Draft AI Answer exposes the complete Sources to Draft to Answer handoff state', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftPage = read('app/draft/page.tsx');

  assert.match(draftClient, /new-loom-draft__answer-flow/);
  assert.match(draftClient, /initialDraftOutputTypeIdFromLocation/);
  assert.match(draftClient, /initialDraftTypeId/);
  assert.match(
    draftClient,
    /useState<NewLoomDraftOutputTypeId>\(\(\) =>[\s\S]*initialDraftOutputTypeIdFromLocation\(initialDraftTypeId\)/,
  );
  assert.match(draftPage, /searchParams/);
  assert.match(draftPage, /initialDraftTypeId=\{draftType\}/);
  assert.match(draftClient, />\s*Sources\s*</);
  assert.match(draftClient, />\s*Draft\s*</);
  assert.match(draftClient, />\s*Answer\s*</);
  assert.match(draftClient, /Open Digital Me answer/);
  assert.match(draftClient, /href="\/digital-me#digital-me-answer-title"/);
  assert.doesNotMatch(draftClient, /href="\/#cited-answer"/);
  assert.match(draftClient, /answerPreviewState === 'saved'/);
});

test('Draft AI Answer can publish a manually written Answer section without provider output', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /extractDraftAnswerFromBody/);
  assert.match(draftClient, /draftPublishableAnswerText/);
  assert.match(draftClient, /publishAnswerPreview\(draftPublishableAnswerText\)/);
  assert.match(draftClient, /draftPublishableAnswerText\.trim\(\)/);
});

test('Digital Me owns the cited answer surface while Draft preview remains publishable', () => {
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const digitalMePage = read('app/digital-me/page.tsx');
  const answerInspector = read('components/verified-dossier/AnswerInspector.tsx');

  assert.doesNotMatch(home, /loadDraftAnswerPreview/);
  assert.doesNotMatch(home, /useDraftAnswerPreview/);
  assert.doesNotMatch(home, /draftAnswerPreview=\{draftAnswerPreview\}/);
  assert.doesNotMatch(home, /AnswerInspector/);
  assert.match(digitalMePage, /VERIFIED_DOSSIER_AI_PROMPT/);
  assert.match(digitalMePage, /digital-me-answer-title/);
  assert.match(digitalMePage, /FileBadge/);
  assert.match(digitalMePage, /citations\.map/);
  assert.match(answerInspector, /draftAnswerPreview/);
  assert.match(answerInspector, /Draft preview/);
  assert.match(answerInspector, /Draft sources/);
});

test('Draft and inspector handoff keep persistent records outside the static homepage cover', () => {
  const home = read('components/verified-dossier/VerifiedDossierHome.tsx');
  const evidenceWorkbench = read('components/verified-dossier/EvidenceWorkbench.tsx');
  const draftClient = read('app/draft/DraftClient.tsx');
  const answerInspector = read('components/verified-dossier/AnswerInspector.tsx');

  assert.doesNotMatch(home, /loadLatestDraftRecord/);
  assert.doesNotMatch(home, /draftRecordDetailHref/);
  assert.doesNotMatch(home, /NEW_LOOM_DRAFT_RECORDS_KEY/);
  assert.doesNotMatch(home, /useLatestDraftRecord/);
  assert.doesNotMatch(home, /recentDraftRecord/);
  assert.doesNotMatch(home, /draftRecords=/);
  assert.doesNotMatch(home, /draftRecord=\{recentDraftRecord\}/);
  assert.match(evidenceWorkbench, /draftRecordDetailHref\(record\)/);
  assert.match(draftClient, /\/digital-me#digital-me-answer-title/);
  assert.match(answerInspector, /draftRecord/);
  assert.match(answerInspector, /draftRecordDetailHref/);
  assert.match(answerInspector, /Draft record/);
});
