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
  referenceArtifactsByCategory,
  referenceDocsByCategory,
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
      assert.match(artifact.label, /\.(pdf|xlsx|md)$/i);
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
  assert.match(binding, /referenceWikiRoot/);
  assert.match(binding, /Python Foundations\.pdf/);
  assert.match(binding, /Claude Certificate\.html/);
  assert.match(binding, /WQU index\.html/);

  assert.match(page, /referenceDocsByCategory/);
  assert.match(page, /referenceArtifactsByCategory/);
  assert.match(client, /referenceArtifacts/);
});

test('reference artifact bindings expose available local source documents', () => {
  const quantnetDocs = referenceDocsByCategory('quantnet');
  const wquDocs = referenceDocsByCategory('wqu');
  const claudeDocs = referenceDocsByCategory('claude');

  assert.ok(quantnetDocs.length >= 2, 'Quantnet should expose multiple real source files');
  assert.ok(wquDocs.some((doc) => doc.title === 'WQU index.html'));
  assert.ok(claudeDocs.some((doc) => doc.title === 'Claude Certificate.html'));

  assert.ok(findReferenceDoc('quantnet', 'python-foundations'));
  assert.ok(referenceArtifactsByCategory('quantnet').some((artifact) => artifact.href === '/knowledge/quantnet/python-foundations'));
  assert.ok(referenceArtifactsByCategory('claude').some((artifact) => artifact.label === 'Claude Certificate.html'));
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
