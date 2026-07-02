# Stage 0 — Governance Floor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the test/CI harness tell the truth — every test runs, lint operates, native tests gate CI — with zero product-code changes, so every later framework stage has machine-checkable exit criteria.

**Architecture:** Four independent repairs on the verification substrate: (1) glob-based test runner + zero-orphan guard replacing a hand-maintained 89-of-176-file list, (2) triage of the orphaned failures that surface, (3) eslint 9 flat-config resurrection (`next lint` was removed in Next 16.2.9), (4) CI wiring incl. `xcodebuild test` for the 351-test LoomTests suite. All doc/CI changes go through the existing contract-test lockstep (`tests/ci-workflow.test.ts` pins `ci.yml`).

**Tech Stack:** tsx --test (node:test), eslint 9 flat config + eslint-config-next ^16.2.9, GitHub Actions, xcodebuild.

**Spec:** `docs/projects/active/2026-07-02-loom-workbench-upgrade-framework.md` §Stage 0.

## Global Constraints

- Zero product-code changes: only `package.json` scripts, test files, eslint config, `.github/workflows/ci.yml`.
- Branch: `loom-usability-and-craft` (never main). One commit per task, gates keyed on exit codes.
- The 15 LoomTests skips are DELIBERATE skip-when-absent gates (gitignored Office fixtures) — they stay; un-skipping via fixture generation is explicitly deferred to a later native stage (conscious deviation from one planner suggestion; no obvious generator scripts exist).
- Frozen boundary (framework §5) untouched — nothing here touches Swift sources or capture chain.
- GOTCHA (memory): if `npm run test:contracts` ever crashes pre-test with a tsx IPC EPERM on this machine, fall back to `node --import tsx --test <files>` to verify, but keep the npm script as the canonical form.

---

### Task 1: Baseline inventory of orphaned tests

**Files:**
- Create: `/private/tmp/claude-501/-Users-yinyiping-Desktop-Private-Wiki/4bf7f73b-e73f-4da2-9970-9cea8462132b/scratchpad/stage0/orphans.txt` (scratch, not committed)

**Interfaces:**
- Produces: `orphans.txt` — one line per test file NOT in the current runner; `failures.txt` — the subset that currently fails. Task 3 consumes both.

- [ ] **Step 1: List orphans**

```bash
cd ~/dev/LOOM
mkdir -p "$SCRATCH/stage0"
node -e "
const fs = require('fs');
const listed = new Set(require('./package.json').scripts['test:contracts'].split(/\s+/).filter(s => s.startsWith('tests/')));
const all = fs.readdirSync('tests').filter(f => /\.(test\.(ts|tsx|mjs)|-render\.tsx)$/.test(f) || /-render\.tsx$/.test(f)).map(f => 'tests/' + f);
const orphans = all.filter(f => !listed.has(f));
fs.writeFileSync(process.env.SCRATCH + '/stage0/orphans.txt', orphans.join('\n'));
console.log('listed', listed.size, 'all', all.length, 'orphans', orphans.length);
"
```
Expected: `listed 89 all 176 orphans ~87`.

- [ ] **Step 2: Run the orphan set, capture failures**

```bash
cd ~/dev/LOOM
node --import tsx --test $(cat "$SCRATCH/stage0/orphans.txt" | grep '\.test\.' ) 2>&1 | tee "$SCRATCH/stage0/orphan-run.log" | tail -20
grep -B0 "✖" "$SCRATCH/stage0/orphan-run.log" | grep -o "tests/[a-z0-9.-]*" | sort -u > "$SCRATCH/stage0/failures.txt"
cat "$SCRATCH/stage0/failures.txt"
```
Expected: ~14 failing files (audit list includes: atelier-honesty, shuttle-canonical-ia, canonical-detail-route, capture-render-debug-artifacts, collection-native-mirror, source-library-metadata). No commit — inventory only.

---

### Task 2: Glob runner + rename render tests + zero-orphan guard (TDD)

**Files:**
- Create: `tests/test-runner-coverage.test.ts`
- Modify: `package.json` (scripts.test:contracts)
- Rename: `tests/beginner-documents-render.tsx → tests/beginner-documents-render.test.tsx`, `tests/digital-postcard-render.tsx → tests/digital-postcard-render.test.tsx`, `tests/draft-block-editor-render.tsx → tests/draft-block-editor-render.test.tsx`, `tests/example-showcase-render.tsx → tests/example-showcase-render.test.tsx`

**Interfaces:**
- Produces: `scripts['test:contracts'] === "tsx --test tests/*.test.*"` — Tasks 3/6 rely on this exact form.

- [ ] **Step 1: Write the failing guard test**

