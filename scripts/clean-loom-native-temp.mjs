import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const apply = process.argv.includes('--apply');
const launchServicesRegister = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';
const tempRoots = [...new Set([os.tmpdir(), '/private/tmp'].map((target) => path.resolve(target)))];

function canonicalTempPath(target) {
  return path.resolve(target).replace(/^\/tmp\//, '/private/tmp/');
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function listDirSafe(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function isSafeLoomTempPath(target) {
  const normalized = canonicalTempPath(target);
  return tempRoots.some((root) => {
    const canonicalRoot = canonicalTempPath(root);
    if (normalized !== canonicalRoot && !normalized.startsWith(`${canonicalRoot}${path.sep}`)) return false;

    const relative = path.relative(canonicalRoot, normalized);
    if (relative.startsWith('loom-')) return true;
    return relative.includes(`${path.sep}scratchpad${path.sep}loom-build`);
  });
}

async function collectRecursiveDirs(root, predicate, maxDepth = 8, depth = 0) {
  if (depth > maxDepth) return [];
  const entries = await listDirSafe(root);
  const found = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(root, entry.name);
    if (predicate(entryPath, entry.name)) {
      found.push(entryPath);
      continue;
    }
    found.push(...await collectRecursiveDirs(entryPath, predicate, maxDepth, depth + 1));
  }

  return found;
}

async function collectTempTargets() {
  const targets = [];

  for (const tmpRoot of tempRoots) {
    const entries = await listDirSafe(tmpRoot);

    for (const entry of entries) {
      if (!entry.name.startsWith('loom-')) continue;
      targets.push(canonicalTempPath(path.join(tmpRoot, entry.name)));
    }

    const claudeScratchRoot = path.join(tmpRoot, 'claude-501');
    if (await pathExists(claudeScratchRoot)) {
      targets.push(...await collectRecursiveDirs(
        claudeScratchRoot,
        (entryPath, name) => name === 'loom-build' && entryPath.includes(`${path.sep}scratchpad${path.sep}`),
      ));
    }
  }

  return [...new Set(targets)].filter(isSafeLoomTempPath).sort();
}

async function collectAppBundles(root, maxDepth = 8, depth = 0) {
  if (depth > maxDepth) return [];
  const entries = await listDirSafe(root);
  const found = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(root, entry.name);
    if (entry.name === 'Loom.app') {
      found.push(entryPath);
      continue;
    }
    found.push(...await collectAppBundles(entryPath, maxDepth, depth + 1));
  }

  return found;
}

function launchServicesDump() {
  try {
    return execFileSync(launchServicesRegister, ['-dump'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function collectRegisteredTempApps() {
  const dump = launchServicesDump();
  const matches = dump.matchAll(/path:\s+(.+?Loom\.app)(?:\s+\(|\n)/g);
  const paths = [];

  for (const match of matches) {
        const appPath = canonicalTempPath(match[1].trim());
    if (isSafeLoomTempPath(appPath)) paths.push(appPath);
  }

  return [...new Set(paths)].sort();
}

function unregisterApp(appPath) {
  try {
    execFileSync(launchServicesRegister, ['-u', appPath], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function updateDynamicServices() {
  try {
    execFileSync('/usr/bin/swift', ['-e', 'import AppKit; NSUpdateDynamicServices()'], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
  } catch {
    // The filesystem cleanup is still useful if AppKit service refresh fails.
  }
}

async function main() {
  const tempTargets = await collectTempTargets();
  const existingTempApps = (await Promise.all(tempTargets.map((target) => collectAppBundles(target)))).flat();
  const registeredTempApps = collectRegisteredTempApps();
  const appsToUnregister = [...new Set([...existingTempApps, ...registeredTempApps])]
    .filter(isSafeLoomTempPath)
    .sort();

  if (appsToUnregister.length === 0 && tempTargets.length === 0) {
    console.log('No Loom native temporary registrations or files found.');
    return;
  }

  for (const appPath of appsToUnregister) {
    if (apply) {
      const ok = unregisterApp(appPath);
      console.log(`${ok ? 'unregistered' : 'could not unregister'} ${appPath}`);
    } else {
      console.log(`would unregister ${appPath}`);
    }
  }

  for (const target of tempTargets) {
    if (apply) {
      await fs.rm(target, { recursive: true, force: true });
      console.log(`removed ${target}`);
    } else {
      console.log(`would remove ${target}`);
    }
  }

  if (apply) {
    updateDynamicServices();
  } else {
    console.log('Dry run only. Re-run with --apply to unregister and remove these paths.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
