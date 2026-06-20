import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BEGINNER_ABOUT_SOURCE_ID,
  beginnerCitationResolver,
  beginnerCorpusContext,
  buildBeginnerCorpus,
  resolveBeginnerSource,
} from '../lib/new-loom/beginner-ask-corpus';
import {
  parseAskYipingCitations,
  retrieveAskYipingSources,
} from '../lib/new-loom/ask-yiping';
import { normalizeBeginnerProfile } from '../lib/profile/beginner-profile';

// A representative beginner profile covering every section the corpus maps.
const sampleProfile = normalizeBeginnerProfile({
  home: { name: 'Ada Lovelace', headline: 'Software engineer & mathematician' },
  about: {
    summary: 'Builder focused on analytical engines and algorithmic notation.',
    links: [
      { label: 'GitHub', href: 'https://github.com/ada' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/ada' },
    ],
  },
  education: [
    {
      institution: 'University of London',
      qualification: 'BSc Mathematics',
      field: 'Pure mathematics and analysis',
      start: '2018',
      end: '2021',
    },
  ],
  experience: [
    {
      role: 'Quantitative Developer',
      organization: 'Optiver',
      start: 'May 2026',
      end: 'August 2026',
      location: 'Sydney',
      bullets: [
        'Built market-making algorithms and order-book analytics in Python.',
        'Researched pair-trading and VWAP execution strategies.',
      ],
    },
  ],
  works: [
    {
      title: 'Option Pricer',
      description: 'Black-Scholes web calculator built in TypeScript.',
      link: 'https://github.com/ada/option-pricer',
      role: 'Solo developer',
    },
  ],
});

test('buildBeginnerCorpus yields a source for every profile section with stable ids', () => {
  const corpus = buildBeginnerCorpus(sampleProfile);
  const ids = new Set(corpus.map((source) => source.id));

  // About (always first), education, experience, and links each map to a source.
  assert.equal(corpus[0].id, BEGINNER_ABOUT_SOURCE_ID, 'about entry must be first');
  assert.ok(ids.has(BEGINNER_ABOUT_SOURCE_ID), 'about source present');
  assert.ok(ids.has('me-edu-0'), 'education source present with stable id');
  assert.ok(ids.has('me-exp-0'), 'experience source present with stable id');
  assert.ok(ids.has('me-link-0'), 'link source present with stable id');
  assert.ok(ids.has('me-link-1'), 'second link source present with stable id');
  assert.ok(ids.has('me-work-0'), 'work source present with stable id');

  // total = about + 1 edu + 1 exp + 1 work + 2 links
  assert.equal(corpus.length, 6);

  // Every source has the AskYipingSource shape: non-empty id/title/text/href + kind.
  for (const source of corpus) {
    assert.ok(source.id.length > 0, 'id present');
    assert.ok(source.title.length > 0, `${source.id} has a title`);
    assert.ok(source.text.length > 0, `${source.id} has searchable text`);
    assert.ok(source.href.length > 0, `${source.id} has an href`);
    assert.ok(typeof source.kind === 'string' && source.kind.length > 0, `${source.id} has a kind`);
  }

  // The about source's text folds in name + headline + summary.
  const about = corpus.find((s) => s.id === BEGINNER_ABOUT_SOURCE_ID)!;
  assert.match(about.text, /Ada Lovelace/);
  assert.match(about.text, /analytical engines/);

  // The experience source's text folds in role, org, and bullet content.
  const exp = corpus.find((s) => s.id === 'me-exp-0')!;
  assert.match(exp.text, /Optiver/);
  assert.match(exp.text, /market-making/);
});

test('retrieve over the beginner corpus surfaces the relevant section for an on-topic query', () => {
  const context = beginnerCorpusContext(sampleProfile);

  // A question about the person's work returns the experience source.
  const expSources = retrieveAskYipingSources(
    'What market-making and trading work has she done?',
    6,
    context,
  );
  const expIds = new Set(expSources.map((source) => source.id));
  assert.ok(expIds.has('me-exp-0'), 'an experience question must surface the me-exp source');

  // A question about study returns the education source.
  const eduSources = retrieveAskYipingSources(
    'Where did she study mathematics?',
    6,
    context,
  );
  const eduIds = new Set(eduSources.map((source) => source.id));
  assert.ok(eduIds.has('me-edu-0'), 'an education question must surface the me-edu source');

  // The always-on about entry is included regardless of overlap.
  assert.ok(
    expSources.some((source) => source.id === BEGINNER_ABOUT_SOURCE_ID),
    'about/profile entry must always be included',
  );

  // No duplicate ids, limit respected.
  const ids = expSources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate sources');
  assert.ok(expSources.length <= 6, 'limit respected');
});

test('parseAskYipingCitations accepts a real beginner id and rejects a fake one', () => {
  const context = beginnerCorpusContext(sampleProfile);
  const sources = retrieveAskYipingSources('trading experience at Optiver', 6, context);

  // me-exp-0 is a resolvable section; me-about and a fabricated id are not citeable.
  const answerText = [
    'She built market-making algorithms at Optiver.',
    'SOURCES: me-exp-0, me-about, totally-made-up-id',
  ].join('\n');

  const { answer, citations } = parseAskYipingCitations(
    answerText,
    sources,
    context.resolveCitation,
  );

  // SOURCES line stripped, body kept.
  assert.doesNotMatch(answer, /SOURCES:/);
  assert.match(answer, /Optiver/);

  // Only the real, resolvable experience id survives.
  assert.equal(citations.length, 1, 'exactly one resolvable citation');
  assert.equal(citations[0].artifactId, 'me-exp-0');
  assert.ok(
    !citations.some((c) => c.artifactId === 'totally-made-up-id'),
    'fabricated ids dropped',
  );
  assert.ok(
    !citations.some((c) => c.artifactId === BEGINNER_ABOUT_SOURCE_ID),
    'non-citeable about block dropped',
  );
});

test('resolveBeginnerSource returns label+href for real ids and null for fakes', () => {
  // Experience resolves to "Experience · {org}" linking /experience.
  const exp = resolveBeginnerSource('me-exp-0', sampleProfile);
  assert.ok(exp, 'real experience id resolves');
  assert.equal(exp!.label, 'Experience · Optiver');
  assert.equal(exp!.href, '/experience');

  // Education resolves to "Education · {institution}" linking /education.
  const edu = resolveBeginnerSource('me-edu-0', sampleProfile);
  assert.ok(edu, 'real education id resolves');
  assert.equal(edu!.label, 'Education · University of London');
  assert.equal(edu!.href, '/education');

  // Links resolve to their own label + external href.
  const link = resolveBeginnerSource('me-link-0', sampleProfile);
  assert.ok(link, 'real link id resolves');
  assert.equal(link!.label, 'GitHub');
  assert.equal(link!.href, 'https://github.com/ada');

  // The free-text about block is intentionally non-citeable.
  assert.equal(
    resolveBeginnerSource(BEGINNER_ABOUT_SOURCE_ID, sampleProfile),
    null,
    'about block is not a citeable source',
  );

  // Out-of-range and fabricated ids return null.
  assert.equal(resolveBeginnerSource('me-exp-99', sampleProfile), null, 'out-of-range index → null');
  assert.equal(resolveBeginnerSource('me-edu-99', sampleProfile), null, 'out-of-range edu → null');
  assert.equal(resolveBeginnerSource('totally-made-up-id', sampleProfile), null, 'fake id → null');
});

test('beginnerCitationResolver mirrors resolveBeginnerSource as an AskYipingCitation', () => {
  const resolve = beginnerCitationResolver(sampleProfile);

  const exp = resolve('me-exp-0');
  assert.ok(exp, 'experience resolves to a citation');
  assert.deepEqual(exp, {
    artifactId: 'me-exp-0',
    title: 'Experience · Optiver',
    href: '/experience',
  });

  // Non-citeable + fake ids are null, enforcing cite-only-real-ids.
  assert.equal(resolve(BEGINNER_ABOUT_SOURCE_ID), null);
  assert.equal(resolve('totally-made-up-id'), null);
});

test('buildBeginnerCorpus includes works sources with correct id and text', () => {
  const corpus = buildBeginnerCorpus(sampleProfile);
  const work = corpus.find((s) => s.id === 'me-work-0');
  assert.ok(work, 'me-work-0 source present');
  assert.match(work!.text, /Option Pricer/);
  assert.match(work!.text, /Black-Scholes/);
  assert.equal(work!.kind, 'work');
  assert.equal(work!.href, 'https://github.com/ada/option-pricer');
});

test('resolveBeginnerSource resolves me-work-{i} to Works · {title} and correct href', () => {
  const work = resolveBeginnerSource('me-work-0', sampleProfile);
  assert.ok(work, 'real work id resolves');
  assert.equal(work!.label, 'Works · Option Pricer');
  assert.equal(work!.href, 'https://github.com/ada/option-pricer');

  // Out-of-range returns null.
  assert.equal(resolveBeginnerSource('me-work-99', sampleProfile), null);
});

test('retrieve over beginner corpus surfaces a work source for a works query', () => {
  const context = beginnerCorpusContext(sampleProfile);
  const workSources = retrieveAskYipingSources(
    'What projects has she built? Tell me about the option pricer.',
    6,
    context,
  );
  const workIds = new Set(workSources.map((s) => s.id));
  assert.ok(workIds.has('me-work-0'), 'a works query must surface the me-work source');
});

test('beginnerCitationResolver resolves me-work-{i} as an AskYipingCitation', () => {
  const resolve = beginnerCitationResolver(sampleProfile);
  const work = resolve('me-work-0');
  assert.ok(work, 'work resolves to a citation');
  assert.deepEqual(work, {
    artifactId: 'me-work-0',
    title: 'Works · Option Pricer',
    href: 'https://github.com/ada/option-pricer',
  });
});

// ── M2b: uploaded artifacts as grounded, openable citations ──────────────────

// A profile whose proof is an uploaded document carrying real extracted text.
const artifactProfile = normalizeBeginnerProfile({
  home: { name: 'Grace Hopper', headline: 'Computer scientist' },
  about: { summary: 'Pioneer of compiler design.' },
  artifacts: [
    {
      id: 'af_blob_123',
      name: 'transcript.pdf',
      kind: 'pdf',
      label: 'UNSW Transcript',
      extractedText:
        'University of New South Wales academic transcript. COMP2511 Object-Oriented Design High Distinction. MATH2069 Mathematics 2A Distinction.',
    },
  ],
});

test('buildBeginnerCorpus emits a me-artifact-{i} source whose text folds in the extracted document text', () => {
  const corpus = buildBeginnerCorpus(artifactProfile);
  const artifact = corpus.find((s) => s.id === 'me-artifact-0');
  assert.ok(artifact, 'me-artifact-0 source present');
  // Searchable text = name + label + the document's OWN extracted text.
  assert.match(artifact!.text, /transcript\.pdf/);
  assert.match(artifact!.text, /UNSW Transcript/);
  assert.match(artifact!.text, /COMP2511/, 'extracted document text is searchable');
  assert.match(artifact!.text, /High Distinction/);
  // Title prefers the label; kind carries the file kind.
  assert.equal(artifact!.title, 'UNSW Transcript');
  assert.equal(artifact!.kind, 'pdf');
});

test('resolveBeginnerSource(me-artifact-0) returns a citation carrying the real blob artifactId', () => {
  const resolved = resolveBeginnerSource('me-artifact-0', artifactProfile);
  assert.ok(resolved, 'real artifact id resolves');
  // Identity is the REAL IndexedDB blob id, NOT the corpus index id.
  assert.equal(resolved!.artifactId, 'af_blob_123');
  assert.equal(resolved!.label, 'UNSW Transcript');
  assert.equal(resolved!.kind, 'pdf');

  // Out-of-range artifact index → null (cite-only-real-ids).
  assert.equal(resolveBeginnerSource('me-artifact-99', artifactProfile), null);
});

test('beginnerCitationResolver maps me-artifact-{i} to a blob-opening citation (no navigable href)', () => {
  const resolve = beginnerCitationResolver(artifactProfile);
  const cite = resolve('me-artifact-0');
  assert.ok(cite, 'artifact resolves to a citation');
  assert.equal(cite!.artifactId, 'af_blob_123', 'citation carries the real blob id');
  assert.equal(cite!.title, 'UNSW Transcript');
  assert.equal(cite!.kind, 'pdf', 'file kind flows through for the client open path');
  // Artifact citations open the blob by id — there is no navigable href.
  assert.equal(cite!.href, '');
});

test('parseAskYipingCitations accepts a resolvable me-artifact id and drops a fake one', () => {
  const context = beginnerCorpusContext(artifactProfile);
  const sources = retrieveAskYipingSources(
    'What grades are on the transcript COMP2511?',
    6,
    context,
  );

  const answerText = [
    'The transcript shows a High Distinction in COMP2511.',
    'SOURCES: me-artifact-0, me-artifact-77, me-about',
  ].join('\n');

  const { answer, citations } = parseAskYipingCitations(
    answerText,
    sources,
    context.resolveCitation,
  );

  assert.doesNotMatch(answer, /SOURCES:/);
  // Only the real, resolvable artifact survives; its identity is the blob id.
  assert.equal(citations.length, 1, 'exactly one resolvable artifact citation');
  assert.equal(citations[0].artifactId, 'af_blob_123');
  assert.ok(
    !citations.some((c) => c.artifactId === 'me-artifact-77'),
    'fabricated artifact id dropped',
  );
});

test('retrieve over an artifact-grounded corpus surfaces the me-artifact source for an on-topic query', () => {
  const context = beginnerCorpusContext(artifactProfile);
  const sources = retrieveAskYipingSources(
    'Tell me about COMP2511 object-oriented design.',
    6,
    context,
  );
  const ids = new Set(sources.map((s) => s.id));
  assert.ok(ids.has('me-artifact-0'), 'an on-topic question must surface the artifact source');
});
