import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  REFERENCE_SHELF_DOSSIERS,
  referenceShelfDossierFor,
} from '../lib/new-loom/reference-shelf-dossiers';
import {
  findReferenceDoc,
  findReferenceManifestDoc,
  referenceArtifactsByCategory,
  referenceDocsByCategory,
  readReferenceSourceManifest,
  referenceSourceAbsolutePath,
  referenceWikiRoot,
} from '../lib/new-loom/reference-artifact-bindings';
import {
  VERIFIED_DOSSIER_SECTIONS,
  resolveVerifiedDossierArtifact,
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('reference shelf dossiers cover Quantnet, WQU, and Claude with real artifacts', () => {
  for (const shelfId of ['quantnet', 'wqu', 'claude'] as const) {
    const verifiedSection = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === shelfId);
    const dossier = referenceShelfDossierFor(verifiedSection);

    assert.ok(verifiedSection, `${shelfId} should exist in verified dossier sections`);
    assert.ok(dossier, `${shelfId} should resolve to a reference shelf dossier`);
    assert.ok(dossier.headline.length > 20, `${shelfId} needs a real headline`);
    assert.ok(dossier.lead.length > 80, `${shelfId} needs a specific lead`);
    assert.ok(dossier.flow.length >= 3, `${shelfId} needs a source-to-output flow`);
    assert.ok(dossier.citedArtifacts.length >= 1, `${shelfId} needs cited artifacts`);

    for (const artifactId of verifiedSection.artifactIds) {
      const artifact = resolveVerifiedDossierArtifact(artifactId);
      assert.equal(artifact.shelf, shelfId);
      assert.match(artifact.label, /\.(pdf|html)$/i);
      assert.ok(['pdf', 'html'].includes(artifact.kind));
    }
  }
});

test('category landing uses professional dossier shell before the source file index', () => {
  const client = read('app/knowledge/[category]/CategoryLandingClient.tsx');
  const styles = read('app/knowledge/[category]/CategoryDossier.module.css');
  const dossierData = read('lib/new-loom/reference-shelf-dossiers.ts');

  assert.match(client, /referenceShelfDossierFor/);
  assert.match(client, /Ask this shelf/);
  assert.match(client, /A real shelf needs real artifacts/);
  assert.match(client, /The shelf is a workflow, not a folder dump/);
  assert.match(client, /Source file index/);
  assert.match(client, /<DocumentPreviewCard/);
  assert.match(client, /<FileBadge/);
  assert.match(client, /<ArtifactCitationCard/);
  assert.match(client, /<InstitutionMark/);

  for (const label of ['quantnet', 'wqu', 'claude']) {
    assert.match(dossierData, new RegExp(`${label}:`));
  }

  assert.match(styles, /\.hero/);
  assert.match(styles, /\.evidenceGrid/);
  assert.match(styles, /\.sourceIndexShell/);
  assert.doesNotMatch(client, /Yiping's Loom/);
  assert.doesNotMatch(client, /personal knowledge display platform/i);
});

test('reference shelf pages bind dossier artifacts to real whitelisted source files', () => {
  const bindingPath = path.join(repoRoot, 'lib/new-loom/reference-artifact-bindings.ts');
  assert.ok(fs.existsSync(bindingPath), 'reference artifact binding module should exist');

  const binding = read('lib/new-loom/reference-artifact-bindings.ts');
  const page = read('app/knowledge/[category]/page.tsx');
  const client = read('app/knowledge/[category]/CategoryLandingClient.tsx');

  assert.match(binding, /referenceDocsByCategory/);
  assert.match(binding, /referenceArtifactsByCategory/);
  assert.match(binding, /findReferenceDoc/);
  assert.match(binding, /findReferenceManifestDoc/);
  assert.match(binding, /referenceWikiRoot/);

  const manifest = read('lib/new-loom/reference-source-manifest.json');
  assert.match(manifest, /Python Foundations\.pdf/);
  assert.match(manifest, /Claude Certificate\.html/);
  assert.match(manifest, /WQU index\.html/);

  assert.match(page, /referenceDocsByCategory/);
  assert.match(page, /referenceArtifactsByCategory/);
  assert.match(client, /referenceArtifacts/);

  const detailPage = read('app/knowledge/[category]/[fileSlug]/page.tsx');
  assert.match(detailPage, /findReferenceManifestDoc/);
  assert.match(detailPage, /findReferenceDoc\(category, fileSlug\)\s*\?\?/);
});

test('reference artifact bindings expose manifest targets and tolerate absent external files', () => {
  const manifest = readReferenceSourceManifest();

  assert.ok(manifest.sources.length >= 5, 'reference source manifest should keep concrete source targets');
  assert.ok(manifest.sources.some((source) => source.id === 'ref-quantnet-python-foundations'));
  assert.ok(manifest.sources.some((source) => source.title === 'WQU index.html'));
  assert.ok(manifest.sources.some((source) => source.title === 'Claude Certificate.html'));
  assert.ok(manifest.sources.every((source) => source.sourcePath && source.previewLines.length >= 3));

  const previousRoot = process.env.LOOM_REFERENCE_WIKI_ROOT;
  process.env.LOOM_REFERENCE_WIKI_ROOT = path.join(repoRoot, '.missing-reference-root');

  try {
    assert.deepEqual(referenceDocsByCategory('quantnet'), []);
    assert.deepEqual(referenceDocsByCategory('wqu'), []);
    assert.deepEqual(referenceDocsByCategory('claude'), []);
    assert.equal(findReferenceDoc('quantnet', 'python-foundations'), null);
    assert.deepEqual(referenceArtifactsByCategory('quantnet'), []);
    assert.equal(referenceSourceAbsolutePath('ref-quantnet-python-foundations'), null);

    const manifestDoc = findReferenceManifestDoc('quantnet', 'python-foundations');
    assert.equal(manifestDoc?.title, 'Python Foundations.pdf');
    assert.equal(
      manifestDoc?.sourcePath,
      'Quant/Python for Quant/Python Foundations/Section 1 Orientation/Python Foundations.pdf',
    );
    assert.equal(manifestDoc?.ext, '.pdf');
    assert.equal(manifestDoc?.size, 0);
    assert.equal(manifestDoc?.hasText, false);
    assert.equal(manifestDoc?.categorySlug, 'quantnet');
    assert.match(manifestDoc?.preview ?? '', /Python foundations for quant work/);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.LOOM_REFERENCE_WIKI_ROOT;
    } else {
      process.env.LOOM_REFERENCE_WIKI_ROOT = previousRoot;
    }
  }
});

