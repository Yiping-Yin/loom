#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const jsonMode = process.argv.includes('--json');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

const checks = [];
const problems = [];

function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) problems.push(`${name}: ${detail}`);
}

function includesAll(source, patterns) {
  return patterns.every((pattern) => (
    pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern)
  ));
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts ?? {};
const realImporter = fileExists('scripts/verify-real-file-importer.mjs')
  ? read('scripts/verify-real-file-importer.mjs')
  : '';
const activeStatus = fileExists('docs/projects/active/2026-05-15-new-loom-acceptance-status.md')
  ? read('docs/projects/active/2026-05-15-new-loom-acceptance-status.md')
  : '';
const activeReadme = fileExists('docs/projects/active/README.md')
  ? read('docs/projects/active/README.md')
  : '';
const draftClient = fileExists('app/draft/DraftClient.tsx') ? read('app/draft/DraftClient.tsx') : '';
const draftStorage = fileExists('lib/new-loom/draft-storage.ts') ? read('lib/new-loom/draft-storage.ts') : '';
const nativeDraft = fileExists('macos-app/Loom/Sources/LoomDraftView.swift')
  ? read('macos-app/Loom/Sources/LoomDraftView.swift')
  : '';
const nativeCompile = fileExists('macos-app/Loom/Sources/SourceFileView.swift')
  ? read('macos-app/Loom/Sources/SourceFileView.swift')
  : '';
const nativeSources = fileExists('macos-app/Loom/Sources/LoomLibraryView.swift')
  ? read('macos-app/Loom/Sources/LoomLibraryView.swift')
  : '';
const installedSmoke = fileExists('scripts/installed-app-smoke.mjs')
  ? read('scripts/installed-app-smoke.mjs')
  : '';

check(
  'real user-file importer verifier is opt-in',
  scripts['verify:real-files-importer'] === 'node scripts/verify-real-file-importer.mjs' &&
    includesAll(realImporter, [
      'LOOM_REAL_FILE_ROOT',
      'Real-file importer root is required',
      'process.exit(78)',
      'swiftc',
    ]) &&
    !realImporter.includes('Knowledge System/UNSW'),
  'verify:real-files-importer must require LOOM_REAL_FILE_ROOT/--root and must not hard-code a user corpus',
);

check(
  'installed app smoke can identify the user app bundle',
  scripts['app:smoke'] === 'node scripts/installed-app-smoke.mjs' &&
    includesAll(installedSmoke, ['com.yinyiping.loom', 'Resources', 'index.html']),
  'app:smoke must inspect the installed Loom.app bundle without using real user files',
);

check(
  'native Sources exposes installed-app file intake path',
  includesAll(nativeSources, [
    'private func pickFilesForIngestion()',
    'NSOpenPanel()',
    'panel.allowedContentTypes = nativeFileImporterContentTypes()',
    'NotificationCenter.default.post(name: .loomIngestFileDropped',
  ]),
  'Sources must still expose the UI import path that will be used only after explicit approval',
);

check(
  'web Draft prompt builders bound provider-visible context',
  includesAll(draftStorage, [
    'buildBoundedDraftAIPrompt',
    'buildBoundedDraftInlineEditPrompt',
    'DEFAULT_DRAFT_AI_PROMPT_LIMITS',
    '[truncated for provider context]',
  ]) &&
    includesAll(draftClient, [
      'buildBoundedDraftAIPrompt',
      'buildBoundedDraftInlineEditPrompt',
    ]),
  'web Draft must route Continue writing and inline edit through bounded prompt builders',
);

check(
  'native Draft provider path is present but not auto-invoked',
  includesAll(nativeDraft, [
    'enum LoomDraftAIPrompt',
    'enum LoomDraftInlineEdit',
    'LoomAI.sendStream',
    'buildDraftAIPrompt',
  ]),
  'native Draft must keep the provider path reviewable before a live provider call is approved',
);

