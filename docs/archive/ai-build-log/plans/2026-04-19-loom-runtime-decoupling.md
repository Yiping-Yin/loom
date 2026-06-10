# Loom Runtime Decoupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make installed `Loom.app` run from an Application Support runtime instead of repo `.next-build`, while continuing to read project content from a separate content root.

**Architecture:** Introduce a shared runtime/content root contract, migrate server-side project-data access off raw `process.cwd()`, stage a standalone Next runtime under `~/Library/Application Support/Loom/runtime/<build-id>/`, and update the macOS shell to launch the installed runtime via an activation record. Keep dev mode repo-local and do not bundle Node in Phase 1.

**Tech Stack:** Next.js 15, Node scripts (`.mjs`), TypeScript tests via `node --import tsx --test`, Swift/SwiftUI macOS shell, Xcodegen/XCTest.

---

## File Map

- Create: `/Users/yinyiping/Desktop/Wiki/lib/runtime-roots.ts`
  - Shared runtime-root/content-root resolver used by server-side code and installer scripts.
- Create: `/Users/yinyiping/Desktop/Wiki/scripts/stage-loom-runtime.mjs`
  - Stages standalone Next runtime into `Application Support`.
- Create: `/Users/yinyiping/Desktop/Wiki/tests/runtime-roots.test.ts`
  - Verifies content-root resolution order and activation-record semantics.
- Create: `/Users/yinyiping/Desktop/Wiki/tests/stage-loom-runtime.test.ts`
  - Verifies runtime staging layout and activation behavior.
- Create: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/LoomRuntimePaths.swift`
  - Native helper for runtime/content-root resolution.
- Create: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Tests/LoomRuntimePathsTests.swift`
  - Native tests for runtime activation/content-root parsing.

- Modify: `/Users/yinyiping/Desktop/Wiki/next.config.mjs`
  - Enable standalone build output for production staging.
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/build.mjs`
  - Produce standalone runtime-ready build artifacts.
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/install-loom-app.mjs`
  - Install runtime payload + app bundle + persisted content-root config.
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/package-loom-app.mjs`
  - Package runtime payload alongside app bundle.
- Modify: `/Users/yinyiping/Desktop/Wiki/package.json`
  - Wire runtime staging into `app`, `app:user`, and `app:system`.
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/server-config.ts`
  - Use shared content-root resolution instead of ad hoc repo-relative guessing.
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/knowledge-store.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/generated-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/knowledge-doc-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/derived-index-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/upload/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/source-upload/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/doc-body/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/quiz/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/ask/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/knowledge/create/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/search-index/route.ts`
  - Switch runtime-serving paths from raw `process.cwd()` to content-root-aware helpers.
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/DevServer.swift`
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/DevServerPreflight.swift`
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Tests/DevServerTests.swift`
  - Production launch should resolve and run the installed runtime, not repo `.next-build`.

---

### Task 1: Introduce Shared Runtime/Content Root Contracts

**Files:**
- Create: `/Users/yinyiping/Desktop/Wiki/lib/runtime-roots.ts`
- Test: `/Users/yinyiping/Desktop/Wiki/tests/runtime-roots.test.ts`

- [ ] **Step 1: Write the failing contract tests**

```ts
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';

import {
  runtimeBaseDir,
  runtimeActivationPath,
  contentRootConfigPath,
  resolveContentRoot,
  resolveActiveRuntimeRoot,
} from '../lib/runtime-roots';

test('resolveContentRoot prefers env override then persisted config then fallback', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'loom-runtime-roots-'));
  const configPath = path.join(home, 'Library/Application Support/Loom/content-root.json');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify({ contentRoot: '/persisted/wiki' }), 'utf8');

  assert.equal(
    resolveContentRoot({
      env: { HOME: home, LOOM_CONTENT_ROOT: '/env/wiki' },
      fallbackContentRoot: '/fallback/wiki',
    }),
    '/env/wiki',
  );

  assert.equal(
    resolveContentRoot({
      env: { HOME: home },
      fallbackContentRoot: '/fallback/wiki',
    }),
    '/persisted/wiki',
  );
});

test('resolveActiveRuntimeRoot reads current.json instead of guessing newest folder', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'loom-runtime-activation-'));
  const runtimeDir = path.join(home, 'Library/Application Support/Loom/runtime');
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(
    path.join(runtimeDir, 'current.json'),
    JSON.stringify({ buildId: 'build-42', runtimeRoot: path.join(runtimeDir, 'build-42') }),
    'utf8',
  );

  assert.equal(
    resolveActiveRuntimeRoot({ env: { HOME: home } }),
    path.join(runtimeDir, 'build-42'),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/runtime-roots.test.ts`  
