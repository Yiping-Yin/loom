import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type NewLoomDraftDocBlock,
  blocksToBody,
  bodyToBlocks,
  newDocBlock,
} from '../lib/new-loom/draft-blocks';

const idSeq = () => { let n = 0; return () => `b${++n}`; };

test('blocksToBody serializes text, code (fenced + attributed), and cite', () => {
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Intro paragraph.' },
    { id: 'b2', kind: 'code', text: 'print(1)', lang: 'python', source: 'repo/strat.py' },
    { id: 'b3', kind: 'cite', href: 'loom://s/econ', label: 'ECON3202 notes', excerpt: 'concavity' },
  ];
  const body = blocksToBody(blocks);
  assert.match(body, /Intro paragraph\./);
  assert.match(body, /```python repo\/strat\.py\nprint\(1\)\n```/);
  assert.match(body, /> concavity/);            // cite renders a quote so provenance still matches
  assert.match(body, /ECON3202 notes/);
});

test('bodyToBlocks round-trips: blocks -> body -> blocks is idempotent', () => {
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Para one.\n\nPara two.' },
    { id: 'b2', kind: 'code', text: 'const x = 1;', lang: 'ts' },
  ];
  const body = blocksToBody(blocks);
  const round = bodyToBlocks(body, [], idSeq());
  assert.equal(blocksToBody(round), body);      // serialization is stable
});

test('bodyToBlocks migrates a legacy body-only draft into text + code blocks', () => {
  const body = 'Heading line\n\nA paragraph.\n\n```js\nrun();\n```';
  const blocks = bodyToBlocks(body, [], idSeq());
  assert.ok(blocks.some((b) => b.kind === 'text'));
  assert.ok(blocks.some((b) => b.kind === 'code' && b.text.includes('run()')));
});

test('newDocBlock makes a stable empty block of each kind', () => {
  assert.equal(newDocBlock('text', () => 'x').kind, 'text');
  assert.equal(newDocBlock('code', () => 'x').kind, 'code');
});
