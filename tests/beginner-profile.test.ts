import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyBeginnerProfile, normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import {
  BEGINNER_PROFILE_KEY,
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../lib/profile/profile-storage';

// ── In-memory localStorage mock ─────────────────────────────────────────────
// The client store reads `window.localStorage`; node has neither, so install a
// minimal in-memory Storage and a `window` referencing it for the duration of
// the storage tests.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

function withLocalStorage(fn: (store: MemoryStorage) => void) {
  const store = new MemoryStorage();
  const prevWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = { localStorage: store };
  try {
    fn(store);
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      (globalThis as Record<string, unknown>).window = prevWindow;
    }
  }
}

// ── Schema + normalizer ─────────────────────────────────────────────────────

test('emptyBeginnerProfile is a valid empty shape', () => {
  const p = emptyBeginnerProfile();
  assert.equal(p.version, 1);
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize coerces garbage to safe defaults', () => {
  assert.deepEqual(normalizeBeginnerProfile(null), emptyBeginnerProfile());
  assert.deepEqual(normalizeBeginnerProfile('nope'), emptyBeginnerProfile());
  const p = normalizeBeginnerProfile({ home: { name: 5 }, education: 'x', about: { links: 'y' } });
  assert.equal(p.home.name, '');
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize preserves valid data and drops empty entries', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Engineer' },
    about: { summary: 'hi', links: [{ label: 'GitHub', href: 'https://x' }, { href: '' }] },
    education: [{ institution: 'UNSW', qualification: 'BSc' }, {}],
    experience: [{ role: 'Dev', organization: 'Acme', bullets: ['shipped', 7] }, { bullets: [] }],
  });
  assert.equal(p.home.name, 'Ada');
  assert.equal(p.about.links.length, 1);
  assert.equal(p.education.length, 1);
  assert.equal(p.experience.length, 1);
  assert.deepEqual(p.experience[0].bullets, ['shipped']);
});

// ── localStorage client store ───────────────────────────────────────────────

test('readBeginnerProfileLocal returns null during SSR (no window)', () => {
  const prevWindow = (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).window;
  try {
    assert.equal(readBeginnerProfileLocal(), null);
  } finally {
    if (prevWindow !== undefined) {
      (globalThis as Record<string, unknown>).window = prevWindow;
    }
  }
});

test('readBeginnerProfileLocal returns null when nothing is stored', () => {
  withLocalStorage(() => {
    assert.equal(readBeginnerProfileLocal(), null);
  });
});

test('write then read round-trips a normalized profile through localStorage', () => {
  withLocalStorage((store) => {
    writeBeginnerProfileLocal(
      normalizeBeginnerProfile({ home: { name: 'Ada', headline: 'Eng' } }),
    );
    // Persisted under the canonical key.
    assert.ok(store.getItem(BEGINNER_PROFILE_KEY));

    const back = readBeginnerProfileLocal();
    assert.equal(back?.home.name, 'Ada');
    assert.equal(back?.home.headline, 'Eng');
    assert.equal(back?.version, 1);
  });
});

test('writeBeginnerProfileLocal normalizes garbage before persisting', () => {
  withLocalStorage(() => {
    // Cast through unknown — the store normalizes whatever it receives.
    writeBeginnerProfileLocal({
      home: { name: 'Bo' },
      education: 'nope',
    } as unknown as ReturnType<typeof emptyBeginnerProfile>);

    const back = readBeginnerProfileLocal();
    assert.equal(back?.home.name, 'Bo');
    assert.deepEqual(back?.education, []);
    assert.deepEqual(back?.about.links, []);
  });
});

test('readBeginnerProfileLocal returns null for unparseable stored value', () => {
  withLocalStorage((store) => {
    store.setItem(BEGINNER_PROFILE_KEY, '{not json');
    assert.equal(readBeginnerProfileLocal(), null);
  });
});

test('emptyBeginnerProfile has works: []', () => {
  const p = emptyBeginnerProfile();
  assert.deepEqual(p.works, []);
});

