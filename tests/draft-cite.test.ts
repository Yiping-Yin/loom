import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type NewLoomDraftDocBlock,
  blocksToBody,
  citeBlockFromReference,
} from '../lib/new-loom/draft-blocks';
import type { NewLoomDraftReference } from '../lib/new-loom/draft-storage';

test('citeBlockFromReference builds a grounded cite block from a chosen reference', () => {
  const ref: NewLoomDraftReference = {
    label: 'ECON3202 notes',
    href: 'loom://s/econ',
    excerpt: 'concavity of the objective',
    kind: 'source',
  };
  assert.deepEqual(citeBlockFromReference(ref, () => 'b1'), {
    id: 'b1',
    kind: 'cite',
    href: 'loom://s/econ',
    label: 'ECON3202 notes',
    excerpt: 'concavity of the objective',
  });
});

test('citeBlockFromReference falls back to the href when the label is missing, and omits an empty excerpt', () => {
  const ref: NewLoomDraftReference = { label: '', href: 'https://example.com/x' };
  assert.deepEqual(citeBlockFromReference(ref, () => 'b2'), {
    id: 'b2',
    kind: 'cite',
    href: 'https://example.com/x',
    label: 'https://example.com/x',
  });
});

test('a cite block serializes to a quote + link so provenance still matches', () => {
  const blocks: NewLoomDraftDocBlock[] = [
    citeBlockFromReference(
      { label: 'ECON3202 notes', href: 'loom://s/econ', excerpt: 'concavity' },
      () => 'b1',
    ),
  ];
  const body = blocksToBody(blocks);
  assert.match(body, /> concavity/); // quote keeps the excerpt provenance-matchable
  assert.match(body, /\[ECON3202 notes\]\(loom:\/\/s\/econ\)/); // link form
});
