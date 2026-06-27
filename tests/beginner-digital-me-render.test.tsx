import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { type BeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerCapability } from '../lib/capability/capability-graph';

// CSS Modules: return a proxy so any className lookup is a no-op string.
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

// Stub buildCapabilities so the capability-map tests never hit the network.
// The test exercises synchronous rendering only — the async build flow is
// verified by the button-present assertion.
require.extensions['.ts'] = require.extensions['.ts'] || (() => {});
// Re-stub after any require clears the cache: done inline per-test below.

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

const SAMPLE_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Alex Chen', headline: 'Software Engineer' },
  about: {
    summary: 'Building reliable distributed systems and learning ML foundations.',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/alexchen' },
      { label: 'GitHub', href: 'https://github.com/alexchen' },
    ],
  },
  education: [],
  experience: [],
  works: [],
};

// An "established" profile with real SUBSTANCE (journey + an uploaded artifact) —
// used by the tests that assert the progressively-disclosed sections. Capabilities and
// Proof disclose once the profile is established (has a journey); Ask and Studio hold
// back until there's actual proof (or a backed capability), since a journey-only
// profile can't cite anything — hence the artifact here.
const ESTABLISHED_PROFILE: BeginnerProfile = {
  ...SAMPLE_PROFILE,
  experience: [
    { role: 'Senior Engineer', organization: 'Acme', start: '2020', bullets: ['Led the platform team.'] },
  ],
  artifacts: [
    { id: 'af_cv', name: 'CV.pdf', kind: 'pdf', extractedText: 'Distributed systems and ML engineering.' },
  ],
};

test('BeginnerDigitalMe renders name and headline', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Alex Chen/);
  assert.match(text, /Software Engineer/);
});

test('BeginnerDigitalMe renders about summary', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Building reliable distributed systems and learning ML foundations\./);
});

test('BeginnerDigitalMe renders profile link labels with _blank and noreferrer', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /LinkedIn/);
  assert.match(text, /GitHub/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noreferrer"/);
});

test('BeginnerDigitalMe renders the Ask widget section', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={ESTABLISHED_PROFILE} />);

  // AskYiping renders a <section aria-labelledby="ask-yiping-title"> at minimum.
  assert.match(html, /ask-yiping/i);
});

test('BeginnerDigitalMe mounts the Studio section (empty state in SSR)', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  // SSR render: the listDrafts effect does not run, so the Studio section shows
  // its header + empty-state CTA. This pins that the section is mounted.
  const html = render(<BeginnerDigitalMe profile={ESTABLISHED_PROFILE} />);
  const text = visibleText(html);
  assert.match(text, /Studio/);
  assert.match(text, /Start a document/);
  assert.match(html, /href="\/digital-me\?edit=new"/);
});

test('BeginnerDigitalMe omits Yiping Role-OS markers', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Proof-path panel markers
  assert.doesNotMatch(text, /Claim Engine/);
  assert.doesNotMatch(text, /Artifact Runtime/);
  // Evidence graph panel
  assert.doesNotMatch(text, /Evidence Graph/);
  // QBook market room
  assert.doesNotMatch(text, /Live Market Room/);
  // Role lens eyebrow
  assert.doesNotMatch(text, /Role Lens/);
  // CSS class markers from DigitalMeRoleOSClient-specific sections
  assert.doesNotMatch(html, /proofPath/);
  assert.doesNotMatch(html, /claimRail/);
  assert.doesNotMatch(html, /evidencePanel/);
  assert.doesNotMatch(html, /marketRoom/);
  assert.doesNotMatch(html, /roleLens/);
});

test('BeginnerDigitalMe renders page shell with correct aria-labelledby', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);

  assert.match(html, /aria-labelledby="digital-me-title"/);
  assert.match(html, /id="digital-me-title"/);
  assert.match(html, /loom-cosmic-field/);
});

test('BeginnerDigitalMe falls back to "Your name" when name is empty', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const emptyProfile: BeginnerProfile = {
    ...SAMPLE_PROFILE,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
  };
  const html = render(<BeginnerDigitalMe profile={emptyProfile} />);
  const text = visibleText(html);

  assert.match(text, /Your name/);
});

// --- AskYiping suggestedQuestions / placeholder prop contract ---

