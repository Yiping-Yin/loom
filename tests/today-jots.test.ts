/**
 * tests/today-jots.test.ts
 *
 * Contract tests for lib/jot/jot-storage — the client-side localStorage
 * store powering the /today quick-jot capture loop.
 *
 * Uses an in-memory localStorage mock so tests are deterministic and
 * offline-safe (no real browser, no real localStorage).
 */
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── in-memory localStorage mock ──────────────────────────────────────────────

class MemStorage implements Storage {
  private store: Map<string, string> = new Map();
  get length() { return this.store.size; }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

// We need `window.localStorage` to exist before importing jot-storage,
// because the module-level code reads `typeof window` at call time (not
// at import time), so installing it here is sufficient.
let memStorage: MemStorage;

before(() => {
  memStorage = new MemStorage();
  // Install a minimal `window` shim so getLocalStorage() returns our mock.
  // @ts-ignore — global assignment for test environment
  globalThis.window = { localStorage: memStorage };
});

beforeEach(() => {
  memStorage.clear();
});

// ── import the module under test AFTER installing the shim ──────────────────

// Dynamic import so the module sees the window shim we installed above.
// We re-import once and share across tests via a closure.
let readJots: typeof import('../lib/jot/jot-storage').readJots;
let appendJot: typeof import('../lib/jot/jot-storage').appendJot;
let JOTS_KEY: typeof import('../lib/jot/jot-storage').JOTS_KEY;

before(async () => {
  const mod = await import('../lib/jot/jot-storage');
  readJots = mod.readJots;
  appendJot = mod.appendJot;
  JOTS_KEY = mod.JOTS_KEY;
});

// ── tests ────────────────────────────────────────────────────────────────────

describe('today-jots: append and read', () => {
  it('appended jot appears in readJots', () => {
    appendJot('First thought');
    const jots = readJots();
    assert.equal(jots.length, 1);
    assert.equal(jots[0].text, 'First thought');
    assert.ok(typeof jots[0].id === 'string' && jots[0].id.startsWith('jt_'));
    assert.ok(typeof jots[0].at === 'number' && jots[0].at > 0);
  });

  it('multiple jots are returned newest-first', () => {
    appendJot('older thought');
    // Advance virtual time slightly so at timestamps differ.
    const orig = Date.now;
    const base = Date.now();
    let call = 0;
    Date.now = () => base + (++call) * 10;
    appendJot('newer thought');
    Date.now = orig;

    const jots = readJots();
    assert.equal(jots.length, 2);
    // newest-first: the second-appended jot should have a higher `at`.
    assert.ok(jots[0].at >= jots[1].at, 'jots should be sorted newest-first');
    assert.equal(jots[0].text, 'newer thought');
    assert.equal(jots[1].text, 'older thought');
  });

  it('empty string is ignored', () => {
    const result = appendJot('');
    assert.equal(result, null);
    assert.equal(readJots().length, 0);
  });

  it('whitespace-only string is ignored', () => {
    const result = appendJot('   \t\n  ');
    assert.equal(result, null);
    assert.equal(readJots().length, 0);
  });

  it('leading/trailing whitespace is trimmed', () => {
    appendJot('  trimmed thought  ');
    const jots = readJots();
    assert.equal(jots[0].text, 'trimmed thought');
  });

  it('returns the new Jot object on success', () => {
    const jot = appendJot('returned jot');
    assert.ok(jot !== null);
    assert.equal(jot!.text, 'returned jot');
    assert.ok(jot!.id.startsWith('jt_'));
  });

  it('readJots returns [] when storage is empty', () => {
    assert.deepEqual(readJots(), []);
  });

  it('persists across separate readJots calls', () => {
    appendJot('persisted');
    // Second read should still return the jot.
    const jots = readJots();
    assert.equal(jots.length, 1);
    assert.equal(jots[0].text, 'persisted');
  });

  it('multiple jots are all persisted', () => {
    appendJot('one');
    appendJot('two');
    appendJot('three');
    const jots = readJots();
    assert.equal(jots.length, 3);
    const texts = new Set(jots.map((j) => j.text));
    assert.ok(texts.has('one'));
    assert.ok(texts.has('two'));
    assert.ok(texts.has('three'));
  });

  it('each jot has a unique id', () => {
    appendJot('a');
    appendJot('b');
    appendJot('c');
    const ids = readJots().map((j) => j.id);
    assert.equal(new Set(ids).size, 3);
  });

  it('uses the expected localStorage key', () => {
    appendJot('key test');
    assert.ok(memStorage.getItem(JOTS_KEY) !== null);
  });
});
