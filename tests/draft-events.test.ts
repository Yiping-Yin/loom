import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyDraftsChanged, onDraftsChange } from '../lib/sync/draft-events';

test('onDraftsChange fires on notify and unsubscribes', () => {
  let cb: ((e: unknown) => void) | undefined;
  (globalThis as Record<string, unknown>).window = {
    dispatchEvent: (e: unknown) => { cb?.(e); return true; },
    addEventListener: (_t: string, handler: (e: unknown) => void) => { cb = handler; },
    removeEventListener: () => { cb = undefined; },
  };
  try {
    let n = 0;
    const off = onDraftsChange(() => { n += 1; });
    notifyDraftsChanged();
    assert.equal(n, 1);
    off();
    notifyDraftsChanged();
    assert.equal(n, 1);
  } finally {
    delete (globalThis as Record<string, unknown>).window;
  }
});

test('notify is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => notifyDraftsChanged());
});
