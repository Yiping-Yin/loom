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

test('added/deleted events fire and unsubscribe; distinct channels', () => {
  withWindow(() => {
    let added = 0;
    let deleted = 0;
    const offA = onArtifactAdded(() => { added += 1; });
    const offD = onArtifactDeleted(() => { deleted += 1; });
    notifyArtifactAdded('a');
    notifyArtifactDeleted('b');
    assert.equal(added, 1);
    assert.equal(deleted, 1);
    offA();
    offD();
    notifyArtifactAdded('a');
    notifyArtifactDeleted('b');
    assert.equal(added, 1);
    assert.equal(deleted, 1);
  });
});

test('notify is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => notifyArtifactAdded('a'));
  assert.doesNotThrow(() => notifyArtifactDeleted('a'));
});
