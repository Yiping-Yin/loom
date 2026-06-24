import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  notifyArtifactAdded, onArtifactAdded, notifyArtifactDeleted, onArtifactDeleted,
} from '../lib/artifact/artifact-events';

function withWindow(fn: () => void) {
  const handlers: Record<string, ((e: unknown) => void) | undefined> = {};
  (globalThis as Record<string, unknown>).window = {
    dispatchEvent: (e: { type: string }) => { handlers[e.type]?.(e); return true; },
    addEventListener: (t: string, cb: (e: unknown) => void) => { handlers[t] = cb; },
    removeEventListener: (t: string) => { handlers[t] = undefined; },
  };
  try { fn(); } finally { delete (globalThis as Record<string, unknown>).window; }
}

test('added/deleted events fire with the affected id, and unsubscribe; distinct channels', () => {
  withWindow(() => {
    const addedIds: string[] = [];
    const deletedIds: string[] = [];
    const offA = onArtifactAdded((id) => { addedIds.push(id); });
    const offD = onArtifactDeleted((id) => { deletedIds.push(id); });
    notifyArtifactAdded('a');
    notifyArtifactDeleted('b');
    assert.deepEqual(addedIds, ['a']);
    assert.deepEqual(deletedIds, ['b']); // the deleted id is delivered (id-specific remove)
    offA();
    offD();
    notifyArtifactAdded('a');
    notifyArtifactDeleted('b');
    assert.deepEqual(addedIds, ['a']);
    assert.deepEqual(deletedIds, ['b']);
  });
});

test('notify is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => notifyArtifactAdded('a'));
  assert.doesNotThrow(() => notifyArtifactDeleted('a'));
});
