import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  buildInstallFailure,
  installLoomApp,
  installRuntimeMetadata,
  isPermissionFallbackError,
  maybePruneInstalledSourceArtifact,
} from '../scripts/install-loom-app.mjs';
import { runInstalledAppSmoke } from '../scripts/installed-app-smoke.mjs';
import { assertNoStaleBuildArtifacts, findStaleBuildArtifacts, removeDuplicateArtifacts } from '../scripts/next-build-lock.mjs';
import {
  createDittoArchiveArgs,
  findPackageSourceApp,
  packageLoomApp,
  resolveOutputRoot,
} from '../scripts/package-loom-app.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('install script treats ditto permission stderr as fallback-eligible', () => {
  const error = buildInstallFailure(1, 'ditto: /Applications/Loom.app: Permission denied\n') as Error & { code?: string };

  assert.equal(error.code, 'EACCES');
  assert.equal(isPermissionFallbackError(error), true);
});

test('install script does not classify generic ditto failures as permission fallbacks', () => {
  const error = buildInstallFailure(1, 'ditto: some unrelated failure\n') as Error & { code?: string };

  assert.equal(isPermissionFallbackError(error), false);
});

test('install script preserves an existing user-selected content root', async () => {
  const homeRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-install-home-'));
  const appSupport = path.join(homeRoot, 'Library', 'Application Support', 'Loom');
  const pickedRoot = path.join(homeRoot, 'Knowledge', 'INFS 3822');

  try {
    fs.mkdirSync(appSupport, { recursive: true });
    fs.writeFileSync(
      path.join(appSupport, 'content-root.json'),
      JSON.stringify({ contentRoot: pickedRoot }, null, 2),
      'utf8',
    );

    await installRuntimeMetadata({ repoRoot: '/repo/Wiki', homeOverride: homeRoot, env: { NODE_ENV: 'test' } });

    const persisted = JSON.parse(
      fs.readFileSync(path.join(appSupport, 'content-root.json'), 'utf8'),
    ) as { contentRoot?: string };
    assert.equal(persisted.contentRoot, pickedRoot);
  } finally {
    fs.rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('install script initializes content root only when no user selection exists', async () => {
  const homeRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-install-home-'));
  const appSupport = path.join(homeRoot, 'Library', 'Application Support', 'Loom');

  try {
    await installRuntimeMetadata({ repoRoot: '/repo/Wiki', homeOverride: homeRoot, env: { NODE_ENV: 'test' } });

    const persisted = JSON.parse(
      fs.readFileSync(path.join(appSupport, 'content-root.json'), 'utf8'),
    ) as { contentRoot?: string };
    assert.equal(persisted.contentRoot, '/repo/Wiki');
  } finally {
    fs.rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('install script removes the DerivedData source app after a successful install', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-install-source-prune-'));

  try {
    const derivedDataRoot = path.join(tempRoot, 'DerivedData');
    const sourceApp = path.join(derivedDataRoot, 'Loom-test', 'Build', 'Products', 'Release', 'Loom.app');
    const installedApp = path.join(tempRoot, 'Applications', 'Loom.app');

    fs.mkdirSync(path.join(sourceApp, 'Contents'), { recursive: true });
    fs.mkdirSync(path.join(installedApp, 'Contents'), { recursive: true });

    await maybePruneInstalledSourceArtifact({
      source: sourceApp,
      target: installedApp,
      installSucceeded: true,
      derivedDataRootOverride: derivedDataRoot,
    });

    assert.equal(fs.existsSync(sourceApp), false);
    assert.equal(fs.existsSync(installedApp), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('install script does not prune non-DerivedData app bundles', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-install-source-keep-'));

  try {
    const derivedDataRoot = path.join(tempRoot, 'DerivedData');
    const archiveApp = path.join(tempRoot, 'archive', 'Loom.xcarchive', 'Products', 'Applications', 'Loom.app');
    const installedApp = path.join(tempRoot, 'Applications', 'Loom.app');

    fs.mkdirSync(path.join(archiveApp, 'Contents'), { recursive: true });
    fs.mkdirSync(path.join(installedApp, 'Contents'), { recursive: true });

    await maybePruneInstalledSourceArtifact({
      source: archiveApp,
      target: installedApp,
      installSucceeded: true,
      derivedDataRootOverride: derivedDataRoot,
    });

    assert.equal(fs.existsSync(archiveApp), true);
    assert.equal(fs.existsSync(installedApp), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('install script still prunes the source app when repo cache cleanup fails', async () => {
  const homeRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-install-cleanup-order-'));
  const originalWarn = console.warn;
  const warnings: string[] = [];

  try {
    let sourceCleanupCalled = false;
    console.warn = (message?: unknown) => {
      warnings.push(String(message ?? ''));
    };

    await installLoomApp({
      mode: 'user',
      repoRoot: path.join(homeRoot, 'repo'),
      homeOverride: homeRoot,
      sourceAppPath: path.join(homeRoot, 'DerivedData', 'Loom-test', 'Build', 'Products', 'Release', 'Loom.app'),
      dependencies: {
        installTo: async () => {},
        stageRuntimeBundle: async () => path.join(homeRoot, 'runtime'),
        installRuntimeMetadata: async () => {},
        maybePruneRepoBuildArtifacts: async () => {
          throw new Error('repo cleanup failed');
        },
        maybePruneInstalledSourceArtifact: async () => {
          sourceCleanupCalled = true;
        },
      },
    });

    assert.equal(sourceCleanupCalled, true);
    assert.match(warnings.join('\n'), /repo cleanup failed/);
  } finally {
    console.warn = originalWarn;
    fs.rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('package script resolves output under the repository root instead of a machine-specific path', () => {
  const fakeScriptUrl = pathToFileURL(
    path.join('/tmp', 'workspace', 'Wiki', 'scripts', 'package-loom-app.mjs'),
  ).href;

  assert.equal(
    resolveOutputRoot(fakeScriptUrl),
    path.join('/tmp', 'workspace', 'Wiki', 'output'),
  );
});

test('package script falls back to the installed app after install cleanup removes DerivedData app', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-installed-app-test-'));

  try {
    const installedRoot = path.join(tempRoot, 'Applications');
    const appPath = path.join(installedRoot, 'Loom.app');
    fs.mkdirSync(path.join(appPath, 'Contents'), { recursive: true });

    const found = await findPackageSourceApp({
      derivedDataRoot: path.join(tempRoot, 'DerivedData'),
      applicationRoots: [installedRoot],
    });

    assert.equal(found, appPath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('package script skips the retired runtime archive when no runtime is staged', () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-package-test-'));

  try {
    const appPath = path.join(tempRoot, 'Loom.app');
    fs.mkdirSync(path.join(appPath, 'Contents', 'Resources', 'web'), { recursive: true });
    fs.writeFileSync(path.join(appPath, 'Contents', 'Info.plist'), '<plist version="1.0"></plist>');
    fs.writeFileSync(path.join(appPath, 'Contents', 'Resources', 'web', 'index.html'), '<!doctype html>');

    const outputRoot = path.join(tempRoot, 'output');
    const archiveCalls: Array<{ sourcePath: string; archivePath: string }> = [];
    const result = packageLoomApp({
      appPath,
      runtimeRoot: null,
      outputRoot,
      contentRoot: tempRoot,
      archiveFile: (sourcePath, archivePath) => {
        archiveCalls.push({ sourcePath, archivePath });
        fs.writeFileSync(archivePath, `archive:${sourcePath}`);
      },
    });

    assert.equal(result.appArchivePath, path.join(outputRoot, 'Loom-replacement.zip'));
    assert.equal(result.runtimeArchivePath, null);
    assert.deepEqual(archiveCalls, [{ sourcePath: appPath, archivePath: result.appArchivePath }]);
    assert.equal(fs.existsSync(result.appArchivePath), true);
    assert.equal(fs.existsSync(path.join(outputRoot, 'Loom-runtime.zip')), false);

    const readme = fs.readFileSync(path.join(outputRoot, 'INSTALL-LOOM.txt'), 'utf8');
    assert.match(readme, /Resources\/web/);
    assert.match(readme, /Runtime archive: not produced/);
    assert.doesNotMatch(readme, /runtime\/current\.json/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('package script creates clean archives without AppleDouble metadata', () => {
  const args = createDittoArchiveArgs('/tmp/Loom.app', '/tmp/Loom-replacement.zip');

  assert.deepEqual(args, [
    '-c',
    '-k',
    '--norsrc',
    '--noextattr',
    '--keepParent',
    '/tmp/Loom.app',
    '/tmp/Loom-replacement.zip',
  ]);
  assert.equal(args.includes('--sequesterRsrc'), false);
});

test('build cleanup removes macOS metadata and Finder duplicate artifacts recursively', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-stale-artifacts-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'index.html'), '<!doctype html>');
    fs.writeFileSync(path.join(tempRoot, '.DS_Store'), 'finder metadata');
    fs.writeFileSync(path.join(tempRoot, 'chunk 2.js'), 'duplicate chunk');
    fs.writeFileSync(path.join(tempRoot, 'nested', '._index.html'), 'appledouble metadata');
    fs.writeFileSync(path.join(tempRoot, 'nested', 'style 12.css'), 'duplicate stylesheet');

    await removeDuplicateArtifacts(tempRoot);

    assert.equal(fs.existsSync(path.join(tempRoot, 'index.html')), true);
    assert.equal(fs.existsSync(path.join(tempRoot, '.DS_Store')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'chunk 2.js')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'nested', '._index.html')), false);
    assert.equal(fs.existsSync(path.join(tempRoot, 'nested', 'style 12.css')), false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build cleanup exposes stale artifacts for release gates', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-stale-artifacts-gate-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'nested 2'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'index.html'), '<!doctype html>');
    fs.writeFileSync(path.join(tempRoot, 'search-index 3.json'), '{}');

    const stale = await findStaleBuildArtifacts(tempRoot);

    assert.deepEqual(stale.sort(), [
      path.join(tempRoot, 'nested 2'),
      path.join(tempRoot, 'search-index 3.json'),
    ].sort());
    await assert.rejects(
      () => assertNoStaleBuildArtifacts(tempRoot, 'test export'),
      /stale macOS\/Finder build artifacts remain in test export/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build cleanup fails loudly when stale artifacts cannot be removed', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-stale-artifacts-locked-'));

  try {
    fs.writeFileSync(path.join(tempRoot, '.DS_Store'), 'finder metadata');
    fs.chmodSync(tempRoot, 0o500);

    await assert.rejects(
      () => removeDuplicateArtifacts(tempRoot),
      /failed to remove stale macOS\/Finder build artifacts/,
    );
  } finally {
    fs.chmodSync(tempRoot, 0o700);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('installed app smoke rejects stale macOS metadata in bundled web resources', async () => {
  const tempRoot = fs.mkdtempSync(path.join(tmpdir(), 'loom-installed-stale-web-'));
  const previousSkipCodesign = process.env.LOOM_SMOKE_SKIP_CODESIGN;

  try {
    const appPath = path.join(tempRoot, 'Loom.app');
    const contents = path.join(appPath, 'Contents');
    const resources = path.join(contents, 'Resources');
    const webRoot = path.join(resources, 'web');

    fs.mkdirSync(path.join(contents, 'MacOS'), { recursive: true });
    fs.mkdirSync(webRoot, { recursive: true });
    fs.writeFileSync(path.join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.yinyiping.loom</string>
  <key>CFBundleDisplayName</key>
  <string>Loom</string>
</dict>
</plist>
`, 'utf8');
    fs.writeFileSync(path.join(contents, 'MacOS', 'Loom'), 'binary');
    fs.writeFileSync(path.join(resources, 'PrivacyInfo.xcprivacy'), '<plist version="1.0"></plist>');
    fs.writeFileSync(path.join(webRoot, 'index.html'), '<!doctype html><script src="/_next/static/chunk.js"></script>');
    fs.writeFileSync(path.join(webRoot, 'digital-me.html'), '<!doctype html>');
    fs.writeFileSync(path.join(webRoot, 'knowledge.html'), '<!doctype html>');
    for (let index = 0; index < 55; index += 1) {
      fs.writeFileSync(path.join(webRoot, `asset-${index}.txt`), 'asset');
    }
    fs.writeFileSync(path.join(webRoot, '.DS_Store'), 'finder metadata');

    process.env.LOOM_SMOKE_SKIP_CODESIGN = '1';

    await assert.rejects(
      () => runInstalledAppSmoke({ appPath }),
      /stale macOS\/Finder artifacts: \.DS_Store/,
    );
  } finally {
    if (previousSkipCodesign === undefined) {
      delete process.env.LOOM_SMOKE_SKIP_CODESIGN;
    } else {
      process.env.LOOM_SMOKE_SKIP_CODESIGN = previousSkipCodesign;
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('release app scripts build the static export before Xcode Release packaging', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(path.resolve(__dirname, '..'), 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  const buildInstallSource = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'scripts', 'build-install-loom-app.mjs'),
    'utf8',
  );

  assert.equal(pkg.scripts?.['app:package'], 'node scripts/package-loom-app.mjs');
  assert.equal(pkg.scripts?.['app'], 'node scripts/build-install-loom-app.mjs auto');
  assert.equal(pkg.scripts?.['app:user'], 'node scripts/build-install-loom-app.mjs user');
  assert.equal(pkg.scripts?.['app:system'], 'node scripts/build-install-loom-app.mjs system');

  const exportIndex: number = buildInstallSource.indexOf('scripts/build-static-export.mjs');
  const xcodeIndex: number = buildInstallSource.indexOf("run('xcodebuild'");
  const installIndex: number = buildInstallSource.indexOf('scripts/install-loom-app.mjs');
  const cleanIndex: number = buildInstallSource.indexOf('scripts/clean-loom-app-bundles.mjs');

  assert.notEqual(exportIndex, -1, 'build-install-loom-app.mjs must run build-static-export.mjs');
  assert.notEqual(xcodeIndex, -1, 'build-install-loom-app.mjs must run the Release Xcode build');
  assert.notEqual(installIndex, -1, 'build-install-loom-app.mjs must install the built app');
  assert.notEqual(cleanIndex, -1, 'build-install-loom-app.mjs must clean DerivedData app bundles');
  assert.equal(exportIndex < xcodeIndex, true, 'static export must run before xcodebuild');
  assert.equal(xcodeIndex < installIndex, true, 'xcodebuild must run before install');
  assert.match(buildInstallSource, /assertNoStaleBuildArtifacts\(path\.join\(repoRoot, '\.next-export'\), '\.next-export after static export'\)/);
  assert.match(buildInstallSource, /assertNoStaleBuildArtifacts\(path\.join\(repoRoot, '\.next-export'\), '\.next-export after Xcode staging'\)/);
  assert.match(buildInstallSource, /ensure-xcode27-environment\.mjs/);
  assert.equal(buildInstallSource.includes('finally'), true, 'cleanup must run after failures too');
  assert.doesNotMatch(buildInstallSource, /cd\s+macos-app\/Loom|cd\s+\.\.\/\.\./);
});

test('local macOS run entrypoint builds the current Xcode app and wires Codex Run', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const runScriptPath = path.join(repoRoot, 'script', 'build_and_run.sh');
  const environmentPath = path.join(repoRoot, '.codex', 'environments', 'environment.toml');
  const verifierPath = path.join(repoRoot, 'scripts', 'verify-native-sidecar.mjs');

  const runScript = fs.readFileSync(runScriptPath, 'utf8');
  // .codex/ is gitignored machine-local Codex config, so the file is absent
  // on CI — assert on it only when present (same skip-when-absent pattern as
  // the gitignored optibook fixtures).
  const environment = fs.existsSync(environmentPath)
    ? fs.readFileSync(environmentPath, 'utf8')
    : null;
  const verifier = fs.readFileSync(verifierPath, 'utf8');

  assert.match(runScript, /xcodebuild/);
  assert.match(runScript, /ensure-xcode27-environment\.mjs/);
  assert.match(runScript, /-project "\$PROJECT_DIR\/Loom\.xcodeproj"/);
  assert.match(runScript, /-scheme "\$APP_NAME"/);
  assert.match(runScript, /-derivedDataPath "\$DERIVED_DATA"/);
  assert.match(runScript, /APP_BUNDLE="\$DERIVED_DATA\/Build\/Products\/Debug\/\$APP_NAME\.app"/);
  assert.match(runScript, /pgrep -x "\$APP_NAME"/);
  assert.doesNotMatch(runScript, /swift build/);

  if (environment !== null) {
    assert.match(environment, /name = "LOOM"/);
    assert.match(environment, /command = "\.\/script\/build_and_run\.sh"/);
  }

  assert.match(verifier, /process\.env\.LOOM_APP_PATH/);
  assert.match(verifier, /path\.resolve\(process\.env\.LOOM_APP_PATH\)/);
  assert.match(verifier, /appUnderTest/);
  assert.match(verifier, /function processCommands\(name\)/);
  assert.match(verifier, /execFileSync\('\/usr\/bin\/pgrep', \['-x', name\]/);
  assert.match(verifier, /execFileSync\('\/bin\/ps', \['-p', pid, '-o', 'command='\]/);
  assert.match(verifier, /function appUnderTestMetadata\(\)/);
  assert.match(verifier, /function fixtureMetadata\(fixtures = \{\}/);
  assert.match(verifier, /function runtimeMetadata\(\)/);
  assert.match(verifier, /function openAppBundle\(target\)/);
  assert.match(verifier, /execFileSync\('\/usr\/bin\/open', \[target\]/);
  assert.match(verifier, /openAppBundle\(appPath\)/);
  assert.match(verifier, /function openFileWithLoom\(target\)/);
  assert.match(verifier, /execFileSync\('\/usr\/bin\/open', \['-a', appPath, target\]/);
  assert.match(verifier, /openFileWithLoom\(pdfPath\)/);
  assert.match(verifier, /openFileWithLoom\(fixtures\.docx\)/);
  assert.match(verifier, /openFileWithLoom\(fixtures\.csv\)/);
  assert.doesNotMatch(verifier, /\/usr\/bin\/open -a \$\{JSON\.stringify\(appPath\)\}/);
  assert.match(verifier, /original-file-open-handoff/);
  assert.match(verifier, /function parseCapturedInputLine\(item\)/);
  assert.match(verifier, /function traceIntegrityFor\(reflectionCase\)/);
  assert.match(verifier, /function allTraceIntegrityPassed\(report\)/);
  assert.match(verifier, /sourceAnchors/);
  assert.match(verifier, /focusLabels/);
  assert.match(verifier, /selectedText/);
  assert.match(verifier, /passMetadata/);
  assert.match(verifier, /traceTypeMetadata/);
  assert.match(verifier, /secondPassReadiness/);
  assert.match(verifier, /thinking-version-integrity/);
  assert.match(verifier, /reviewable understanding versions with source anchor, anchor precision, weak-anchor disclosure, focus, selected text, pass metadata, trace type, and second-pass readiness/);
  assert.match(verifier, /### Thinking Version Integrity/);
  assert.match(verifier, /appUnderTest: appUnderTestMetadata\(\)/);
  assert.match(verifier, /fixtures: fixtureMetadata\(fixtures, pdfSource\)/);
  assert.match(verifier, /runtime: runtimeMetadata\(\)/);
  assert.match(verifier, /`- App under test: \$\{report\.appUnderTest\.path\}`/);
  assert.match(verifier, /`- PDF path: \$\{report\.fixtures\.pdf\.path\}`/);
  assert.match(verifier, /pdfFixture: fixtureMetadata\(\)\.pdf/);
  assert.match(verifier, /\.\.\.runtimeMetadata\(\)/);
  assert.match(verifier, /runningApplicationCommands/);
  assert.match(verifier, /debugAppGuiVerification/);
  assert.doesNotMatch(verifier, /installedApp:/);
});

test('installed app smoke is sandbox-compatible and does not call CLI AI', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  const source = fs.readFileSync(path.join(repoRoot, 'scripts', 'installed-app-smoke.mjs'), 'utf8');

  assert.equal(pkg.scripts?.['app:smoke'], 'node scripts/installed-app-smoke.mjs');
  assert.match(source, /com\.yinyiping\.loom/);
  assert.match(source, /Resources/);
  assert.match(source, /index\.html/);
  assert.match(source, /PrivacyInfo\.xcprivacy/);
  assert.match(source, /com\.apple\.security\.app-sandbox/);
  assert.match(source, /codesign/);
  assert.match(source, /pathToFileURL\(process\.argv\[1\]\)\.href/);
  assert.doesNotMatch(source, /CODEX_BIN|\/api\/chat|server\.js/);
});

test('CLI script entry guards survive workspace paths with spaces', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const smokeSource = fs.readFileSync(path.join(repoRoot, 'scripts', 'installed-app-smoke.mjs'), 'utf8');
  const ingestSource = fs.readFileSync(path.join(repoRoot, 'scripts', 'ingest-knowledge.ts'), 'utf8');

  assert.match(smokeSource, /pathToFileURL\(process\.argv\[1\]\)\.href/);
  assert.match(ingestSource, /pathToFileURL\(process\.argv\[1\]\)\.href/);
  assert.doesNotMatch(smokeSource, /`file:\/\/\$\{process\.argv\[1\]\}`/);
  assert.doesNotMatch(ingestSource, /`file:\/\/\$\{process\.argv\[1\]\}`/);
});

test('web smoke samples the same derived knowledge fixture that the server reads', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.join(repoRoot, 'scripts', 'smoke.mjs'), 'utf8');

  assert.match(source, /const smokeDerivedDataRoot = process\.env\.LOOM_SMOKE_DERIVED_DATA_ROOT/);
  assert.match(source, /path\.join\(smokeDerivedDataRoot, 'knowledge', '\.cache', 'manifest', 'knowledge-manifest\.json'\)/);
  assert.match(source, /LOOM_DERIVED_DATA_ROOT: smokeDerivedDataRoot/);
});

test('Release Xcode bundle staging fails when the static export is missing', () => {
  const spec = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'macos-app', 'Loom', 'project.yml'),
    'utf8',
  );

  assert.match(spec, /CONFIGURATION:-/);
  assert.match(spec, /Release/);
  assert.match(spec, /exit 1/);
  assert.match(spec, /build-static-export\.mjs/);
});

test('new Loom product gates are executable and approval-safe', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const approvalVerifier = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'verify-approval-gates-ready.mjs'),
    'utf8',
  );
  const completionVerifier = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'verify-new-loom-completion-audit.mjs'),
    'utf8',
  );
  const activeReadme = fs.readFileSync(
    path.join(repoRoot, 'docs', 'projects', 'active', 'README.md'),
    'utf8',
  );

  assert.equal(
    pkg.scripts?.['verify:new-loom-audit'],
    'node scripts/verify-new-loom-completion-audit.mjs',
  );
  assert.equal(
    pkg.scripts?.['verify:approval-gates-ready'],
    'node scripts/verify-approval-gates-ready.mjs',
  );
  assert.match(pkg.scripts?.['verify:product'] ?? '', /verify:new-loom-audit/);
  assert.match(pkg.scripts?.['verify:product'] ?? '', /verify:approval-gates-ready/);
  assert.match(pkg.scripts?.['verify:product'] ?? '', /typecheck/);
  assert.match(pkg.scripts?.['verify:product'] ?? '', /test:contracts/);
  assert.match(pkg.scripts?.['verify:product'] ?? '', /app:user/);
  assert.match(pkg.scripts?.['verify:product'] ?? '', /app:smoke/);
  assert.doesNotMatch(pkg.scripts?.['verify:product'] ?? '', /verify:real-files-importer/);
  assert.doesNotMatch(pkg.scripts?.['verify:product'] ?? '', /LOOM_REAL_FILE_ROOT/);

  assert.match(approvalVerifier, /approval_required/);
  assert.match(approvalVerifier, /--json/);
  assert.match(approvalVerifier, /Real user-file installed-app importer acceptance/);
  assert.match(approvalVerifier, /Live provider-output Compile\/Draft acceptance/);
  assert.match(approvalVerifier, /Do not send a real provider request/);
  assert.match(approvalVerifier, /Do not import real files through the installed UI/);

  assert.match(completionVerifier, /new Loom completion audit ok/);
  assert.match(completionVerifier, /verify:product must run only safe non-approval gates/);
  assert.match(completionVerifier, /Finder-numbered duplicate artifacts/);

  assert.match(activeReadme, /Current Reading Order/);
  assert.match(activeReadme, /sidecar\/reflection standard/);
  assert.match(activeReadme, /original file activity -> anchored learning trace -> second-pass synthesis -> reusable memory/);
  assert.match(activeReadme, /external learning and thinking layer around original/);
  assert.match(activeReadme, /2026-05-15-new-loom-acceptance-status\.md/);
  assert.match(activeReadme, /Sources \/ Studio \/ Digital Me/);
  assert.match(activeReadme, /historical reference only/);
  assert.match(activeReadme, /Real user-file installed-app importer acceptance/);
  assert.match(activeReadme, /Live provider-output Compile\/Draft acceptance/);
});
