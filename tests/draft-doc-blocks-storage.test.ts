import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDraft,
  updateDraft,
  listDrafts,
  type DraftStorageAdapter,
} from '../lib/new-loom/draft-storage';
import { type NewLoomDraftDocBlock } from '../lib/new-loom/draft-blocks';

function mem(): DraftStorageAdapter {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}
const opts = { now: () => '2026-06-22T00:00:00.000Z', createId: () => 'd1' };

test('createDraft + updateDraft persist blocks and keep body synced from them', () => {
  const a = mem();
  const d = createDraft(a, {}, opts);
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Hello.' },
    { id: 'b2', kind: 'code', text: 'x=1', lang: 'python' },
  ];
  const next = updateDraft(a, d.id, { blocks }, { now: opts.now });
  assert.deepEqual(next.blocks, blocks);
  assert.match(next.body, /Hello\./);
  assert.match(next.body, /```python\nx=1\n```/); // body recomputed from blocks

  // Blocks + synced body survive a serialize -> deserialize round-trip in storage.
  const restored = listDrafts(a).find((draft) => draft.id === d.id);
  assert.deepEqual(restored?.blocks, blocks);
  assert.equal(restored?.body, next.body);
});
