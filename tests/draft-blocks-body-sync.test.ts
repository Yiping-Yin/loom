import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  type NewLoomDraftDocBlock,
  blocksToBody,
  bodyToBlocks,
} from '../lib/new-loom/draft-blocks';

const repoRoot = path.resolve(__dirname, '..');
const draftClient = fs.readFileSync(
  path.join(repoRoot, 'app/draft/DraftClient.tsx'),
  'utf8',
);

const idSeq = () => {
  let n = 0;
  return () => `b${++n}`;
};

// Regression for the blocks<->body divergence / data-loss bug: every path that
// mutates `body` and calls scheduleSave must FIRST re-derive blocks from the new
// body (via syncBlocksFromBody) and thread the derived blocks through the save,
// exactly like the raw-body textarea already does. Otherwise in-memory + persisted
// `blocks` go stale while `body` is fresh, and the next block edit serializes the
// stale blocks back over body, permanently discarding the inserted content.
// Spec invariants L32/L88/L95/L105.
// Split a call's argument string on top-level commas only, so nested calls such
// as `blocksToBody(next)` or `{ ...draft, body }` stay intact as one argument.
function splitTopLevelArgs(args: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of args) {
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// Collect every CALL to `fn(` (not its definition `const fn =`/`function fn`),
// returning each call's top-level argument list.
function callArgLists(source: string, fn: string): string[][] {
  const calls: string[][] = [];
  const needle = `${fn}(`;
  let from = 0;
  for (;;) {
    const idx = source.indexOf(needle, from);
    if (idx === -1) break;
    from = idx + needle.length;
    // Skip the definition site, where `fn(` is immediately preceded by an
    // assignment/keyword (`= async (`, `= (`, `function fn(`).
    const before = source.slice(Math.max(0, idx - 24), idx);
    if (/(?:=\s*(?:async\s*)?|function\s+)$/.test(before)) continue;
    // Walk to the matching close paren of this call.
    let depth = 1;
    let i = from;
    for (; i < source.length && depth > 0; i += 1) {
      const ch = source[i];
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
    }
    calls.push(splitTopLevelArgs(source.slice(from, i - 1)));
  }
  return calls;
}

// A body argument is "freshly mutated" unless it is the bare `body` identifier
// (an unchanged body threaded through a title-only save) or a placeholder name
// the call definition uses for the *incoming* value it will forward verbatim.
function mutatesBody(bodyArg: string): boolean {
  const unchanged = new Set(['body', 'nextBody', 'currentDraft.body']);
  return !unchanged.has(bodyArg);
}

// Regression for the blocks<->body divergence / data-loss bug: every CALL SITE
// that persists a freshly-mutated body must thread derived blocks alongside it,
// so persisted/in-memory blocks never go stale relative to body. This is a
// GENERIC structural check over all callers (no hard-coded count), so a newly
// added — or previously missed — body-mutating path that forgets blocks fails
// here instead of slipping through (the insertReferenceCandidate leak).
// Spec invariants L32/L88/L95/L105.
test('every commitDraft/scheduleSave persisting a mutated body threads derived blocks', () => {
  // scheduleSave(nextTitle, nextBody, nextBlocks?) — body is arg[1], blocks arg[2].
  const scheduleCalls = callArgLists(draftClient, 'scheduleSave');
  assert.ok(scheduleCalls.length > 0, 'expected scheduleSave call sites');
  for (const parts of scheduleCalls) {
    if (!mutatesBody(parts[1] ?? '')) continue; // title-only save (bare `body`)
    assert.ok(
      parts.length >= 3 && parts[2] !== '',
      `body-mutating scheduleSave must thread derived blocks, got: scheduleSave(${parts.join(', ')})`,
    );
  }

  // commitDraft(draft, nextTitle, nextBody, nextReferences?, nextBlocks?) —
  // body is arg[2], blocks arg[4]. A call that mutates body but stops at 4 args
  // (omitting blocks) is exactly the insertReferenceCandidate divergence bug.
  const commitCalls = callArgLists(draftClient, 'commitDraft');
  assert.ok(commitCalls.length > 0, 'expected commitDraft call sites');
  for (const parts of commitCalls) {
    if (!mutatesBody(parts[2] ?? '')) continue; // unchanged body (e.g. ref removal)
    assert.ok(
      parts.length >= 5 && parts[4] !== '',
      `body-mutating commitDraft must thread derived blocks, got: commitDraft(${parts.join(', ')})`,
    );
  }
});

// Every body-mutating path threads its derived blocks via the syncBlocksFromBody
// helper (the canonical re-derivation), so the persisted blocks are guaranteed
// to track the persisted body. Assert the helper is the source of every threaded
// `nextBlocks`, not an ad-hoc value that could diverge.
test('body-mutating paths derive blocks via syncBlocksFromBody before threading', () => {
  // Each occurrence pairs `const nextBlocks = syncBlocksFromBody(<body>)` with a
  // following persist that threads `nextBlocks`. Require at least one such pair
  // per saver and that no syncBlocksFromBody result is computed then dropped.
  const derivations = draftClient.match(
    /const nextBlocks = syncBlocksFromBody\([^)]+\);/g,
  ) ?? [];
  assert.ok(
    derivations.length > 0,
    'expected at least one syncBlocksFromBody derivation',
  );
  // Every derived nextBlocks must be consumed by a persist call. Count threads
  // (scheduleSave(..., nextBlocks) / commitDraft(..., nextBlocks)) and require
  // one per derivation, so a derivation can't be computed and silently dropped.
  const threaded =
    draftClient.match(/(?:scheduleSave|commitDraft)\([^;]*?,\s*nextBlocks\)/g) ??
    [];
  assert.ok(
    threaded.length >= derivations.length,
    `every syncBlocksFromBody derivation must be threaded into a persist; ` +
      `derived ${derivations.length}, threaded ${threaded.length}`,
  );
});

// Behavioral invariant: for the bodies these mutations actually produce, the
// blocks derived from the new body serialize back to that same body, so the
// persisted blocks are never stale relative to the persisted body (round-trip).
test('derived blocks serialize back to the mutated body (no divergence)', () => {
  const seed: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Opening claim.' },
    { id: 'b2', kind: 'code', text: 'const x = 1;', lang: 'ts' },
  ];
  const seedBody = blocksToBody(seed);

  // Simulate the AI-insert / outline mutation: append prose to the body.
  const aiSuggestion = 'A grounded follow-up paragraph from the AI.';
  const mutatedBody = `${seedBody.trimEnd()}\n\n${aiSuggestion}`;

  // syncBlocksFromBody does exactly this derivation.
  const derived = bodyToBlocks(mutatedBody, [], idSeq());

  // The persisted blocks (derived) must serialize back to the persisted body,
  // i.e. no content is lost and a later block edit can't clobber the insert.
  assert.equal(blocksToBody(derived), mutatedBody);
  assert.ok(
    derived.some((b) => b.kind === 'text' && b.text.includes(aiSuggestion)),
    'the inserted AI paragraph survives in the derived blocks',
  );
});
