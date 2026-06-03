import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

test('ExaminerOverlay does not emit routine resume checks as console warnings', () => {
  const source = readFileSync(resolve('components/ExaminerOverlay.tsx'), 'utf8');

  assert.equal(
    source.includes("console.warn('[loom-app-shell] consumeOverlayResume:examiner'"),
    false,
  );
});
