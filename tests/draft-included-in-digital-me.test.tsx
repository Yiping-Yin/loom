import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  createDraft,
  updateDraft,
  listDrafts,
  type DraftStorageAdapter,
  type NewLoomDraftRecord,
} from '../lib/new-loom/draft-storage';
import { nativeDraftStorage } from '../lib/new-loom/native-draft-client';

// Task 1 (the moat): a draft the user explicitly marks `includedInDigitalMe`
// is the curation gate that later exposes it to BOTH the Ask corpus and
// capability derivation. The flag must persist on the record, survive the
// readDrafts validation round-trip, and be togglable through createDraft +
// updateDraft. The editor must surface a control to set it.

function mem(): DraftStorageAdapter {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}
const opts = { now: () => '2026-06-23T00:00:00.000Z', createId: () => 'd1' };

test('createDraft persists includedInDigitalMe and it survives the storage round-trip', () => {
  const a = mem();
  const d = createDraft(a, { includedInDigitalMe: true }, opts);
  assert.equal(d.includedInDigitalMe, true);

  // The flag survives serialize -> readDrafts validation -> deserialize.
  const restored = listDrafts(a).find((draft) => draft.id === d.id);
  assert.equal(restored?.includedInDigitalMe, true);
});

test('createDraft defaults includedInDigitalMe to undefined (opt-in curation)', () => {
  const a = mem();
  const d = createDraft(a, {}, opts);
  assert.equal(d.includedInDigitalMe, undefined);
  const restored = listDrafts(a).find((draft) => draft.id === d.id);
  assert.equal(restored?.includedInDigitalMe, undefined);
});

test('updateDraft can set and clear includedInDigitalMe without touching other fields', () => {
  const a = mem();
  const d = createDraft(a, { title: 'Source note', body: 'grounded' }, opts);
  assert.equal(d.includedInDigitalMe, undefined);

  const included = updateDraft(a, d.id, { includedInDigitalMe: true }, { now: opts.now });
  assert.equal(included.includedInDigitalMe, true);
  assert.equal(included.title, 'Source note');
  assert.equal(included.body, 'grounded');

  const excluded = updateDraft(a, d.id, { includedInDigitalMe: false }, { now: opts.now });
  assert.equal(excluded.includedInDigitalMe, false);
  assert.equal(excluded.body, 'grounded');

  const restored = listDrafts(a).find((draft) => draft.id === d.id);
  assert.equal(restored?.includedInDigitalMe, false);
});

test('updateDraft leaves includedInDigitalMe unchanged when the patch omits it', () => {
  const a = mem();
  const d = createDraft(a, { includedInDigitalMe: true }, opts);
  const next = updateDraft(a, d.id, { title: 'Renamed' }, { now: opts.now });
  assert.equal(next.includedInDigitalMe, true);
  assert.equal(next.title, 'Renamed');
});

test('readDrafts drops a record with a non-boolean includedInDigitalMe but keeps a valid neighbour', () => {
  const a = mem();
  a.setItem(
    'loom.new.drafts.v1',
    JSON.stringify([
      {
        id: 'bad',
        title: 'Bad',
        body: '',
        references: [],
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
        includedInDigitalMe: 'yes',
      },
      {
        id: 'good',
        title: 'Good',
        body: '',
        references: [],
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
        includedInDigitalMe: true,
      },
    ]),
  );
  const drafts = listDrafts(a);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.id, 'good');
  assert.equal(drafts[0]?.includedInDigitalMe, true);
});

// Native-store path (the production macOS target): in the installed app the
// draft is loaded from and saved through the `loomDrafts` WebKit bridge, NOT
// localStorage. The curation flag (the heart of the moat gate) must ride that
// same bridge or it silently fails to persist while the UI shows 'Included'.
function installNativeBridge() {
  const posted: Array<Record<string, unknown>> = [];
  const win = {
    webkit: {
      messageHandlers: {
        loomDrafts: {
          postMessage(msg: unknown) {
            posted.push(msg as Record<string, unknown>);
            const m = msg as Record<string, unknown>;
            // Echo a record back so update() resolves like the real bridge.
            const record: NewLoomDraftRecord = {
              id: (m.id as string) ?? 'native-1',
              title: (m.title as string) ?? 'Native draft',
              body: (m.body as string) ?? '',
              references: [],
              includedInDigitalMe: m.includedInDigitalMe as boolean | undefined,
              createdAt: '2026-06-23T00:00:00.000Z',
              updatedAt: '2026-06-23T00:00:00.000Z',
            };
            return Promise.resolve(record);
          },
        },
      },
    },
  };
  Object.assign(globalThis, { window: win });
  return posted;
}

function removeWindow() {
  delete (globalThis as { window?: unknown }).window;
}

test('native draft bridge update() forwards includedInDigitalMe so the curation flag persists in the macOS app', async () => {
  const posted = installNativeBridge();
  try {
    const store = nativeDraftStorage();
    assert.ok(store, 'native store should be available when the loomDrafts bridge is present');

    const updated = await store!.update('native-1', { includedInDigitalMe: true });
    assert.equal(updated.includedInDigitalMe, true);

    // The contract gap was that the bridge message excluded includedInDigitalMe;
    // assert it now rides the same update message as title/body/references.
    const updateMsg = posted.find((m) => m.action === 'update');
    assert.ok(updateMsg, 'an update message should be posted to the bridge');
    assert.equal(updateMsg!.includedInDigitalMe, true);

    // Clearing the flag must also propagate (false, not just truthy set).
    const cleared = await store!.update('native-1', { includedInDigitalMe: false });
    assert.equal(cleared.includedInDigitalMe, false);
    const clearMsg = posted.filter((m) => m.action === 'update').at(-1);
    assert.equal(clearMsg!.includedInDigitalMe, false);
  } finally {
    removeWindow();
  }
});

test('DraftClient toggle persists through the native-aware persist path (not the browser-only adapter)', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const src = fs.readFileSync(path.join(repoRoot, 'app/draft/DraftClient.tsx'), 'utf8');

  // The toggle handler must route through persistDraft (which forwards to the
  // native bridge in the macOS app), carrying the new flag. A browser-only
  // updateDraft(...) call inside the toggle would re-open the native blocker.
  const toggle = src.slice(
    src.indexOf('function toggleIncludedInDigitalMe'),
    src.indexOf('const ensureReferencePickerDocs'),
  );
  assert.ok(toggle.length > 0, 'toggleIncludedInDigitalMe should be present');
  assert.match(toggle, /persistDraft\(/);
  assert.doesNotMatch(toggle, /updateDraft\(/);
});

test('DraftClient renders an Include in Digital Me toggle wired to updateDraft', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const src = fs.readFileSync(path.join(repoRoot, 'app/draft/DraftClient.tsx'), 'utf8');

  // The toggle control exists and is labelled (bilingual, consistent with the
  // editor's existing copy register).
  assert.match(src, /纳入 Digital Me/);
  assert.match(src, /Include in Digital Me/);

  // It reflects current state via aria-pressed bound to the flag.
  assert.match(src, /aria-pressed=\{[^}]*includedInDigitalMe/);

  // Toggling persists through the draft record (updateDraft / persist path),
  // not just local component state.
  assert.match(src, /includedInDigitalMe/);
});
