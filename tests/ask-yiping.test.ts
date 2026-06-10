import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASK_YIPING_CORPUS,
  ASK_YIPING_PROFILE_SOURCE_ID,
  ASK_YIPING_SUGGESTED_QUESTIONS,
  buildAskYipingPrompt,
  parseAskYipingCitations,
  retrieveAskYipingSources,
} from '../lib/new-loom/ask-yiping';
import {
  VERIFIED_DOSSIER_ARTIFACTS,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../lib/new-loom/verified-dossier-home';

const ARTIFACT_IDS = new Set<string>(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));

test('corpus is non-empty and any artifact-claiming id resolves', () => {
  assert.ok(ASK_YIPING_CORPUS.length > 0, 'corpus should not be empty');

  // Every corpus entry whose id is a real artifact id must resolve via the resolver.
  for (const source of ASK_YIPING_CORPUS) {
    assert.ok(source.id.length > 0, 'source id should be present');
    assert.ok(source.title.length > 0, `${source.id} should have a title`);
    assert.ok(source.text.length > 0, `${source.id} should have text`);
    assert.ok(source.href.length > 0, `${source.id} should have an href`);

    if (ARTIFACT_IDS.has(source.id)) {
      const artifact = resolveVerifiedDossierArtifact(source.id as VerifiedDossierArtifactId);
      assert.ok(artifact, `${source.id} claims to be an artifact and must resolve`);
      assert.equal(artifact.href, source.href, `${source.id} href should match the artifact`);
    }
  }

  // Every verified dossier artifact is represented in the corpus.
  for (const artifact of VERIFIED_DOSSIER_ARTIFACTS) {
    assert.ok(
      ASK_YIPING_CORPUS.some((source) => source.id === artifact.id),
      `${artifact.id} should appear in the corpus`,
    );
  }

  // The always-on profile/role entry exists.
  assert.ok(
    ASK_YIPING_CORPUS.some((source) => source.id === ASK_YIPING_PROFILE_SOURCE_ID),
    'corpus should include the profile/role entry',
  );
});

test('retrieve returns <= limit and always includes the profile entry', () => {
  const sources = retrieveAskYipingSources('concavity optimisation in economics', 4);
  assert.ok(sources.length <= 4, 'retrieve must respect the limit');
  assert.ok(
    sources.some((source) => source.id === ASK_YIPING_PROFILE_SOURCE_ID),
    'profile/role entry must always be included',
  );

  // Even with no overlap the profile entry is present and limit is respected.
  const fallback = retrieveAskYipingSources('zzzz qqqq no overlap whatsoever', 3);
  assert.ok(fallback.length <= 3);
  assert.ok(fallback.some((source) => source.id === ASK_YIPING_PROFILE_SOURCE_ID));

  // No duplicate ids in the result.
  const ids = sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length, 'retrieve should not duplicate sources');
});

test('a concavity optimisation question surfaces the econ/optimisation material', () => {
  const sources = retrieveAskYipingSources('How does concavity connect to optimisation?', 6);
  const ids = new Set(sources.map((source) => source.id));
  // The dossier's concavity + optimisation node is the strongest hit.
  assert.ok(
    ids.has('claim:optimisation-thinking'),
    'top sources should include the concavity/optimisation material',
  );

  // Asking explicitly about the ECON3202 concave-functions lecture surfaces that PDF.
  const econSources = retrieveAskYipingSources(
    'ECON3202 concave functions lecture week 8',
    6,
  );
  const econIds = new Set(econSources.map((source) => source.id));
  assert.ok(econIds.has('econ-slides'), 'the concave-functions lecture should be retrieved');
});

test('a bare concavity/optimisation question retrieves >=1 resolvable artifact so /api/ask cites', () => {
  // Regression: a bare question like this used to surface only the profile entry
  // plus a claim node (claim:optimisation-thinking), neither of which resolves to
  // a real artifact — so /api/ask returned EMPTY citations. Retrieval must now
  // include at least one resolvable ARTIFACT id for on-topic questions.
  const sources = retrieveAskYipingSources('How does concavity connect to optimisation?', 6);
  const resolvableArtifacts = sources.filter((source) => ARTIFACT_IDS.has(source.id));

  assert.ok(
    resolvableArtifacts.length >= 1,
    'on-topic retrieval must include at least one resolvable artifact so citations are non-empty',
  );
  for (const source of resolvableArtifacts) {
    const artifact = resolveVerifiedDossierArtifact(source.id as VerifiedDossierArtifactId);
    assert.ok(artifact, `${source.id} must resolve to a real dossier artifact`);
  }

  // The concave-functions lecture is the natural artifact for this topic and
  // should be among the resolvable hits.
  const ids = new Set(sources.map((source) => source.id));
  assert.ok(
    ids.has('econ-slides'),
    'the concave-functions lecture artifact should surface for a concavity/optimisation question',
  );
});

