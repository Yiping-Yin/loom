import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = path.join(root, process.env.LOOM_DIST_DIR || '.next');
const appBuildManifestPath = path.join(nextDir, 'app-build-manifest.json');
const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

const manifestJson = JSON.stringify({
  version: 3,
  caseSensitive: false,
  basePath: '',
  rewrites: {
    beforeFiles: [],
    afterFiles: [],
    fallback: [],
  },
  redirects: [
    {
      source: '/:path+/',
      destination: '/:path+',
      permanent: true,
      internal: true,
      regex: '^(?:\\/((?:[^\\/]+?)(?:\\/(?:[^\\/]+?))*))\\/$',
    },
  ],
  headers: [],
});

function ensureRoutesManifest() {
  mkdirSync(nextDir, { recursive: true });
  if (existsSync(routesManifestPath)) {
    try {
      if (statSync(routesManifestPath).size > 0) return;
    } catch {}
  }
  writeFileSync(routesManifestPath, manifestJson);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function findMissingAppManifestAssets() {
  const manifest = readJsonFile(appBuildManifestPath);
  const pages = manifest && typeof manifest === 'object' ? manifest.pages : null;

  if (!pages || typeof pages !== 'object') return [];

  const missing = [];

  for (const assets of Object.values(pages)) {
    if (!Array.isArray(assets)) continue;

    for (const asset of assets) {
      if (typeof asset !== 'string' || !asset.startsWith('static/')) continue;

      const assetPath = path.join(nextDir, asset);
      if (!existsSync(assetPath)) missing.push(asset);
    }
  }

  return missing;
}

function removeCorruptNextDirIfNeeded() {
  const missing = findMissingAppManifestAssets();

  if (missing.length === 0) return;

  const relativeNextDir = path.relative(root, nextDir) || nextDir;
  const listed = missing.slice(0, 6).join(', ');
  const more = missing.length > 6 ? `, and ${missing.length - 6} more` : '';

  console.warn(
    `dev: removing stale ${relativeNextDir}; app-build-manifest references missing assets: ${listed}${more}`,
  );

  rmSync(nextDir, {
    recursive: true,
    force: true,
    maxRetries: 2,
    retryDelay: 100,
  });
}

removeCorruptNextDirIfNeeded();
ensureRoutesManifest();

const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const interval = setInterval(ensureRoutesManifest, 250);

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', forwardSignal);
process.on('SIGTERM', forwardSignal);

child.on('exit', (code, signal) => {
  clearInterval(interval);
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