```ts
// tests/test-runner-coverage.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const script = JSON.parse(fs.readFileSync("package.json", "utf8")).scripts["test:contracts"];

test("test:contracts collects every test in tests/ via a glob, not a hand-maintained list", () => {
  assert.equal(script, "tsx --test tests/*.test.*");
});

test("no test-like file in tests/ escapes the glob", () => {
  const escapees = fs
    .readdirSync("tests")
    .filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))
    .filter((f) => /(test|spec|render|contract)/i.test(f))
    .filter((f) => !/\.test\.(ts|tsx|mjs|js)$/.test(f))
    .filter((f) => !["helpers.ts", "setup.ts"].includes(f));
  assert.deepEqual(escapees, []);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd ~/dev/LOOM && node --import tsx --test tests/test-runner-coverage.test.ts`
Expected: FAIL — script is the 3,039-char list; escapees lists the four `*-render.tsx`.

- [ ] **Step 3: Rename the four render tests + flip the script**

```bash
cd ~/dev/LOOM
for f in beginner-documents digital-postcard draft-block-editor example-showcase; do
  git mv tests/$f-render.tsx tests/$f-render.test.tsx
done
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['test:contracts'] = 'tsx --test tests/*.test.*';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
```
Check first that the renamed files actually contain `test(...)` registrations (read each; if one is a pure helper that renders nothing under node:test, it belongs in the escapee allowlist instead — decide per file, record in the commit message).

- [ ] **Step 4: Run the guard, then the FULL suite**

Run: `node --import tsx --test tests/test-runner-coverage.test.ts` → PASS.
Run: `npm run test:contracts 2>&1 | tail -6`
Expected: ~1,036+ tests collected; **failures expected at this step** (the ~14 orphans + possibly the renamed render files) — that is Task 3's input, NOT a reason to revert. Record the exact failing list.

- [ ] **Step 5: Commit (runner + guard only, suite red is known)**

```bash
git add tests/test-runner-coverage.test.ts tests/*-render.test.tsx package.json
git commit -m "test: glob-based contract runner + zero-orphan guard (surfaces 14 known-rotting orphans for triage)"
```

---

### Task 3: Triage the surfaced failures to a green full suite

**Files:**
- Modify/Delete: the ~14 failing test files from Task 2 Step 4 (exact set comes from the run)

**Interfaces:**
- Consumes: failures list. Produces: `npm run test:contracts` fully green — every later task and stage depends on this.

- [ ] **Step 1: Classify each failure with this decision table**

| Signal | Action |
| --- | --- |
| Test pins a culled/retired surface (route/component no longer exists — e.g. atelier-honesty, shuttle-canonical-ia; verify by checking the referenced `app/` path is gone) | `git rm` the test; note the surface in the commit message (pre-registers it for the Stage 3 cull list) |
| Test covers a LIVE Reflection-era surface (capture-render-debug-artifacts, collection-native-mirror, source-library-metadata, canonical-detail-route) but assertions drifted | Read the test AND the current source; update the assertion to the current verified truth. Never delete coverage of live surfaces; never blind-update — confirm the current behavior is intended by checking the source and its docs/contract |
| Test fails on environment (missing gitignored fixture, needs build artifact) | Convert to the established skip-when-absent pattern (see `loom-upgrade-to-latest` precedent in tests using `fs.existsSync` guards) |

- [ ] **Step 2: Work file-by-file, re-running per fix**

Run after each: `node --import tsx --test tests/<file>` → PASS (or file deleted).

- [ ] **Step 3: Full suite green**

Run: `npm run test:contracts 2>&1 | tail -6`
Expected: `fail 0`, total ≥ 1,000 tests.

- [ ] **Step 4: Commit**

```bash
git add -A tests/
git commit -m "test: triage orphaned suite — fix drifted Reflection assertions, drop tests of retired surfaces"
```

---

### Task 4: Resurrect lint (eslint 9 flat config)

**Files:**
- Create: `eslint.config.mjs`
- Delete: `.eslintrc.json`
- Modify: `package.json` (scripts.lint)

**Interfaces:**
- Produces: `npm run lint` exits 0; script is `eslint .`. Task 6 wires it into CI.

- [ ] **Step 1: Write the flat config**

```js
// eslint.config.mjs
import next from "eslint-config-next";

export default [
  {
    ignores: [
      "node_modules/**", ".next*/**", ".next-export/**", "out/**",
      "public/**", "archive/**", "captures/**", "knowledge/**", "tmp/**",
      "macos-app/**", "supabase/**", "docs/**", "resources/**",
    ],
  },
  ...next,
];
```
(If `eslint-config-next@16` does not export a flat-config default array, use its documented flat entry — check `node_modules/eslint-config-next/package.json` exports first; fallback: `import { FlatCompat } from "@eslint/eslintrc"` extending `next/core-web-vitals`. Pick whichever makes `eslint .` RUN; do not hand-roll rules.)

- [ ] **Step 2: Flip the script and run**

```bash
cd ~/dev/LOOM
node -e "
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts.lint='eslint .';
fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');"
git rm .eslintrc.json
npm run lint 2>&1 | tail -20
```

- [ ] **Step 3: Drive to exit 0 with this decision ladder**