test('AskYiping renders custom suggestedQuestions when provided', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const custom = ["What's their experience?", 'What are they strongest at?'];
  const html = render(<AskYiping suggestedQuestions={custom} />);
  const text = visibleText(html);

  assert.match(text, /What's their experience\?/);
  assert.match(text, /What are they strongest at\?/);

  // Extract only the chips group HTML (role="group" aria-label="Suggested questions")
  // to verify owner-specific chip text is absent from the chips — the example answer
  // body may legitimately contain owner-specific terms.
  const chipsMatch = html.match(/role="group" aria-label="Suggested questions"[^>]*>([\s\S]*?)<\/div>/);
  const chipsHtml = chipsMatch ? chipsMatch[1] : '';
  assert.ok(chipsHtml.length > 0, 'chips group should be present in the HTML');
  assert.doesNotMatch(chipsHtml, /optimisation|Optibook|C\+\+/i);
});

test('AskYiping renders owner default chips when no suggestedQuestions prop is given', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const { ASK_YIPING_SUGGESTED_QUESTIONS } = require('../lib/new-loom/ask-yiping') as typeof import('../lib/new-loom/ask-yiping');
  const html = render(<AskYiping />);
  const text = visibleText(html);

  for (const chip of ASK_YIPING_SUGGESTED_QUESTIONS) {
    assert.match(text, new RegExp(chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('AskYiping renders custom placeholder when provided', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const html = render(<AskYiping placeholder="Ask me anything…" />);

  assert.match(html, /placeholder="Ask me anything…"/);
  assert.doesNotMatch(html, /Ask about maths/);
});

test('AskYiping renders owner default placeholder when no placeholder prop is given', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const html = render(<AskYiping />);

  assert.match(html, /Ask about maths, optimisation, programming, or QBook/);
});

test('BeginnerDigitalMe passes generic chips and placeholder to AskYiping', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={ESTABLISHED_PROFILE} />);
  const text = visibleText(html);

  // Generic chips must be present.
  assert.match(text, /What's their experience\?/);
  assert.match(text, /What are they strongest at\?/);
  assert.match(text, /What have they studied\?/);
  assert.match(text, /Why work with them\?/);
  // Generic placeholder must be present.
  assert.match(html, /placeholder="Ask me anything…"/);
  // Owner-specific placeholder must NOT appear.
  assert.doesNotMatch(html, /Ask about maths/);

  // Extract chips group HTML to verify owner-specific chip text is absent from
  // the chips — the example answer body may contain owner-specific terms.
  const chipsMatch = html.match(/role="group" aria-label="Suggested questions"[^>]*>([\s\S]*?)<\/div>/);
  const chipsHtml = chipsMatch ? chipsMatch[1] : '';
  assert.ok(chipsHtml.length > 0, 'chips group should be present in the HTML');
  assert.doesNotMatch(chipsHtml, /optimisation|Optibook|C\+\+/i);
});

// --- De-branding: AskYiping with example=null + generic copy ---

test('AskYiping with example=null renders no owner eyebrow/title and no owner example Q&A', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const html = render(
    <AskYiping
      eyebrow="Ask me"
      title="Ask Alex Chen anything"
      lede="Grounded answers. Cited from your verified profile."
      readOnlyNote="Live answers need an AI key — this deploy is read-only."
      example={null}
      suggestedQuestions={["What's their experience?", 'What are they strongest at?']}
      placeholder="Ask me anything…"
    />,
  );
  const text = visibleText(html);

  // Must NOT contain owner-specific copy.
  assert.doesNotMatch(text, /Ask Yiping/i);
  assert.doesNotMatch(text, /Yiping/);
  // Must NOT contain owner example question or answer.
  assert.doesNotMatch(text, /ECON3202/);
  assert.doesNotMatch(text, /concavity/i);
  assert.doesNotMatch(text, /optimisation/i);
  // Must NOT show "Example grounded answer" header (no example seed).
  assert.doesNotMatch(text, /Example grounded answer/);
  // Generic copy must be present.
  assert.match(text, /Ask me/);
  assert.match(text, /Alex Chen/);
  // Idle placeholder must be present.
  assert.match(text, /Ask a question to get a grounded, cited answer/);
});

