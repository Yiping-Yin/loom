import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('CI includes a dedicated macOS app build job', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );

  assert.match(source, /macos-app-smoke:/);
  assert.match(source, /runs-on:\s*macos-latest/);
  assert.match(source, /npm run test:contracts/);
  assert.match(source, /brew install xcodegen/);
  assert.match(source, /npm run app:check-project/);
  assert.match(source, /npm run app:user/);
  assert.match(source, /npm run app:smoke/);
  assert.doesNotMatch(source, /CODEX_BIN:\s*\.\/scripts\/fake-codex-cli\.mjs/);
});

test('CI gates lint, fast typecheck, and the native LoomTests suite (Stage 0 governance floor)', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );

  assert.match(source, /name: Lint\n\s+run: npm run lint/);
  assert.match(source, /name: Fast typecheck\n\s+run: npm run typecheck:fast/);
  assert.match(
    source,
    /name: LoomTests\n\s+run: LOOM_SKIP_WEB_STAGE=1 xcodebuild test -project macos-app\/Loom\/Loom\.xcodeproj -scheme Loom -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO/,
  );
});

test('macOS project checker supports nested Swift sources and path roots', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'check-loom-macos-project-files.mjs'),
    'utf8',
  );

  assert.match(source, /function walk\(dir\)/);
  assert.match(source, /entry\.isDirectory\(\)/);
  assert.match(source, /walk\(fullPath\)/);
  assert.ok(source.includes('(?:path:\\\\s*)?'));
  assert.match(source, /escapeRegExp\(requiredSource\)/);
});
