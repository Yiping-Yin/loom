import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveCapabilitiesHeuristic,
  normalizeCapabilities,
  type CapabilityEvidence,
} from '../lib/capability/capability-graph';
import { emptyBeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── Task 1: grounded EXCERPT on each evidence item ────────────────────────────
// The vision is "Digital Me = inspectable elevation": a viewer should SEE the
// proof behind a capability, not just that it's backed. Each evidence item drawn
// from a text source (artifact/draft extractedText, experience bullet, work
// description, education line) carries a short, grounded excerpt — the window
// around the matched keyword, control-stripped + collapsed + bounded. A
// label-only source (no meaningful text) carries no excerpt.

const EXCERPT_MAX = 160; // generous upper bound for the ellipsized window

function findArtifactEvidence(
  caps: ReturnType<typeof deriveCapabilitiesHeuristic>,
  refId: string,
): CapabilityEvidence | undefined {
  return caps
    .flatMap((c) => c.evidence)
    .find((e) => e.kind === 'artifact' && e.refId === refId);
}

test('excerpt: a keyword-matched artifact yields evidence whose excerpt contains the matched context', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'Interested in data analysis', links: [] },
    artifacts: [
      {
        id: 'art-1',
        name: 'report.pdf',
        kind: 'pdf',
        label: 'Quarterly report',
        extractedText:
          'This document opens with context. The team ran a thorough data analysis on the quarterly numbers and built dashboards. It closes with the appendix.',
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const ev = findArtifactEvidence(caps, 'art-1');
  assert.ok(ev, 'expected the artifact to back a capability');
  assert.ok(ev!.excerpt, 'evidence should carry an excerpt');
  assert.match(
    ev!.excerpt!.toLowerCase(),
    /data analysis/,
    'the excerpt should be the window around the matched keyword',
  );
});

test('excerpt: a keyword-matched draft-derived artifact yields a grounded excerpt', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'Interested in data analysis', links: [] },
    artifacts: [
      {
        id: 'draft-included-1',
        name: 'Analytics retro',
        kind: 'doc',
        label: 'Analytics retro',
        extractedText:
          'A retrospective on the analytics dashboard I built and the data analysis behind it, plus next steps.',
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const ev = findArtifactEvidence(caps, 'draft-included-1');
  assert.ok(ev, 'expected the draft-derived artifact to back a capability');
  assert.ok(ev!.excerpt, 'draft-derived evidence should carry an excerpt');
  assert.match(ev!.excerpt!.toLowerCase(), /data analysis/);
});

test('excerpt: is bounded (~<=160 chars) and ellipsized when the surrounding text is long', () => {
  const longTail = 'extra context '.repeat(40); // far exceeds the window
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'Interested in data analysis', links: [] },
    artifacts: [
      {
        id: 'art-long',
        name: 'long.pdf',
        kind: 'pdf',
        label: 'Long doc',
        extractedText: `${longTail}we performed deep data analysis here ${longTail}`,
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const ev = findArtifactEvidence(caps, 'art-long');
  assert.ok(ev?.excerpt, 'expected an excerpt');
  assert.ok(
    ev!.excerpt!.length <= EXCERPT_MAX,
    `excerpt must be bounded, got ${ev!.excerpt!.length}`,
  );
  assert.match(ev!.excerpt!, /…/, 'a clipped excerpt should be ellipsized');
});

test('excerpt: control chars are stripped and whitespace collapsed', () => {
  // The keyword phrase ("data analysis") stays a single-spaced run so it matches;
  // the surrounding text carries control bytes + whitespace runs that the excerpt
  // builder must strip/collapse.
  const noisy = 'noisy  lead   text then the data analysis\t\t happened\n\n after the run';
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'Interested in data analysis', links: [] },
    artifacts: [
      {
        id: 'art-ctrl',
        name: 'ctrl.pdf',
        kind: 'pdf',
        label: 'Ctrl doc',
        extractedText: noisy,
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const ev = findArtifactEvidence(caps, 'art-ctrl');
  assert.ok(ev?.excerpt, 'expected an excerpt');
  // No ASCII control chars (allow ordinary space + the ellipsis).
  // eslint-disable-next-line no-control-regex
  assert.doesNotMatch(ev!.excerpt!, /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, 'control chars stripped');
  assert.doesNotMatch(ev!.excerpt!, /\s{2,}/, 'whitespace runs collapsed');
});

test('excerpt: experience BULLET keyword match captures the bullet context', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    experience: [
      {
        role: 'Engineer',
        organization: 'Acme',
        bullets: ['Built a P&L dashboard in Python for the trading desk'],
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  // The Python keyword maps to 'Python Programming'; its experience evidence
  // should carry an excerpt drawn from the bullet text.
  const pyCap = caps.find((c) => c.label === 'Python Programming');
  assert.ok(pyCap, 'expected a Python Programming capability');
  const ev = pyCap!.evidence.find((e) => e.kind === 'experience');
  assert.ok(ev?.excerpt, 'experience bullet evidence should carry an excerpt');
  assert.match(ev!.excerpt!.toLowerCase(), /python/);
});

test('excerpt: work DESCRIPTION keyword match captures the description context', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    works: [
      {
        title: 'Greeks Visualiser',
        description: 'Interactive visualisation of options greeks built with React and TypeScript.',
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const feCap = caps.find((c) => c.label === 'Front-end Engineering');
  assert.ok(feCap, 'expected a Front-end Engineering capability');
  const ev = feCap!.evidence.find((e) => e.kind === 'work');
  assert.ok(ev?.excerpt, 'work description evidence should carry an excerpt');
  assert.match(ev!.excerpt!.toLowerCase(), /react|typescript/);
});

test('excerpt: education line keyword match captures the field/notes context', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    education: [
      {
        institution: 'UNSW',
        qualification: 'BSc',
        field: 'Human-computer interaction and user research methods',
      } as BeginnerProfile['education'][number],
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const urCap = caps.find((c) => c.label === 'User Research');
  assert.ok(urCap, 'expected a User Research capability');
  const ev = urCap!.evidence.find((e) => e.kind === 'education');
  assert.ok(ev?.excerpt, 'education evidence should carry an excerpt');
  assert.match(ev!.excerpt!.toLowerCase(), /research|human-computer/);
});

test('excerpt: a LABEL-ONLY source (no meaningful text) yields no excerpt', () => {
  // An experience whose role maps to no keyword and carries NO bullets: the
  // evidence is real, but there's nothing to quote, so no excerpt is invented.
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    experience: [
      { role: 'Plumber', organization: 'Pipes Inc', bullets: [] },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const cap = caps.find((c) => c.label === 'Plumber');
  assert.ok(cap, 'expected a Plumber capability from the unmapped role');
  const ev = cap!.evidence.find((e) => e.kind === 'experience');
  assert.ok(ev, 'expected experience evidence');
  assert.equal(ev!.excerpt, undefined, 'a label-only source carries no excerpt');
});

test('excerpt: a bare-label artifact (no extractedText) yields no excerpt', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'data analysis enthusiast', links: [] },
    works: [{ title: 'Data analysis toolkit', description: 'A data analysis toolkit.' }],
    artifacts: [
      // Label matches the keyword (so it attaches as evidence) but has no
      // extractedText — nothing to quote.
      { id: 'art-bare', name: 'data-analysis.pdf', kind: 'pdf', label: 'data analysis' },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const ev = findArtifactEvidence(caps, 'art-bare');
  assert.ok(ev, 'expected the bare artifact to back a capability via its label');
  assert.equal(ev!.excerpt, undefined, 'no extractedText → no excerpt');
});

test('excerpt: dedup (kind+refId) stays intact — one evidence per source', () => {
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    about: { summary: 'data analysis', links: [] },
    artifacts: [
      {
        id: 'art-dup',
        name: 'report.pdf',
        kind: 'pdf',
        label: 'Report',
        // Two keywords (data analysis + python) both hit, but it's ONE artifact.
        extractedText: 'A python-driven data analysis pipeline for the desk.',
      },
    ],
  };
  const caps = deriveCapabilitiesHeuristic(profile);
  const occurrences = caps
    .flatMap((c) => c.evidence)
    .filter((e) => e.kind === 'artifact' && e.refId === 'art-dup');
  // The SAME evidence object may be attached to multiple capabilities, but within
  // any single capability it must appear once (the Set dedups by reference).
  for (const cap of caps) {
    const inThisCap = cap.evidence.filter((e) => e.kind === 'artifact' && e.refId === 'art-dup');
    assert.ok(inThisCap.length <= 1, `${cap.label} should not duplicate the same artifact ref`);
  }
  assert.ok(occurrences.length >= 1, 'the artifact backs at least one capability');
});

// ── normalizeCapabilities carries the optional excerpt through ─────────────────

test('normalizeCapabilities: preserves a valid string excerpt on evidence', () => {
  const caps = normalizeCapabilities([
    {
      id: 'cap-x',
      label: 'Analysis',
      status: 'partial',
      evidence: [
        { kind: 'artifact', refId: 'art-1', label: 'Report', excerpt: 'the data analysis window' },
      ],
    },
  ]);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].evidence.length, 1);
  assert.equal(caps[0].evidence[0].excerpt, 'the data analysis window');
});

test('normalizeCapabilities: drops a non-string excerpt and bounds an oversized one', () => {
  const huge = 'x'.repeat(1000);
  const caps = normalizeCapabilities([
    {
      id: 'cap-x',
      label: 'Analysis',
      status: 'partial',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'A', excerpt: 123 }, // non-string
        { kind: 'work', refId: 'work-0', label: 'B', excerpt: huge }, // oversized
      ],
    },
  ]);
  assert.equal(caps[0].evidence.length, 2);
  assert.equal(caps[0].evidence[0].excerpt, undefined, 'non-string excerpt dropped');
  assert.ok(
    caps[0].evidence[1].excerpt && caps[0].evidence[1].excerpt.length <= EXCERPT_MAX,
    'oversized excerpt bounded',
  );
});
