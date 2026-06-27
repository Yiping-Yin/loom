#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertCheck(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(source, needles) {
  return needles.every((needle) => source.includes(needle));
}

function walkForNumberedArtifacts(relativeRoot) {
  const root = path.join(repoRoot, relativeRoot);
  if (!fs.existsSync(root)) return [];
  const matches = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(repoRoot, full);
      if (/^(.+ )\d+(\.[^/]+)?$/.test(entry.name)) {
        matches.push(relative);
      }
      if (entry.isDirectory()) walk(full);
    }
  }

  walk(root);
  return matches;
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts ?? {};
const activeReadme = read('docs/projects/active/README.md');
const activeStatus = read('docs/projects/active/2026-05-15-new-loom-acceptance-status.md');
const completionAudit = read('docs/projects/active/2026-05-09-new-loom-completion-audit.md');
const productShell = read('lib/new-loom/product-shell.ts');
const approvalVerifier = read('scripts/verify-approval-gates-ready.mjs');

assertCheck(
  includesAll(activeReadme, [
    'Current new Loom continuation reading order',
    '2026-06-27-loom-product-definition-user-stories.md',
    '2026-06-27-loom-remake-audit.md',
    '2026-05-15-new-loom-acceptance-status.md',
    '2026-05-09-new-loom-completion-audit.md',
    '2026-05-09-legacy-surface-migration-plan.md',
    'Sources / Studio / Digital Me',
    'historical reference only',
    'Collect / Organize',
    'Real user-file installed-app importer acceptance',
    'Live provider-output Compile/Draft acceptance',
  ]),
  'active README must define the current new Loom reading order and approval-bound gate boundary',
);

assertCheck(
  includesAll(activeStatus, [
    'Primary information architecture is now `Sources`, `Studio`, and `Digital Me`',
    '`Draft` remains a route',
    '`npm run verify:product` as the safe',
    'Real user-file installed-app importer acceptance',
    'Live provider-output Compile/Draft acceptance',
    'Do not mark the new Loom objective complete',
  ]),
  'acceptance status must keep Sources/Studio/Digital Me, safe verify:product, and both open gates explicit',
);

assertCheck(
  includesAll(completionAudit, [
    '## Prompt-To-Artifact Checklist',
    'The user objective is **完整彻底实现新 Loom，而不只是 phase 1**',
    'Full-product acceptance means these surfaces must work together as one installed product loop',
    'Real user-file installed-app importer acceptance',
    'Live provider-output Compile/Draft acceptance',
    'Do not mark the full new Loom goal complete until these gates are closed',
  ]),
  'completion audit must preserve the full-product checklist and open approval-bound gates',
);

assertCheck(
  includesAll(productShell, [
    "label: 'Sources'",
    "label: 'Studio'",
    "label: 'Digital Me'",
    "href: '/sources'",
    "href: '/studio'",
    "href: '/digital-me'",
  ]) &&
    !/label:\s*'Collect'|label:\s*'Organize'|label:\s*'Draft'/.test(productShell),
  'product shell must keep Sources, Studio, and Digital Me as the primary product loop',
);

const numberedArtifacts = [
  ...walkForNumberedArtifacts('app'),
  ...walkForNumberedArtifacts('macos-app/Loom/Sources'),
  ...walkForNumberedArtifacts('scripts'),
  ...walkForNumberedArtifacts('public'),
].filter((artifact) => !artifact.startsWith('public/pagefind/'));
assertCheck(
  numberedArtifacts.length === 0,
  `Finder-numbered duplicate artifacts remain in product paths: ${numberedArtifacts.join(', ')}`,
);

assertCheck(
  scripts['verify:new-loom-audit'] === 'node scripts/verify-new-loom-completion-audit.mjs' &&
    scripts['verify:approval-gates-ready'] === 'node scripts/verify-approval-gates-ready.mjs' &&
    typeof scripts['verify:product'] === 'string',
  'package scripts must expose verify:new-loom-audit, verify:approval-gates-ready, and verify:product',
);

assertCheck(
  includesAll(scripts['verify:product'] ?? '', [
    'verify:new-loom-audit',
    'verify:approval-gates-ready',
    'typecheck',
    'test:contracts',
    'smoke',
    'app:check-project',
    'app:user',
    'app:smoke',
  ]) &&
    !(scripts['verify:product'] ?? '').includes('verify:real-files-importer') &&
    !(scripts['verify:product'] ?? '').includes('LOOM_REAL_FILE_ROOT'),
  'verify:product must run only safe non-approval gates and exclude real user-file import',
);

assertCheck(
  includesAll(approvalVerifier, [
    'approval_required',
    '--json',
    'Real user-file installed-app importer acceptance',
    'Live provider-output Compile/Draft acceptance',
    'Do not send a real provider request',
    'Do not import real files through the installed UI',
  ]),
  'approval gate verifier must provide machine-readable readiness without closing the gates',
);

if (failures.length > 0) {
  console.error('new Loom completion audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('new Loom completion audit ok: 2 approval-bound gates remain open');
