import assert from 'node:assert/strict';
import test from 'node:test';
import { fileToDocBlock } from '../lib/new-loom/draft-blocks';

test('fileToDocBlock makes a code block for code files (attributed), text for prose', () => {
  assert.deepEqual(fileToDocBlock('strat.py', 'print(1)', () => 'b1'), {
    id: 'b1',
    kind: 'code',
    text: 'print(1)',
    lang: 'python',
    source: 'strat.py',
  });
  assert.equal(fileToDocBlock('notes.md', '# hi', () => 'b1').kind, 'text');
});

test('fileToDocBlock treats markdown/txt as prose with no attribution', () => {
  assert.deepEqual(fileToDocBlock('README.markdown', 'body', () => 'b2'), {
    id: 'b2',
    kind: 'text',
    text: 'body',
  });
  assert.equal(fileToDocBlock('plain.txt', 'hi', () => 'b3').kind, 'text');
});

test('fileToDocBlock attributes a code block and maps the language by extension', () => {
  const tsBlock = fileToDocBlock('Component.tsx', 'export const x = 1;', () => 'b5');
  assert.equal(tsBlock.kind, 'code');
  if (tsBlock.kind === 'code') {
    assert.equal(tsBlock.lang, 'tsx');
    assert.equal(tsBlock.source, 'Component.tsx');
    assert.equal(tsBlock.text, 'export const x = 1;');
  }
});

test('fileToDocBlock leaves lang undefined for an unknown code extension but keeps attribution', () => {
  const block = fileToDocBlock('data.xyz', 'raw', () => 'b6');
  assert.equal(block.kind, 'code');
  if (block.kind === 'code') {
    assert.equal(block.lang, undefined);
    assert.equal(block.source, 'data.xyz');
  }
});