test('buildAskYipingPrompt enforces refusal + the SOURCES directive', () => {
  const sources = retrieveAskYipingSources('programming foundations', 4);
  const { system, user } = buildAskYipingPrompt('What can Yiping program?', sources);

  assert.match(system, /I don't have verified evidence for that yet/);
  assert.match(system, /Never invent facts/);
  assert.match(system, /SOURCES:/);
  assert.match(system, /strictly from/i);

  // The user block carries the question and numbered context with ids.
  assert.match(user, /What can Yiping program\?/);
  assert.match(user, /CONTEXT/);
  for (const source of sources) {
    assert.ok(user.includes(`id: ${source.id}`), `${source.id} should appear in the context`);
  }
});

test('parseAskYipingCitations strips SOURCES and drops non-resolvable ids', () => {
  const sources = retrieveAskYipingSources('python and c++ foundations', 6);
  // Ensure we have at least one resolvable artifact id to cite.
  const resolvable = sources.find((source) => ARTIFACT_IDS.has(source.id));
  assert.ok(resolvable, 'expected at least one resolvable artifact source');

  // Find a non-artifact corpus id (claim/course/experience/profile) to feed as a citation.
  const nonArtifact = sources.find((source) => !ARTIFACT_IDS.has(source.id));
  assert.ok(nonArtifact, 'expected a non-artifact source to test dropping');

  const answerText = [
    'Yiping is building Python and C++ implementation foundations.',
    `SOURCES: ${resolvable!.id}, ${nonArtifact!.id}, totally-made-up-id`,
  ].join('\n');

  const { answer, citations } = parseAskYipingCitations(answerText, sources);

  // The SOURCES line is stripped from the answer.
  assert.doesNotMatch(answer, /SOURCES:/);
  assert.match(answer, /Python and C\+\+/);

  // Only the resolvable artifact id survives; fabricated + non-artifact ids dropped.
  assert.ok(citations.length >= 1, 'at least the resolvable citation should remain');
  assert.ok(
    citations.every((citation) => ARTIFACT_IDS.has(citation.artifactId)),
    'every returned citation must resolve to a real artifact',
  );
  assert.ok(
    !citations.some((citation) => citation.artifactId === 'totally-made-up-id'),
    'fabricated ids must be dropped',
  );
  assert.ok(
    !citations.some((citation) => citation.artifactId === nonArtifact!.id),
    'non-artifact corpus ids must be dropped',
  );

  // Citations carry the resolved artifact title + href.
  for (const citation of citations) {
    const artifact = resolveVerifiedDossierArtifact(citation.artifactId as VerifiedDossierArtifactId);
    assert.equal(citation.title, artifact.label);
    assert.equal(citation.href, artifact.href);
  }
});

test('parseAskYipingCitations dedupes repeated ids and handles "none"', () => {
  const sources = retrieveAskYipingSources('optibook trading', 6);
  const resolvable = sources.find((source) => ARTIFACT_IDS.has(source.id));
  assert.ok(resolvable, 'expected a resolvable artifact source');

  const dupAnswer = `Answer body.\nSOURCES: ${resolvable!.id}, ${resolvable!.id}`;
  const { citations } = parseAskYipingCitations(dupAnswer, sources);
  assert.equal(citations.length, 1, 'duplicate citation ids should collapse to one');

  const noneAnswer = 'I don\'t have verified evidence for that yet.\nSOURCES: none';
  const noneResult = parseAskYipingCitations(noneAnswer, sources);
  assert.equal(noneResult.citations.length, 0);
  assert.doesNotMatch(noneResult.answer, /SOURCES:/);
});

test('suggested questions are grounded starters', () => {
  assert.ok(ASK_YIPING_SUGGESTED_QUESTIONS.length >= 3);
  assert.ok(ASK_YIPING_SUGGESTED_QUESTIONS.length <= 4);
  for (const question of ASK_YIPING_SUGGESTED_QUESTIONS) {
    assert.ok(question.length > 15, 'each starter should be a real question');
  }
  const joined = ASK_YIPING_SUGGESTED_QUESTIONS.join(' ');
  assert.match(joined, /optimisation|concavity|Optibook|C\+\+|Python/);
});