Expected: FAIL with module-not-found or missing export errors for `lib/runtime-roots.ts`.

- [ ] **Step 3: Write the minimal shared resolver module**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

type ResolveOptions = {
  env?: NodeJS.ProcessEnv;
  fallbackContentRoot?: string;
};

function homeFrom(env: NodeJS.ProcessEnv = process.env) {
  return env.HOME ?? env.USERPROFILE ?? homedir();
}

export function runtimeBaseDir(env: NodeJS.ProcessEnv = process.env) {
  return path.join(homeFrom(env), 'Library', 'Application Support', 'Loom', 'runtime');
}

export function runtimeActivationPath(env: NodeJS.ProcessEnv = process.env) {
  return path.join(runtimeBaseDir(env), 'current.json');
}

export function contentRootConfigPath(env: NodeJS.ProcessEnv = process.env) {
  return path.join(homeFrom(env), 'Library', 'Application Support', 'Loom', 'content-root.json');
}

export function resolveContentRoot({ env = process.env, fallbackContentRoot }: ResolveOptions = {}) {
  const override = env.LOOM_CONTENT_ROOT?.trim();
  if (override) return override;

  const configPath = contentRootConfigPath(env);
  if (existsSync(configPath)) {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { contentRoot?: string };
    if (parsed.contentRoot?.trim()) return parsed.contentRoot.trim();
  }

  return fallbackContentRoot ?? path.resolve(process.cwd());
}

