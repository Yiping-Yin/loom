import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactMetaHintFor } from '../lib/artifact/use-artifact-sync';

test('artifactMetaHintFor reads name/kind/excerpt from a profile ArtifactRef', () => {
  const profile = {
    artifacts: [{ id: 'a', name: 'CV.pdf', kind: 'pdf', extractedText: 'x' }],
  } as never;
  assert.deepEqual(artifactMetaHintFor(profile, 'a'), {
    name: 'CV.pdf', kind: 'pdf', thumbnailDataUri: undefined, extractedText: 'x',
  });
});

test('artifactMetaHintFor coerces an unknown kind to "other"', () => {
  const profile = { artifacts: [{ id: 'a', name: 'X', kind: 'weird' }] } as never;
  assert.equal(artifactMetaHintFor(profile, 'a').kind, 'other');
});

test('artifactMetaHintFor falls back to a minimal hint when the ref is absent', () => {
  assert.deepEqual(artifactMetaHintFor({ artifacts: [] } as never, 'ghost'), { name: 'ghost', kind: 'other' });
  assert.deepEqual(artifactMetaHintFor(null, 'ghost'), { name: 'ghost', kind: 'other' });
});
