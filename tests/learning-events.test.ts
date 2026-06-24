import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyLearningChanged, onLearningChange } from '../lib/sync/learning-events';

test('onLearningChange fires on notify and unsubscribes', () => {
  let cb: (() => void) | undefined;
  (globalThis as Record<string, unknown>).window = {
    dispatchEvent: () => { cb?.(); return true; },
    addEventListener: (_t: string, handler: () => void) => { cb = handler; },
    removeEventListener: () => { cb = undefined; },
  };
  try {
    let n = 0;
    const off = onLearningChange(() => { n += 1; });
    notifyLearningChanged();
    assert.equal(n, 1);
    off();
    notifyLearningChanged();
    assert.equal(n, 1);
  } finally {
    delete (globalThis as Record<string, unknown>).window;
  }
});

test('notify is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => notifyLearningChanged());
});