check(
  'native Compile provider path is present but not auto-invoked',
  includesAll(nativeCompile, [
    'Button("Compile")',
    'enum LoomCompilePipeline',
    'LoomCompilePipeline.buildPrompt',
    'LoomAI.sendStream',
  ]),
  'native Compile must keep the provider path reviewable before a live provider call is approved',
);

check(
  'active docs keep the two approval-bound gates explicit',
  includesAll(activeStatus, [
    'Real user-file installed-app importer acceptance',
    'Live provider-output Compile/Draft acceptance',
    'Do not mark the new Loom objective complete',
  ]) &&
    includesAll(activeReadme, [
      'Real user-file installed-app importer acceptance',
      'Live provider-output Compile/Draft acceptance',
    ]),
  'active docs must name both open gates and keep the completion rule visible',
);

const approvalBoundGates = [
  {
    id: 'real_user_file_installed_app_importer_acceptance',
    name: 'Real user-file installed-app importer acceptance',
    status: 'approval_required',
    ready: checks
      .filter((item) => [
        'real user-file importer verifier is opt-in',
        'installed app smoke can identify the user app bundle',
        'native Sources exposes installed-app file intake path',
        'active docs keep the two approval-bound gates explicit',
      ].includes(item.name))
      .every((item) => item.ok),
    allowedBeforeApproval: [
      'npm run app:user',
      'npm run app:smoke',
      'npm run verify:approval-gates-ready',
    ],
    requiredApproval: [
      'User-approved local file path or sample set',
      'Permission to use installed Loom.app UI import',
    ],
    requiredEvidenceAfterApproval: [
      'Installed app path and bundle id',
      'Computer Use or equivalent non-screenshot UI evidence for Add files',
      'Imported source row with local-origin metadata',
      'Original file untouched proof',
      'Draft attach proof for the imported source',
    ],
    forbiddenBeforeApproval: [
      'Do not scan arbitrary real user folders',
      'Do not import real files through the installed UI',
      'Do not replace Computer Use evidence with desktop screenshots unless explicitly approved',
    ],
  },
  {
    id: 'live_provider_output_compile_draft_acceptance',
    name: 'Live provider-output Compile/Draft acceptance',
    status: 'approval_required',
    ready: checks
      .filter((item) => [
        'web Draft prompt builders bound provider-visible context',
        'native Draft provider path is present but not auto-invoked',
        'native Compile provider path is present but not auto-invoked',
        'active docs keep the two approval-bound gates explicit',
      ].includes(item.name))
      .every((item) => item.ok),
    allowedBeforeApproval: [
      'npm run verify:approval-gates-ready',
      'npm run test:contracts',
      'npm run typecheck',
    ],
    requiredApproval: [
      'Provider/model selection or confirmation of the configured provider',
      'Permission for exactly one real provider call',
    ],
    requiredEvidenceAfterApproval: [
      'Provider-visible context summary before send',
      'Single approved provider call result',
      'Rendered Draft or Compile artifact',
      'Source provenance preserved through writeback',
    ],
    forbiddenBeforeApproval: [
      'Do not send a real provider request',
      'Do not treat stub/provider-shape tests as live provider acceptance',
      'Do not persist provider output without source provenance evidence',
    ],
  },
];

const ready = problems.length === 0 && approvalBoundGates.every((gate) => gate.ready);
const payload = {
  status: ready ? 'approval_required' : 'blocked',
  ready,
  checked: checks,
  approvalBoundGates,
  forbiddenWithoutApproval: [
    'real installed-app import of user files',
    'real provider call from Draft or Compile',
    'desktop screenshot substitution for Computer Use evidence without explicit approval',
  ],
  problems,
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else if (ready) {
  console.log('approval-bound gates ready: 2 gates require explicit approval');
  for (const gate of approvalBoundGates) {
    console.log(`- ${gate.name}: ${gate.status}`);
  }
  console.log('This is readiness evidence only; it does not close either gate.');
} else {
  console.error('approval-bound gate readiness failed');
  for (const problem of problems) console.error(`- ${problem}`);
}

process.exit(ready ? 0 : 1);
