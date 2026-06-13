import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(__dirname, '..');

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Draft reference insertion returns a citation token, reference list, and source tile', async () => {
  const storage = await repoImport('lib/new-loom/draft-storage.ts') as {
    insertDraftReferenceCandidateIntoDraft?: (input: {
      body: string;
      selectionStart: number;
      selectionEnd: number;
      references: Array<{
        label: string;
        href: string;
        kind?: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
      }>;
      doc: {
        title: string;
        href: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
      };
    }) => {
      body: string;
      token: string;
      references: Array<{
        label: string;
        href: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
      }>;
      sourceTiles: Array<{
        label: string;
        href: string;
        kindLabel: string;
        detail: string;
        canInsertQuote: boolean;
      }>;
    };
    insertDraftReferenceQuoteIntoDraft?: (input: {
      body: string;
      reference: {
        label: string;
        href: string;
        kind?: string;
        sourceTitle?: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
      };
      references: Array<{
        label: string;
        href: string;
        kind?: string;
        sourceTitle?: string;
        category?: string;
        sourcePath?: string;
        excerpt?: string;
      }>;
    }) => {
      body: string;
      provenanceMatches: Array<{
        phrase: string;
        label: string;
        href: string;
      }>;
    };
  };

  assert.equal(typeof storage.insertDraftReferenceCandidateIntoDraft, 'function');
  assert.equal(typeof storage.insertDraftReferenceQuoteIntoDraft, 'function');

  const result = storage.insertDraftReferenceCandidateIntoDraft!({
    body: 'Use this ',
    selectionStart: 'Use this '.length,
    selectionEnd: 'Use this '.length,
    references: [],
    doc: {
      title: 'Python Foundations.pdf',
      href: '/knowledge/quantnet/python-foundations',
      category: 'QuantNet',
      sourcePath: 'Quant/Python Foundations.pdf',
      excerpt: 'Python foundations for quant work',
    },
  });

  assert.equal(result.token, '@python-foundations');
  assert.equal(result.body, 'Use this @python-foundations ');
  assert.deepEqual(result.references, [
    {
      label: 'Python Foundations.pdf',
      href: '/knowledge/quantnet/python-foundations',
      kind: 'source',
      sourceTitle: 'Python Foundations.pdf',
      category: 'QuantNet',
      sourcePath: 'Quant/Python Foundations.pdf',
      excerpt: 'Python foundations for quant work',
    },
  ]);
  assert.deepEqual(result.sourceTiles, [
    {
      label: 'Python Foundations.pdf',
      href: '/knowledge/quantnet/python-foundations',
      kindLabel: 'Source',
      detail: 'Source · Python Foundations.pdf',
      excerpt: 'Python foundations for quant work',
      canInsertQuote: true,
    },
  ]);

  const quoted = storage.insertDraftReferenceQuoteIntoDraft!({
    body: result.body,
    reference: result.references[0],
    references: result.references,
  });

  assert.equal(
    quoted.body,
    [
      'Use this @python-foundations',
      '> Python foundations for quant work',
      'Source: Python Foundations.pdf',
    ].join('\n\n'),
  );
  assert.deepEqual(quoted.provenanceMatches, [
    {
      n: 1,
      phrase: 'Python foundations for quant work',
      label: 'Python Foundations.pdf',
      href: '/knowledge/quantnet/python-foundations',
    },
  ]);
});

test('Draft renders Provenance in the Sources inspector beside source tiles', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(
    draftClient,
    /inspectorMode === 'sources'[\s\S]*aria-label="Source tiles"[\s\S]*aria-label="References"[\s\S]*aria-label="Provenance"[\s\S]*inspectorMode === 'edit'/,
  );
});

test('Draft page ships a complete layout stylesheet instead of browser-default controls', () => {
  const globals = read('app/globals.css');

  assert.match(globals, /\.new-loom-draft\s*\{[\s\S]*display:\s*grid/);
  assert.match(globals, /\.new-loom-draft\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(globals, /\.new-loom-draft__main\s*\{/);
  assert.match(globals, /\.new-loom-draft__title\s*\{/);
  assert.match(globals, /\.new-loom-draft__body\s*\{/);
  assert.match(globals, /\.new-loom-draft__inspector\s*\{/);
  assert.match(globals, /\.new-loom-draft__source-tile\s*\{/);
  assert.match(globals, /\.new-loom-draft__provenance\s*\{/);
});

test('Draft exposes five source-grounded output types for real Loom work', async () => {
  const storage = await repoImport('lib/new-loom/draft-storage.ts') as {
    NEW_LOOM_DRAFT_OUTPUT_TYPES?: Array<{
      id: string;
      label: string;
      goal: string;
      promptInstruction: string;
    }>;
    buildBoundedDraftAIPrompt?: (input: {
      title: string;
      body: string;
      references: [];
      outputTypeId?: string;
      limits?: { maxPromptChars?: number };
    }) => string;
  };

  assert.deepEqual(
    storage.NEW_LOOM_DRAFT_OUTPUT_TYPES?.map((type) => type.id),
    ['course-note', 'portfolio-case-study', 'product-story', 'ai-answer', 'about-section'],
  );
  assert.deepEqual(
    storage.NEW_LOOM_DRAFT_OUTPUT_TYPES?.map((type) => type.label),
    ['Course Note', 'Portfolio Case Study', 'Product Story', 'AI Answer', 'About Section'],
  );

  for (const type of storage.NEW_LOOM_DRAFT_OUTPUT_TYPES ?? []) {
    assert.ok(type.label.length > 0, `${type.id} should have a visible label`);
    assert.ok(type.goal.length > 0, `${type.id} should explain its use`);
    assert.ok(type.promptInstruction.length > 0, `${type.id} should guide AI output`);
  }

  const prompt = storage.buildBoundedDraftAIPrompt?.({
    title: 'Loom history',
    body: 'Draft from sources.',
    references: [],
    outputTypeId: 'product-story',
    limits: { maxPromptChars: 6000 },
  });

  assert.match(prompt ?? '', /Output type:\nProduct Story/);
  assert.match(prompt ?? '', /Explain the product evolution/);
});

test('Draft page renders output type controls above the writing body', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const globals = read('app/globals.css');

  assert.match(draftClient, /NEW_LOOM_DRAFT_OUTPUT_TYPES/);
  assert.match(draftClient, /selectedOutputTypeId/);
  assert.match(draftClient, /aria-label="Draft type"/);
  assert.match(draftClient, />\s*Use outline\s*</);

  assert.match(globals, /\.new-loom-draft__type-rail\s*\{/);
  assert.match(globals, /\.new-loom-draft__type-button\s*\{/);
  assert.match(globals, /\.new-loom-draft__type-button\[aria-pressed="true"\]/);
});
