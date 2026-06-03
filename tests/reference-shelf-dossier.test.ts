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