export function resolveActiveRuntimeRoot({ env = process.env }: { env?: NodeJS.ProcessEnv } = {}) {
  const activationPath = runtimeActivationPath(env);
  if (!existsSync(activationPath)) return null;
  const parsed = JSON.parse(readFileSync(activationPath, 'utf8')) as { runtimeRoot?: string };
  return parsed.runtimeRoot?.trim() || null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/runtime-roots.test.ts`  
Expected: PASS with `2` tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/runtime-roots.ts tests/runtime-roots.test.ts
git commit -m "feat: add loom runtime and content root contract"
```

---

### Task 2: Migrate Server-Side Project Data Access to the Content Root Resolver

**Files:**
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/server-config.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/knowledge-store.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/generated-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/knowledge-doc-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/lib/derived-index-cache.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/upload/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/source-upload/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/doc-body/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/quiz/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/ask/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/knowledge/create/route.ts`
- Modify: `/Users/yinyiping/Desktop/Wiki/app/api/search-index/route.ts`
- Test: existing runtime/content tests plus add one focused resolver smoke test in `/Users/yinyiping/Desktop/Wiki/tests/runtime-roots.test.ts`

- [ ] **Step 1: Extend the failing tests to prove content-root-driven file access**

```ts
test('content-root resolver can point knowledge APIs at a non-cwd project tree', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'loom-content-root-'));
  const manifestRoot = path.join(projectRoot, 'knowledge/.cache/manifest');
  await mkdir(manifestRoot, { recursive: true });
  await writeFile(
    path.join(manifestRoot, 'knowledge-nav.json'),
    JSON.stringify({ knowledgeCategories: [], knowledgeTotal: 0 }),
    'utf8',
  );

  process.env.LOOM_CONTENT_ROOT = projectRoot;
  const { knowledgeNavPath } = await import('../lib/knowledge-store');
  assert.equal(knowledgeNavPath(), path.join(projectRoot, 'knowledge/.cache/manifest/knowledge-nav.json'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/runtime-roots.test.ts`  
Expected: FAIL because `knowledge-store` still resolves from `process.cwd()`.

- [ ] **Step 3: Replace raw repo-root assumptions with the shared content-root contract**

```ts
// lib/server-config.ts
import path from 'node:path';
import { resolveContentRoot } from './runtime-roots';

export const CONTENT_ROOT = resolveContentRoot({
  fallbackContentRoot:
    process.env.LOOM_KNOWLEDGE_ROOT?.trim()
    || path.resolve(process.cwd()),
});
```

```ts
// lib/knowledge-store.ts
import { CONTENT_ROOT } from './server-config';

const ROOT = CONTENT_ROOT;
const MANIFEST_ROOT = path.join(ROOT, 'knowledge', '.cache', 'manifest');
```

```ts
// app/api/upload/route.ts
import { CONTENT_ROOT } from '../../../lib/server-config';

const UPLOAD_DIR = path.join(CONTENT_ROOT, 'knowledge', 'uploads');
```

Mirror that same pattern anywhere the installed runtime must read or write project data. Leave purely repo-local build scripts untouched.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
node --import tsx --test tests/runtime-roots.test.ts \
  tests/knowledge-doc-state.test.ts \
  tests/knowledge-doc-write.test.ts \
  tests/knowledge-upload-route.test.ts
```

Expected: PASS with content-root-aware paths still resolving uploads, manifests, and doc writes correctly.

- [ ] **Step 5: Commit**

```bash
git add lib/server-config.ts lib/knowledge-store.ts lib/generated-cache.ts lib/knowledge-doc-cache.ts lib/derived-index-cache.ts \
  app/api/upload/route.ts app/api/source-upload/route.ts app/api/doc-body/route.ts app/api/quiz/route.ts app/api/ask/route.ts \
  app/api/knowledge/create/route.ts app/api/search-index/route.ts tests/runtime-roots.test.ts
git commit -m "refactor: resolve project data from loom content root"
```

---

### Task 3: Build and Stage a Standalone Installed Runtime

**Files:**
- Modify: `/Users/yinyiping/Desktop/Wiki/next.config.mjs`
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/build.mjs`
- Create: `/Users/yinyiping/Desktop/Wiki/scripts/stage-loom-runtime.mjs`
- Test: `/Users/yinyiping/Desktop/Wiki/tests/stage-loom-runtime.test.ts`

- [ ] **Step 1: Write the failing staging test**

```ts
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { stageRuntimeBundle } from '../scripts/stage-loom-runtime.mjs';

test('stageRuntimeBundle writes a versioned runtime and updates current.json', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'loom-stage-runtime-'));
  const buildRoot = path.join(root, '.next-build');
  await mkdir(path.join(buildRoot, 'standalone'), { recursive: true });
  await mkdir(path.join(buildRoot, 'static'), { recursive: true });
  await mkdir(path.join(root, 'public'), { recursive: true });
  await writeFile(path.join(buildRoot, 'BUILD_ID'), 'build-123', 'utf8');
  await writeFile(path.join(buildRoot, 'standalone', 'server.js'), 'console.log(\"ok\")', 'utf8');

  const runtimeRoot = await stageRuntimeBundle({ repoRoot: root, homeOverride: root });

  assert.equal(path.basename(runtimeRoot), 'build-123');
  const activation = JSON.parse(
    await import('node:fs/promises').then((fs) =>
      fs.readFile(path.join(root, 'Library/Application Support/Loom/runtime/current.json'), 'utf8')
    )
  );
  assert.equal(activation.buildId, 'build-123');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/stage-loom-runtime.test.ts`  
Expected: FAIL because `stage-loom-runtime.mjs` does not exist and `build.mjs` still only writes repo `.next-build`.

- [ ] **Step 3: Implement standalone build and staging**

```js
// next.config.mjs
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  distDir: process.env.LOOM_DIST_DIR || '.next',
  output: process.env.LOOM_NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};
