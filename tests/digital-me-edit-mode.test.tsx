import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const gate = fs.readFileSync(path.join(repoRoot, 'app/digital-me/DigitalMeGate.tsx'), 'utf8');
const page = fs.readFileSync(path.join(repoRoot, 'app/digital-me/page.tsx'), 'utf8');

test('DigitalMeGate renders the editor in edit mode, identity otherwise', () => {
  assert.match(gate, /useSearchParams/);
  assert.match(gate, /\.has\(['"]edit['"]\)/);
  assert.match(gate, /<DraftClient\s+editId=/);
  assert.match(gate, /import \{ DraftClient \} from '\.\.\/draft\/DraftClient'/);
});

test('digital-me page wraps the gate in Suspense (useSearchParams requirement)', () => {
  assert.match(page, /Suspense/);
  assert.match(page, /loom-cosmic-field/);
});
