import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const includeDevCache = process.argv.includes('--include-dev-cache');

const generatedTargets = [
  '.next-build',
  '.next-export',
  '.next-export-shelf',
  'public/pagefind',
];

if (includeDevCache) {
  generatedTargets.push('.next-app-dev');
}

async function exists(target) {
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

function isFinderDuplicateName(name) {
  return / [23]$/.test(name) || / [23]\./.test(name);
}

async function collectNodeModuleDuplicates() {
  const nodeModules = path.join(root, 'node_modules');
  const entries = await listDirSafe(nodeModules);
  const targets = [];

  for (const entry of entries) {
    const entryPath = path.join(nodeModules, entry.name);
    if (isFinderDuplicateName(entry.name)) {
      targets.push(entryPath);
      continue;
    }

    if (!entry.isDirectory() || !entry.name.startsWith('@')) continue;
    const scopedEntries = await listDirSafe(entryPath);
    for (const scopedEntry of scopedEntries) {
      if (isFinderDuplicateName(scopedEntry.name)) {
        targets.push(path.join(entryPath, scopedEntry.name));
      }
    }
  }

  return targets;
}

async function collectTargets() {
  const targets = [];

  for (const rel of generatedTargets) {
    const abs = path.join(root, rel);
    if (await exists(abs)) targets.push(abs);
  }

  targets.push(...await collectNodeModuleDuplicates());

  for (const rel of ['.git/index 2', '.git/index 3']) {
    const abs = path.join(root, rel);
    if (await exists(abs)) targets.push(abs);
  }

  return targets;
}

async function main() {
  const targets = await collectTargets();

  if (targets.length === 0) {
    console.log('No generated workspace clutter found.');
    return;
  }

  for (const target of targets) {
    const rel = path.relative(root, target);
    if (apply) {
      await fs.rm(target, { recursive: true, force: true });
      console.log(`removed ${rel}`);
    } else {
      console.log(`would remove ${rel}`);
    }
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to remove these paths.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