```

```js
// scripts/build.mjs
await run(process.execPath, [nextBin, 'build'], {
  LOOM_DIST_DIR: '.next-build',
  LOOM_NEXT_OUTPUT: 'standalone',
  LOOM_NEXT_BUILD_LOCK_HELD: '1',
});
```

```js
// scripts/stage-loom-runtime.mjs
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export async function stageRuntimeBundle({ repoRoot, homeOverride } = {}) {
  const home = homeOverride ?? homedir();
  const buildRoot = path.join(repoRoot, '.next-build');
  const buildId = (await fs.readFile(path.join(buildRoot, 'BUILD_ID'), 'utf8')).trim();
  const runtimeBase = path.join(home, 'Library/Application Support/Loom/runtime');
  const targetRoot = path.join(runtimeBase, buildId);
  await fs.rm(targetRoot, { recursive: true, force: true });
  await fs.mkdir(targetRoot, { recursive: true });

  await fs.cp(path.join(buildRoot, 'standalone'), path.join(targetRoot, 'standalone'), { recursive: true });
  await fs.cp(path.join(buildRoot, 'static'), path.join(targetRoot, 'static'), { recursive: true });
  await fs.cp(path.join(repoRoot, 'public'), path.join(targetRoot, 'public'), { recursive: true });
  await fs.writeFile(
    path.join(runtimeBase, 'current.json'),
    JSON.stringify({ buildId, runtimeRoot: targetRoot }, null, 2),
    'utf8',
  );
  return targetRoot;
}
```

- [ ] **Step 4: Run the staging tests**

Run:

```bash
node --import tsx --test tests/stage-loom-runtime.test.ts
npm run build
```

Expected:
- staging test passes
- build exits `0`
- `.next-build/standalone/server.js` exists

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs scripts/build.mjs scripts/stage-loom-runtime.mjs tests/stage-loom-runtime.test.ts
git commit -m "feat: stage standalone loom runtime"
```

---

### Task 4: Install and Package the Runtime Separately from the Repo

**Files:**
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/install-loom-app.mjs`
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/package-loom-app.mjs`
- Modify: `/Users/yinyiping/Desktop/Wiki/package.json`
- Test: extend `/Users/yinyiping/Desktop/Wiki/tests/stage-loom-runtime.test.ts`

- [ ] **Step 1: Write the failing installer/packager tests**

```ts
test('install script seeds content-root config after staging runtime', async () => {
  const { installRuntimeMetadata } = await import('../scripts/install-loom-app.mjs');
  const root = await mkdtemp(path.join(os.tmpdir(), 'loom-install-runtime-'));

  await installRuntimeMetadata({
    repoRoot: '/tmp/wiki-project',
    homeOverride: root,
    buildId: 'build-123',
    runtimeRoot: path.join(root, 'Library/Application Support/Loom/runtime/build-123'),
  });

  const config = JSON.parse(
    await readFile(path.join(root, 'Library/Application Support/Loom/content-root.json'), 'utf8')
  );
  assert.equal(config.contentRoot, '/tmp/wiki-project');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/stage-loom-runtime.test.ts`  
Expected: FAIL because installer helpers do not persist runtime/content-root metadata yet.

- [ ] **Step 3: Update install/package flow**

```js
// scripts/install-loom-app.mjs
import { stageRuntimeBundle } from './stage-loom-runtime.mjs';

export async function installRuntimeMetadata({ repoRoot, homeOverride, buildId, runtimeRoot }) {
  const home = homeOverride ?? homedir();
  const appSupport = path.join(home, 'Library/Application Support/Loom');
  await fs.mkdir(appSupport, { recursive: true });
  await fs.writeFile(
    path.join(appSupport, 'content-root.json'),
    JSON.stringify({ contentRoot: repoRoot }, null, 2),
    'utf8',
  );
  await fs.writeFile(
    path.join(appSupport, 'runtime/current.json'),
    JSON.stringify({ buildId, runtimeRoot }, null, 2),
    'utf8',
  );
}

async function main() {
  const source = await findBuiltApp();
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const runtimeRoot = await stageRuntimeBundle({ repoRoot });
  const buildId = path.basename(runtimeRoot);
  await installRuntimeMetadata({ repoRoot, buildId, runtimeRoot });
  // existing installTo(...) calls stay after metadata is ready
}
```