1. Auto-fixables: `npx eslint . --fix` (formatting-class only), re-run suite after.
2. Real errors in LIVE code (app/reflection, lib, components in use): fix them (they are bugs or near-bugs).
3. Error floods (>50) confined to LEGACY surfaces (old-LOOM routes/components): add those directories to `ignores` with a `// Stage 3 cull pending` comment — lint must gate NEW code, not block on doomed code.
4. Rule-level noise (stylistic rules erroring repo-wide): disable that single rule with a comment naming why — never disable whole plugins.

Run: `npm run lint; echo "exit=$?"` → `exit=0`.

- [ ] **Step 4: Contracts still green** — `npm run test:contracts 2>&1 | tail -3` (a lint --fix touching source must not break contract string-pins; if it does, revert that fix and ignore the rule instead).

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs package.json && git rm -q --cached .eslintrc.json 2>/dev/null; git add -u
git commit -m "chore: resurrect lint as eslint 9 flat config (next lint removed in Next 16.2.9)"
```

---

### Task 5: typecheck:fast script

**Files:**
- Modify: `package.json` (add scripts.typecheck:fast)
- Modify: `tests/typecheck-script.test.ts` ONLY IF it pins the scripts block shape (read it first)

**Interfaces:**
- Produces: `npm run typecheck:fast` = `tsc --noEmit -p tsconfig.json`, exit 0 in ~1-4s, no Next build lock. Task 6 uses it in CI.

- [ ] **Step 1: Read `tests/typecheck-script.test.ts`** — if it asserts on `package.json` scripts, extend the assertion FIRST (red), then add the script (green). Otherwise just add:

```bash
node -e "
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['typecheck:fast']='tsc --noEmit -p tsconfig.json';
fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');"
```

- [ ] **Step 2: Run** — `npm run typecheck:fast; echo "exit=$?"` → 0 errors (audit verified 2026-07-02), `exit=0`.

- [ ] **Step 3: Commit** — `git add package.json tests/typecheck-script.test.ts && git commit -m "chore: typecheck:fast decoupled from the Next build lock"`

---

### Task 6: CI wiring (contract-test-first)

**Files:**
- Modify: `tests/ci-workflow.test.ts` (pins ci.yml — change it FIRST)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: green suite (T3), lint (T4), typecheck:fast (T5).
- Produces: CI gates = lint + full glob suite + typecheck + LoomTests, all exit-code-keyed.

- [ ] **Step 1: Read `tests/ci-workflow.test.ts`**, extend its assertions to REQUIRE the new steps (red):
  - verify job contains a `Lint` step running `npm run lint` and a `Fast typecheck` step running `npm run typecheck:fast` before the build
  - macos job contains a `LoomTests` step whose run line includes `xcodebuild test` with `LOOM_SKIP_WEB_STAGE=1` and `CODE_SIGNING_ALLOWED=NO`

- [ ] **Step 2: Run to verify red** — `node --import tsx --test tests/ci-workflow.test.ts` → FAIL.

- [ ] **Step 3: Edit ci.yml** — in `verify`, after "Install dependencies":

```yaml
      - name: Lint
        run: npm run lint

      - name: Fast typecheck
        run: npm run typecheck:fast
```

In `macos-app-smoke`, after "Verify Loom Xcode project":

```yaml
      - name: LoomTests
        run: LOOM_SKIP_WEB_STAGE=1 xcodebuild test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO
```

(XCTest-host detection in LoomApp.swift:18-22 already prevents a GUI window during hosted tests, so this is CI-safe.)

- [ ] **Step 4: Green** — `node --import tsx --test tests/ci-workflow.test.ts` → PASS; full `npm run test:contracts` → PASS.

- [ ] **Step 5: Commit + push + watch**

```bash
git add tests/ci-workflow.test.ts .github/workflows/ci.yml
git commit -m "ci: lint + fast typecheck + LoomTests gates, exit-code-keyed"
git push origin loom-usability-and-craft
gh run watch --exit-status $(gh run list --branch loom-usability-and-craft --limit 1 --json databaseId -q '.[0].databaseId') || gh pr checks
```
Expected: both jobs green on the runner. Local cold builds are known-slow; CI is the build verifier of record (memory: verify builds on CI, don't fight local cold builds).

---

### Task 7: Stage exit verification

- [ ] **Step 1: The Stage 0 exit criteria, verbatim from the framework**, all in one run:

```bash
cd ~/dev/LOOM
npm run test:contracts 2>&1 | grep -E "ℹ (tests|pass|fail)"     # ≥1,000 tests, fail 0
npm run lint; echo "lint=$?"                                      # 0
npm run typecheck:fast; echo "tsc=$?"                             # 0
node --import tsx --test tests/test-runner-coverage.test.ts       # zero-orphan guard PASS
LOOM_SKIP_WEB_STAGE=1 xcodebuild test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO 2>&1 | tail -3   # TEST SUCCEEDED
```

- [ ] **Step 2: Report** — post the numbers + CI run link; update the framework doc's Stage 0 line with `landed <sha>`; commit that doc touch with the report.