test('reference source importer resolves the Private Wiki root instead of hard-coding one machine path', () => {
  const binding = read('lib/new-loom/reference-artifact-bindings.ts');

  assert.match(binding, /referenceWikiRoot/);
  assert.match(binding, /LOOM_REFERENCE_WIKI_ROOT/);
  assert.doesNotMatch(binding, /const PRIVATE_WIKI_ROOT = ['"]\/Users\/yinyiping\/Desktop\/Private Wiki['"]/);

  assert.equal(
    referenceWikiRoot({ cwd: '/example/Private Wiki/LOOM', env: {} }),
    '/example/Private Wiki',
  );
  assert.equal(
    referenceWikiRoot({
      cwd: '/example/Private Wiki/LOOM',
      env: { LOOM_REFERENCE_WIKI_ROOT: '/external/source-root' },
    }),
    '/external/source-root',
  );
});

test('reference source importer reads shelf rules from a manifest instead of TypeScript literals', () => {
  const manifestPath = path.join(repoRoot, 'lib/new-loom/reference-source-manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'reference source manifest should exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    sources: Array<{ id: string; categorySlug: string; sourcePath: string }>;
  };
  assert.ok(manifest.sources.some((source) => source.id === 'ref-quantnet-python-foundations'));
  assert.ok(manifest.sources.some((source) => source.categorySlug === 'wqu'));
  assert.ok(manifest.sources.some((source) => source.categorySlug === 'claude'));

  const binding = read('lib/new-loom/reference-artifact-bindings.ts');
  assert.match(binding, /referenceSourceManifestPath/);
  assert.match(binding, /readReferenceSourceManifest/);
  assert.doesNotMatch(binding, /const REFERENCE_SOURCES: readonly ReferenceArtifactSource\[\] = \[/);
  assert.doesNotMatch(binding, /Quant\/Python for Quant\/Python Foundations/);
});