```js
// scripts/package-loom-app.mjs
const runtimeRoot = await stageRuntimeBundle({ repoRoot: root });
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', runtimeRoot, path.join(outputRoot, 'Loom-runtime.zip')], {
  stdio: 'inherit',
});
```

```json
// package.json
{
  "scripts": {
    "app:user": "cd macos-app/Loom && ... && cd ../.. && node scripts/install-loom-app.mjs user"
  }
}
```

- [ ] **Step 4: Run verification**

Run:

```bash
node --import tsx --test tests/stage-loom-runtime.test.ts
npm run app:user
```

Expected:
- tests pass
- `~/Library/Application Support/Loom/runtime/current.json` exists
- `~/Library/Application Support/Loom/content-root.json` exists

- [ ] **Step 5: Commit**

```bash
git add scripts/install-loom-app.mjs scripts/package-loom-app.mjs package.json tests/stage-loom-runtime.test.ts
git commit -m "feat: install loom runtime into application support"
```

---

### Task 5: Make the macOS Shell Launch the Installed Runtime

**Files:**
- Create: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/LoomRuntimePaths.swift`
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/DevServer.swift`
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Sources/DevServerPreflight.swift`
- Modify: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Tests/DevServerTests.swift`
- Create: `/Users/yinyiping/Desktop/Wiki/macos-app/Loom/Tests/LoomRuntimePathsTests.swift`

- [ ] **Step 1: Write the failing native tests**

```swift
import XCTest
@testable import Loom

final class LoomRuntimePathsTests: XCTestCase {
    func testResolveInstalledRuntimeRootPrefersActivationRecord() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let runtimeDir = root.appendingPathComponent("Library/Application Support/Loom/runtime", isDirectory: true)
        try fm.createDirectory(at: runtimeDir, withIntermediateDirectories: true)
        let activeRoot = runtimeDir.appendingPathComponent("build-123", isDirectory: true)
        try fm.createDirectory(at: activeRoot, withIntermediateDirectories: true)
        try Data(#"{"buildId":"build-123","runtimeRoot":"\#(activeRoot.path)"}"#.utf8)
            .write(to: runtimeDir.appendingPathComponent("current.json"))

        XCTAssertEqual(
            LoomRuntimePaths.resolveInstalledRuntimeRoot(homeDirectory: root.path),
            activeRoot.path
        )
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/yinyiping/Desktop/Wiki/macos-app/Loom
xcodegen generate
xcodebuild test -project Loom.xcodeproj -scheme LoomTests -destination 'platform=macOS' -only-testing:LoomTests/LoomRuntimePathsTests
```

Expected: FAIL because `LoomRuntimePaths` does not exist and `DevServer` still only probes repo roots.

- [ ] **Step 3: Implement installed-runtime launch**

```swift
// LoomRuntimePaths.swift
import Foundation

enum LoomRuntimePaths {
    static func appSupportRoot(homeDirectory: String = NSHomeDirectory()) -> String {
        "\(homeDirectory)/Library/Application Support/Loom"
    }

    static func resolveInstalledRuntimeRoot(
        env: [String: String] = ProcessInfo.processInfo.environment,
        homeDirectory: String = NSHomeDirectory()
    ) -> String? {
        if let override = env["LOOM_RUNTIME_ROOT"], !override.isEmpty { return override }
        let activationPath = appSupportRoot(homeDirectory: homeDirectory) + "/runtime/current.json"
        guard let data = FileManager.default.contents(atPath: activationPath),
              let payload = try? JSONDecoder().decode(RuntimeActivation.self, from: data)
        else { return nil }
        return payload.runtimeRoot
    }
}
```

```swift
// DevServer.swift production launch sketch
if serverMode == "prod", let runtimeRoot = LoomRuntimePaths.resolveInstalledRuntimeRoot() {
    p.currentDirectoryURL = URL(fileURLWithPath: runtimeRoot)
    env["LOOM_CONTENT_ROOT"] = LoomRuntimePaths.resolveContentRoot() ?? projectPath
    runtimeCommand = "node standalone/server.js"
    requiredExecutables = ["node"]
} else {
    // existing dev fallback stays
}
```

- [ ] **Step 4: Run the native verification**

