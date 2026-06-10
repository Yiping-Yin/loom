#!/usr/bin/env node
//
// verify-real-file-importer.mjs — opt-in real-file importer verifier (C7).
//
// Runs the REAL native ingest extractors against the user's REAL files —
// never synthetic fixtures — so we have evidence the installed-app importer
// actually parses the corpus the user cares about (lecture decks, Keynote /
// Pages packages, scanned PDFs, screenshots).
//
// Opt-in by design: this script does nothing unless `LOOM_REAL_FILE_ROOT`
// points at a directory of real files. The corpus path is NEVER hard-coded
// here — the user provides it, e.g.
//
//   LOOM_REAL_FILE_ROOT="/path/to/your/files" npm run verify:real-files-importer
//
// Example real inputs the corpus is expected to contain (decks/iWork/pdfs):
//   - "FINS3616 Week 2_Updated.pptx"   (a representative lecture deck)
//   - "*.key" / "*.pages"               (Keynote / Pages packages)
//   - scanned "*.pdf" and screenshot "*.png" files
//
// Implementation: scan the root, summarize coverage, then compile the
// `verify-real-file-importer.swift` harness with `swiftc` against the same
// extractor sources the app ships (`PDFExtraction.swift`, `CleanText.swift`,
// `PageRange.swift`) and feed it a JSON manifest on stdin.

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SUPPORTED_PDF = new Set(['.pdf']);
const SUPPORTED_IMAGE = new Set(['.png', '.jpg', '.jpeg', '.heic', '.gif', '.tiff', '.webp']);
const DECK_PACKAGES = new Set(['.pptx', '.ppt']);
const IWORK_PACKAGES = new Set(['.key', '.pages']);

/** Recursively list every file under `root`. */
async function listFiles(root) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

/** Classify scanned files into the importer's supported buckets. */
function summarizeSupportedFiles(scanned) {
  return {
    totalSupported:
      scanned.pdfs.length +
      scanned.images.length +
      scanned.deckPackages.length +
      scanned.iWorkPackages.length,
    deckPackages: scanned.deckPackages.length,
    iWorkPackages: scanned.iWorkPackages.length,
    pdfs: scanned.pdfs.length,
    images: scanned.images.length,
  };
}

function classify(files) {
  const scanned = { pdfs: [], images: [], deckPackages: [], iWorkPackages: [] };
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (SUPPORTED_PDF.has(ext)) scanned.pdfs.push(file);
    else if (SUPPORTED_IMAGE.has(ext)) scanned.images.push(file);
    else if (DECK_PACKAGES.has(ext)) scanned.deckPackages.push(file);
    else if (IWORK_PACKAGES.has(ext)) scanned.iWorkPackages.push(file);
  }
  return scanned;
}

/** Fail with a clear message when a coverage floor is not met. */
function requireAtLeast(actual, min, label) {
  if (actual < min) {
    throw new Error(
      `Real-file importer coverage too low: ${label} found ${actual}, need at least ${min}. ` +
        `Point LOOM_REAL_FILE_ROOT at a corpus with more ${label}.`,
    );
  }
}

/** Resolve the corpus root from `--root PATH` or `LOOM_REAL_FILE_ROOT`. */
function resolveRoot(argv) {
  const flagIndex = argv.indexOf('--root');
  if (flagIndex >= 0 && argv[flagIndex + 1]) {
    return argv[flagIndex + 1];
  }
  return process.env.LOOM_REAL_FILE_ROOT;
}

async function main() {
  const root = resolveRoot(process.argv.slice(2));
  if (!root) {
    console.error(
      'Real-file importer root is required. Set LOOM_REAL_FILE_ROOT (or pass --root PATH) ' +
        'to a directory of real files, e.g.\n' +
        '  LOOM_REAL_FILE_ROOT="/path/to/your/files" npm run verify:real-files-importer',
    );
    process.exit(78); // EX_CONFIG — opt-in, not a failure.
  }

  const files = await listFiles(root);
  const scanned = classify(files);
  const coverage = summarizeSupportedFiles(scanned);

  console.log(`Scanned ${files.length} files under ${root}`);
  console.log(
    `Coverage: ${coverage.totalSupported} supported ` +
      `(${coverage.pdfs} pdf, ${coverage.images} image, ` +
      `${coverage.deckPackages} deck, ${coverage.iWorkPackages} iWork)`,
  );

  // The corpus must carry enough decks and iWork packages for the harness
  // to exercise both code paths over real data.
  requireAtLeast(scanned.deckPackages, 5, 'deck packages (.pptx/.ppt)');
  requireAtLeast(scanned.iWorkPackages, 5, 'iWork packages (.key/.pages)');

  const manifest = {
    root,
    pdfs: scanned.pdfs,
    images: scanned.images,
    deckPackages: scanned.deckPackages,
    iWorkPackages: scanned.iWorkPackages,
    coverage: summarizeSupportedFiles(scanned),
  };

  // Compile the harness against the real extractor sources the app ships.
  const harness = path.join(repoRoot, 'scripts', 'verify-real-file-importer.swift');
  const extractorDir = path.join(repoRoot, 'macos-app', 'Loom', 'Sources', 'Ingest');
  const extractorSources = [
    path.join(extractorDir, 'PDFExtraction.swift'),
    path.join(extractorDir, 'CleanText.swift'),
    path.join(extractorDir, 'PageRange.swift'),
  ];
  for (const src of extractorSources) {
    if (!(await exists(src))) {
      throw new Error(`Missing extractor source for swiftc: ${src}`);
    }
  }

  const binary = path.join(repoRoot, '.next-build-current', 'verify-real-file-importer');
  await fs.mkdir(path.dirname(binary), { recursive: true });

  const compile = spawnSync(
    'swiftc',
    ['-O', '-o', binary, harness, ...extractorSources],
    { encoding: 'utf8' },
  );
  if (compile.status !== 0) {
    console.error(compile.stderr || compile.stdout || 'swiftc failed');
    throw new Error('swiftc failed to build the real-file importer harness');
  }

  const run = spawnSync(binary, [], {
    input: JSON.stringify(manifest),
    encoding: 'utf8',
  });
  process.stdout.write(run.stdout || '');
  if (run.status !== 0) {
    console.error(run.stderr || '');
    throw new Error('real-file importer harness reported failures');
  }

  if (!String(run.stdout || '').includes('real-file importer evidence ok')) {
    throw new Error('harness did not emit the evidence-ok marker');
  }
  console.log('verify:real-files-importer passed');
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