test('normalize preserves valid works and drops entries with empty title', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Engineer' },
    works: [
      { title: 'Option Pricer', description: 'Black-Scholes calc', link: 'https://example.com', role: 'Solo dev', date: '2024' },
      { title: '' },
      {},
    ],
  });
  assert.equal(p.works.length, 1);
  assert.equal(p.works[0].title, 'Option Pricer');
  assert.equal(p.works[0].description, 'Black-Scholes calc');
  assert.equal(p.works[0].link, 'https://example.com');
  assert.equal(p.works[0].role, 'Solo dev');
  assert.equal(p.works[0].date, '2024');
});

test('normalize coerces non-array works to empty array', () => {
  const p = normalizeBeginnerProfile({ works: 'not-an-array' });
  assert.deepEqual(p.works, []);
});

test('writeBeginnerProfileLocal is a no-op during SSR (no window) and returns false', () => {
  const prevWindow = (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).window;
  try {
    let result: boolean | undefined;
    // Must not throw without a window/localStorage.
    assert.doesNotThrow(() => {
      result = writeBeginnerProfileLocal(normalizeBeginnerProfile({ home: { name: 'X' } }));
    });
    // Persistence unavailable → callers must see false and not navigate away.
    assert.equal(result, false);
  } finally {
    if (prevWindow !== undefined) {
      (globalThis as Record<string, unknown>).window = prevWindow;
    }
  }
});

test('writeBeginnerProfileLocal returns true on a successful write', () => {
  withLocalStorage(() => {
    const ok = writeBeginnerProfileLocal(
      normalizeBeginnerProfile({ home: { name: 'Ada', headline: 'Eng' } }),
    );
    assert.equal(ok, true);
  });
});

// ── URL-scheme allowlist applied at the normalize seam ──────────────────────

test('normalize drops an about link with a javascript: href', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Engineer' },
    about: {
      summary: 'hi',
      links: [
        { label: 'Evil', href: 'javascript:alert(1)' },
        { label: 'Obfuscated', href: 'java\tscript:alert(1)' },
        { label: 'Data', href: 'data:text/html,<script>1</script>' },
        { label: 'GitHub', href: 'https://github.com/ada' },
      ],
    },
  });
  // Only the safe https link survives; every dangerous-scheme link is dropped.
  assert.equal(p.about.links.length, 1);
  assert.equal(p.about.links[0].label, 'GitHub');
  assert.equal(p.about.links[0].href, 'https://github.com/ada');
});

test('normalize strips a works link with an unsafe scheme to undefined', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada' },
    works: [
      { title: 'Evil', link: 'javascript:alert(1)' },
      { title: 'Good', link: 'https://example.com/proj' },
    ],
  });
  assert.equal(p.works.length, 2);
  // The unsafe link is dropped to undefined; the entry itself is kept (it has a title).
  assert.equal(p.works[0].title, 'Evil');
  assert.equal(p.works[0].link, undefined);
  assert.equal(p.works[1].link, 'https://example.com/proj');
});

test('normalize caps oversized fields without breaking normal content', () => {
  const longSummary = 'x'.repeat(5000);
  const longName = 'n'.repeat(1000);
  const p = normalizeBeginnerProfile({
    home: { name: longName, headline: 'fine' },
    about: { summary: longSummary, links: [] },
  });
  // Summary capped to ~2000, short fields capped to ~300; normal content kept.
  assert.ok(p.about.summary.length <= 2000, 'summary capped');
  assert.ok(p.about.summary.length >= 1000, 'summary not over-truncated');
  assert.ok(p.home.name.length <= 300, 'name capped');
  assert.equal(p.home.headline, 'fine', 'normal short field untouched');
});

test('writeBeginnerProfileLocal returns false when setItem throws (private mode / quota)', () => {
  // Simulate Safari/iOS private mode or quota: localStorage exists but setItem
  // rejects. The function must swallow the throw and report failure so the
  // caller stays on the page instead of stranding the user on a null profile.
  const prevWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
      removeItem: () => undefined,
      clear: () => undefined,
    },
  };
  try {
    let result: boolean | undefined;
    assert.doesNotThrow(() => {
      result = writeBeginnerProfileLocal(normalizeBeginnerProfile({ home: { name: 'X' } }));
    });
    assert.equal(result, false);
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      (globalThis as Record<string, unknown>).window = prevWindow;
    }
  }
});