Run:

```bash
cd /Users/yinyiping/Desktop/Wiki/macos-app/Loom
xcodegen generate
xcodebuild test -project Loom.xcodeproj -scheme LoomTests -destination 'platform=macOS'
```

Expected: PASS, including installed-runtime root resolution and updated `DevServer` tests.

- [ ] **Step 5: Commit**

```bash
git add macos-app/Loom/Sources/LoomRuntimePaths.swift macos-app/Loom/Sources/DevServer.swift \
  macos-app/Loom/Sources/DevServerPreflight.swift macos-app/Loom/Tests/DevServerTests.swift \
  macos-app/Loom/Tests/LoomRuntimePathsTests.swift
git commit -m "feat: launch loom from installed runtime root"
```

---

### Task 6: End-to-End Verification and Repo Cache Cleanup Gate

**Files:**
- Modify: `/Users/yinyiping/Desktop/Wiki/scripts/install-loom-app.mjs`
- Optional docs note: `/Users/yinyiping/Desktop/Wiki/README.md`
- Test: reuse `/Users/yinyiping/Desktop/Wiki/tests/stage-loom-runtime.test.ts` and native tests

- [ ] **Step 1: Add the failing cleanup-safety test**

```ts
test('repo .next-build is only removed after runtime + app install metadata succeeds', async () => {
  const { maybePruneRepoBuildArtifacts } = await import('../scripts/install-loom-app.mjs');
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'loom-prune-gate-'));
  await mkdir(path.join(repoRoot, '.next-build'), { recursive: true });

  await maybePruneRepoBuildArtifacts({
    repoRoot,
    installSucceeded: false,
  });

  assert.equal(existsSync(path.join(repoRoot, '.next-build')), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/stage-loom-runtime.test.ts`  
Expected: FAIL because cleanup gating is not explicit yet.

- [ ] **Step 3: Implement cleanup gating and README note**

```js
export async function maybePruneRepoBuildArtifacts({ repoRoot, installSucceeded }) {
  if (!installSucceeded) return;
  await fs.rm(path.join(repoRoot, '.next-build'), { recursive: true, force: true });
}
```

Add one README note clarifying:

```md
- Installed Loom now stages its production runtime under `~/Library/Application Support/Loom/runtime/`.
- The project checkout remains the content root in Phase 1.
- Repo `.next-build` is no longer required after successful app installation.
```

- [ ] **Step 4: Run final verification**

Run:

```bash
node --import tsx --test tests/runtime-roots.test.ts tests/stage-loom-runtime.test.ts
node --import tsx --test tests/knowledge-doc-state.test.ts tests/knowledge-doc-write.test.ts tests/knowledge-upload-route.test.ts
cd /Users/yinyiping/Desktop/Wiki/macos-app/Loom && xcodegen generate && xcodebuild test -project Loom.xcodeproj -scheme LoomTests -destination 'platform=macOS'
cd /Users/yinyiping/Desktop/Wiki && npm run build
npm run app:user
rm -rf /Users/yinyiping/Desktop/Wiki/.next-build
open /Users/yinyiping/Applications/Loom.app
curl -sf http://127.0.0.1:3001/api/health
```

Expected:
- all tests pass
- build exits `0`
- installed app launches with repo `.next-build` removed
- `/api/health` returns JSON containing `"ok":true`

- [ ] **Step 5: Commit**

```bash
git add scripts/install-loom-app.mjs README.md tests/stage-loom-runtime.test.ts
git commit -m "chore: prune repo build cache after loom install"
```

---

## Self-Review

- **Spec coverage:** This plan covers runtime root creation, content-root resolution, standalone staging, installer activation, native launch changes, and cleanup gating. It intentionally does not cover bundling Node or moving the content library out of the project root.
- **Placeholder scan:** No `TODO`, `TBD`, or “appropriate handling” placeholders remain. Each task names exact files, commands, and code shapes.
- **Type consistency:** The plan consistently uses `runtime/current.json` as the activation record, `content-root.json` as the persisted content-root setting, and `LOOM_CONTENT_ROOT` as the installed-runtime server environment variable.