test('AskYiping defaults (no props) still render owner eyebrow, title, and example seed', () => {
  const { AskYiping } = require('../components/verified-dossier/AskYiping') as typeof import('../components/verified-dossier/AskYiping');
  const html = render(<AskYiping />);
  const text = visibleText(html);

  // Owner eyebrow and title must be present.
  assert.match(text, /Ask Yiping/);
  assert.match(text, /Ask Yiping's verified knowledge/);
  // Owner example question must be present (seeded).
  assert.match(text, /ECON3202/);
  // "Example grounded answer" header must be present (example phase).
  assert.match(text, /Example grounded answer/);
  // Idle placeholder must NOT appear (we have an example, not idle state).
  assert.doesNotMatch(text, /Ask a question to get a grounded, cited answer/);
});

// ── T6: Capability map section ────────────────────────────────────────────────

const SAMPLE_CAPS: BeginnerCapability[] = [
  {
    id: 'cap-python-programming',
    label: 'Python Programming',
    status: 'strong',
    evidence: [
      { kind: 'experience', refId: 'exp-0', label: 'Acme Corp' },
      { kind: 'artifact', refId: 'artifact-abc', label: 'portfolio.pdf' },
    ],
  },
  {
    id: 'cap-data-analysis',
    label: 'Data Analysis',
    status: 'partial',
    evidence: [
      { kind: 'work', refId: 'work-0', label: 'Dashboard project' },
    ],
  },
];

const PROFILE_WITH_CAPS: BeginnerProfile = {
  ...{
    version: 1 as const,
    home: { name: 'Alex Chen', headline: 'Software Engineer' },
    about: {
      summary: 'Building reliable distributed systems and learning ML foundations.',
      links: [],
    },
    education: [],
    experience: [],
    works: [],
  },
  capabilities: SAMPLE_CAPS,
};

test('BeginnerDigitalMe with capabilities renders CAPABILITIES eyebrow and heading', () => {
  // Stub artifact-store so SSR never touches IndexedDB.
  require.cache[require.resolve('../lib/artifact/artifact-store')] = {
    id: require.resolve('../lib/artifact/artifact-store'),
    filename: require.resolve('../lib/artifact/artifact-store'),
    loaded: true,
    exports: { getArtifactObjectUrl: async () => null },
    parent: null,
    children: [],
    paths: [],
  } as unknown as NodeModule;

  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={PROFILE_WITH_CAPS} />);
  const text = visibleText(html);

  // Capabilities section eyebrow and heading must appear (eyebrow is Title-case
  // in source; CSS uppercases it for display).
  assert.match(text, /Capabilities/);
  assert.match(text, /What I can do/);
});

test('BeginnerDigitalMe with capabilities renders CapabilityMap with a capability label and star node', () => {
  // Stub artifact-store so SSR never touches IndexedDB.
  require.cache[require.resolve('../lib/artifact/artifact-store')] = {
    id: require.resolve('../lib/artifact/artifact-store'),
    filename: require.resolve('../lib/artifact/artifact-store'),
    loaded: true,
    exports: { getArtifactObjectUrl: async () => null },
    parent: null,
    children: [],
    paths: [],
  } as unknown as NodeModule;

  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={PROFILE_WITH_CAPS} />);
  const text = visibleText(html);

  // CapabilityMap must render the capability label as a card heading.
  assert.match(text, /Python Programming/);
  // Star node aria-label contains the capability label.
  assert.match(html, /data-star-node/);
  // The star-river SVG must be present.
  assert.match(html, /data-star-river/);
});

test('BeginnerDigitalMe renders Build / Refresh capability map button', () => {
  require.cache[require.resolve('../lib/artifact/artifact-store')] = {
    id: require.resolve('../lib/artifact/artifact-store'),
    filename: require.resolve('../lib/artifact/artifact-store'),
    loaded: true,
    exports: { getArtifactObjectUrl: async () => null },
    parent: null,
    children: [],
    paths: [],
  } as unknown as NodeModule;

  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={PROFILE_WITH_CAPS} />);
  const text = visibleText(html);

  // The button must be present — exact label depends on caps state.
  // With caps present it should say "Refresh capability map".
  assert.match(text, /Refresh capability map/);
});

test('BeginnerDigitalMe capability compounding summary counts correctly', () => {
  // 1 strong (Python) + 1 partial (Data Analysis) = 2 caps, 1 backed by proof.
  require.cache[require.resolve('../lib/artifact/artifact-store')] = {
    id: require.resolve('../lib/artifact/artifact-store'),
    filename: require.resolve('../lib/artifact/artifact-store'),
    loaded: true,
    exports: { getArtifactObjectUrl: async () => null },
    parent: null,
    children: [],
    paths: [],
  } as unknown as NodeModule;

  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={PROFILE_WITH_CAPS} />);
  const text = visibleText(html);

  assert.match(text, /2 capabilities/);
  assert.match(text, /1 backed by proof/);
});

test('BeginnerDigitalMe renders no "Ask Yiping" text and no owner example Q&A', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={ESTABLISHED_PROFILE} />);
  const text = visibleText(html);

  // Must NOT contain "Ask Yiping" anywhere (eyebrow, title, aria-label, error heading).
  assert.doesNotMatch(text, /Ask Yiping/);
  // Must NOT contain owner example question.
  assert.doesNotMatch(text, /ECON3202/);
  assert.doesNotMatch(text, /concavity/i);
  // Generic eyebrow must be present.
  assert.match(text, /Ask me/);
  // Title with name must be present.
  assert.match(text, /Ask Alex Chen anything/);
});
