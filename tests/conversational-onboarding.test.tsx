/**
 * tests/conversational-onboarding.test.tsx
 *
 * Contracts for:
 *   1. applyAnswer — pure step-machine helper (no rendering required)
 *   2. ConversationalOnboardingClient — first LOOM question + input render
 *
 * Run via: npm run test:contracts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import Module from 'node:module';

import { emptyBeginnerProfile, normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── CSS module stub ─────────────────────────────────────────────────────────
// Must be installed BEFORE the client module is first require()'d so that the
// CSS import inside ConversationalOnboardingClient.tsx is intercepted.
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(require.extensions as any)['.css'] = (mod: { exports: typeof cssModuleExports }) => {
  mod.exports = cssModuleExports;
};

// ── Dependency stubs ─────────────────────────────────────────────────────────
// Must be installed before the client module is first require()'d.
const _orig = (Module.prototype as NodeJS.Module).require as (id: string) => unknown;

function iconStub(props: Record<string, unknown>) {
  return React.createElement('svg', { 'data-icon': true, ...props });
}

(Module.prototype as NodeJS.Module).require = function stubRequire(
  this: NodeJS.Module,
  id: string,
): unknown {
  if (id === 'next/navigation') {
    return { useRouter: () => ({ push: (_path: string) => undefined }), usePathname: () => '/' };
  }
  if (id === 'next/link') {
    function LinkStub({
      href,
      children,
      className,
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) {
      return React.createElement('a', { href, className }, children);
    }
    return { __esModule: true, default: LinkStub };
  }
  if (id === 'lucide-react') {
    return { ArrowRight: iconStub, ArrowLeft: iconStub, Plus: iconStub, X: iconStub };
  }
  // Stub profile-storage so no localStorage calls happen during tests
  if (id.endsWith('profile-storage')) {
    return {
      readBeginnerProfileLocal: () => null,
      writeBeginnerProfileLocal: () => undefined,
      BEGINNER_PROFILE_KEY: 'loom:beginner-profile',
    };
  }
  return _orig.call(this, id);
} as typeof _orig;

// ── Render helper ─────────────────────────────────────────────────────────────
function render(node: React.ReactElement): string {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Helper to require the client module (deferred so stubs are installed first) ──
function getClient() {
  return require('../app/onboarding/profile/ConversationalOnboardingClient') as typeof import('../app/onboarding/profile/ConversationalOnboardingClient');
}

// ── applyAnswer pure helper tests ────────────────────────────────────────────

test('applyAnswer: name step stores name and advances to headline', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'name' }, 'Ada Lovelace');
  assert.equal(p.home.name, 'Ada Lovelace');
  assert.equal(next.id, 'headline');
});

test('applyAnswer: headline step stores headline and advances to summary', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'headline' }, 'Quant developer · Sydney');
  assert.equal(p.home.headline, 'Quant developer · Sydney');
  assert.equal(next.id, 'summary');
});

test('applyAnswer: summary step stores summary and advances to edu_institution', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'summary' }, 'Building knowledge systems.');
  assert.equal(p.about.summary, 'Building knowledge systems.');
  assert.equal(next.id, 'edu_institution');
});

test('applyAnswer: summary "skip" leaves summary empty and advances', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'summary' }, 'skip');
  assert.equal(p.about.summary, '');
  assert.equal(next.id, 'edu_institution');
});

test('applyAnswer: edu_institution "skip" jumps to exp_role', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next } = applyAnswer(profile, { id: 'edu_institution', entryIdx: 0 }, 'skip');
  assert.equal(next.id, 'exp_role');
});

test('applyAnswer: edu_institution creates entry and advances to edu_qualification', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(
    profile,
    { id: 'edu_institution', entryIdx: 0 },
    'University of Sydney',
  );
  assert.equal(p.education.length, 1);
  assert.equal(p.education[0].institution, 'University of Sydney');
  assert.equal(next.id, 'edu_qualification');
});

test('applyAnswer: edu_qualification sets qualification', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), education: [{ institution: 'USYD', qualification: '' }] };
  const { next, profile: p } = applyAnswer(base, { id: 'edu_qualification', entryIdx: 0 }, 'BSc Mathematics');
  assert.equal(p.education[0].qualification, 'BSc Mathematics');
  assert.equal(next.id, 'edu_years');
});

test('applyAnswer: edu_years parses start and end', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), education: [{ institution: 'USYD', qualification: 'BSc' }] };
  const { next, profile: p } = applyAnswer(base, { id: 'edu_years', entryIdx: 0 }, '2019–2022');
  assert.equal(p.education[0].start, '2019');
  assert.equal(p.education[0].end, '2022');
  assert.equal(next.id, 'edu_more');
});

test('applyAnswer: edu_more "yes" advances to edu_institution with next index', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), education: [{ institution: 'USYD', qualification: 'BSc' }] };
  const { next } = applyAnswer(base, { id: 'edu_more' }, 'yes');
  assert.equal(next.id, 'edu_institution');
  assert.equal((next as { id: string; entryIdx: number }).entryIdx, 1);
});

test('applyAnswer: edu_more "no" advances to exp_role', () => {
  const { applyAnswer } = getClient();
  const base = emptyBeginnerProfile();
  const { next } = applyAnswer(base, { id: 'edu_more' }, 'no');
  assert.equal(next.id, 'exp_role');
});

test('applyAnswer: exp_role "skip" advances to work_title (not review)', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next } = applyAnswer(profile, { id: 'exp_role', entryIdx: 0 }, 'skip');
  // A student with projects but no jobs must still reach Works after skipping
  // experience — the skip branch advances to work_title, not straight to review.
  assert.equal(next.id, 'work_title');
  assert.equal((next as { id: string; entryIdx: number }).entryIdx, 0);
});

test('applyAnswer: skip experience → work_title → … → review (full edge)', () => {
  const { applyAnswer } = getClient();
  let profile = emptyBeginnerProfile();

  function step<S extends Record<string, unknown>>(s: S) {
    return s as unknown as Parameters<typeof applyAnswer>[1];
  }

  // Skip experience entirely.
  let r = applyAnswer(profile, step({ id: 'exp_role', entryIdx: 0 }), 'skip');
  profile = r.profile;
  assert.equal((r.next as { id: string }).id, 'work_title');

  // Add one project via the chat.
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'Option Pricer'); // work_title
  profile = r.profile;
  assert.equal((r.next as { id: string }).id, 'work_description');
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'Black-Scholes calc'); // work_description
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'skip'); // work_link
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'no'); // work_more → review
  profile = r.profile;
  assert.equal((r.next as { id: string }).id, 'review');

  const normalized = normalizeBeginnerProfile(profile);
  assert.equal(normalized.experience.length, 0);
  assert.equal(normalized.works.length, 1);
  assert.equal(normalized.works[0].title, 'Option Pricer');
});

test('applyAnswer: exp_role creates entry and advances to exp_organization', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'exp_role', entryIdx: 0 }, 'Quant Researcher');
  assert.equal(p.experience.length, 1);
  assert.equal(p.experience[0].role, 'Quant Researcher');
  assert.equal(next.id, 'exp_organization');
});

test('applyAnswer: exp_highlight stores bullet', () => {
  const { applyAnswer } = getClient();
  const base = {
    ...emptyBeginnerProfile(),
    experience: [{ role: 'QR', organization: 'Acme', bullets: [] }],
  };
  const { profile: p } = applyAnswer(base, { id: 'exp_highlight', entryIdx: 0 }, 'Built a vol model');
  assert.equal(p.experience[0].bullets.length, 1);
  assert.equal(p.experience[0].bullets[0], 'Built a vol model');
});

test('applyAnswer: exp_highlight "skip" leaves bullets empty', () => {
  const { applyAnswer } = getClient();
  const base = {
    ...emptyBeginnerProfile(),
    experience: [{ role: 'QR', organization: 'Acme', bullets: [] }],
  };
  const { profile: p } = applyAnswer(base, { id: 'exp_highlight', entryIdx: 0 }, 'skip');
  assert.equal(p.experience[0].bullets.length, 0);
});

// ── Returning / pre-populated profile: entryIdx must point at the new slot ─────

test('applyAnswer: edu_institution on a pre-populated profile indexes the new slot, not entry[0]', () => {
  const { applyAnswer } = getClient();
  // A returning user whose profile already has one education entry.
  const base: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    education: [{ institution: 'Existing University', qualification: 'BSc Existing' }],
  };
  // entryIdx is 0 here (the step machine's "first entry" prompt), but the array
  // is already populated — the new entry must land at index 1.
  let r = applyAnswer(base, { id: 'edu_institution', entryIdx: 0 }, 'New College');
  assert.equal(r.profile.education.length, 2);
  assert.equal((r.next as { id: string; entryIdx: number }).entryIdx, 1);

  // The follow-up qualification answer must write the NEW slot, leaving the old
  // entry untouched and not stranding a half-empty entry.
  r = applyAnswer(r.profile, r.next as Parameters<typeof applyAnswer>[1], 'MSc New');
  assert.equal(r.profile.education[0].institution, 'Existing University');
  assert.equal(r.profile.education[0].qualification, 'BSc Existing');
  assert.equal(r.profile.education[1].institution, 'New College');
  assert.equal(r.profile.education[1].qualification, 'MSc New');
});

test('applyAnswer: exp_role on a pre-populated profile indexes the new slot', () => {
  const { applyAnswer } = getClient();
  const base: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    experience: [{ role: 'Old Role', organization: 'Old Org', bullets: [] }],
  };
  let r = applyAnswer(base, { id: 'exp_role', entryIdx: 0 }, 'New Role');
  assert.equal(r.profile.experience.length, 2);
  assert.equal((r.next as { id: string; entryIdx: number }).entryIdx, 1);

  r = applyAnswer(r.profile, r.next as Parameters<typeof applyAnswer>[1], 'New Org');
  assert.equal(r.profile.experience[0].role, 'Old Role');
  assert.equal(r.profile.experience[0].organization, 'Old Org');
  assert.equal(r.profile.experience[1].role, 'New Role');
  assert.equal(r.profile.experience[1].organization, 'New Org');
});

test('applyAnswer: work_title on a pre-populated profile indexes the new slot', () => {
  const { applyAnswer } = getClient();
  const base: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    works: [{ title: 'Old Project' }],
  };
  let r = applyAnswer(base, { id: 'work_title', entryIdx: 0 }, 'New Project');
  assert.equal(r.profile.works.length, 2);
  assert.equal((r.next as { id: string; entryIdx: number }).entryIdx, 1);

  r = applyAnswer(r.profile, r.next as Parameters<typeof applyAnswer>[1], 'A new build');
  assert.equal(r.profile.works[0].title, 'Old Project');
  assert.equal(r.profile.works[1].title, 'New Project');
  assert.equal(r.profile.works[1].description, 'A new build');
});

// ── Full scripted run ─────────────────────────────────────────────────────────

test('applyAnswer: full scripted run produces a correct normalized BeginnerProfile', () => {
  const { applyAnswer } = getClient();
  let profile = emptyBeginnerProfile();
  // Use the shape directly rather than the exported type to avoid static import
  let stepId: string = 'name';
  let stepObj: Record<string, unknown> = { id: 'name' };

  function step<S extends Record<string, unknown>>(s: S) { return s as unknown as Parameters<typeof applyAnswer>[1]; }

  // name
  let r = applyAnswer(profile, step(stepObj), 'Ada Lovelace');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // headline
  r = applyAnswer(profile, step(stepObj), 'Quant developer · Sydney');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // summary
  r = applyAnswer(profile, step(stepObj), 'Building knowledge systems.');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // edu_institution
  r = applyAnswer(profile, step(stepObj), 'University of Sydney');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // edu_qualification
  r = applyAnswer(profile, step(stepObj), 'BSc Mathematics');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // edu_years
  r = applyAnswer(profile, step(stepObj), '2019-2022');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // edu_more → no
  r = applyAnswer(profile, step(stepObj), 'no');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // exp_role
  r = applyAnswer(profile, step(stepObj), 'Quant Researcher');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // exp_organization
  r = applyAnswer(profile, step(stepObj), 'Acme Capital');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // exp_years
  r = applyAnswer(profile, step(stepObj), 'Jan 2023-Present');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // exp_highlight
  r = applyAnswer(profile, step(stepObj), 'Built a vol model');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  // exp_more → no → work_title
  r = applyAnswer(profile, step(stepObj), 'no');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  assert.equal(stepId, 'work_title');

  // work_title → skip → review
  r = applyAnswer(profile, step(stepObj), 'skip');
  profile = r.profile; stepObj = r.next as Record<string, unknown>; stepId = stepObj.id as string;

  assert.equal(stepId, 'review');

  const normalized = normalizeBeginnerProfile(profile);

  // Home
  assert.equal(normalized.home.name, 'Ada Lovelace');
  assert.equal(normalized.home.headline, 'Quant developer · Sydney');

  // About
  assert.equal(normalized.about.summary, 'Building knowledge systems.');

  // Education
  assert.equal(normalized.education.length, 1);
  assert.equal(normalized.education[0].institution, 'University of Sydney');
  assert.equal(normalized.education[0].qualification, 'BSc Mathematics');
  assert.equal(normalized.education[0].start, '2019');
  assert.equal(normalized.education[0].end, '2022');

  // Experience
  assert.equal(normalized.experience.length, 1);
  assert.equal(normalized.experience[0].role, 'Quant Researcher');
  assert.equal(normalized.experience[0].organization, 'Acme Capital');
  assert.equal(normalized.experience[0].bullets.length, 1);
  assert.equal(normalized.experience[0].bullets[0], 'Built a vol model');

  // Works (skipped)
  assert.equal(normalized.works.length, 0);
});

// ── Render test ───────────────────────────────────────────────────────────────

test('ConversationalOnboardingClient: renders first LOOM question and input', () => {
  const { ConversationalOnboardingClient } = getClient();

  const html = render(<ConversationalOnboardingClient />);
  const text = visibleText(html);

  // The shell title must be present
  assert.match(text, /build your/i);
  assert.match(text, /LOOM/);

  // The chat input for the user's answer must render
  assert.match(html, /chatInput|Type your answer/i);

  // Progress indicator
  assert.match(html, /progressBar|progressFill/i);

  // "Prefer a form?" footer link
  assert.match(html, /form/i);
});

test('ConversationalOnboardingClient: renders without error with no initial state', () => {
  const { ConversationalOnboardingClient } = getClient();

  let html = '';
  assert.doesNotThrow(() => {
    html = render(<ConversationalOnboardingClient />);
  });
  assert.ok(html.length > 0);
});

// ── Works loop tests ──────────────────────────────────────────────────────────

test('applyAnswer: work_title "skip" advances to review', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next } = applyAnswer(profile, { id: 'work_title', entryIdx: 0 }, 'skip');
  assert.equal(next.id, 'review');
});

test('applyAnswer: work_title creates entry and advances to work_description', () => {
  const { applyAnswer } = getClient();
  const profile = emptyBeginnerProfile();
  const { next, profile: p } = applyAnswer(profile, { id: 'work_title', entryIdx: 0 }, 'Option Pricer');
  assert.equal(p.works.length, 1);
  assert.equal(p.works[0].title, 'Option Pricer');
  assert.equal(next.id, 'work_description');
});

test('applyAnswer: work_description stores description and advances to work_link', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), works: [{ title: 'Option Pricer' }] };
  const { next, profile: p } = applyAnswer(base, { id: 'work_description', entryIdx: 0 }, 'Black-Scholes web calculator.');
  assert.equal(p.works[0].description, 'Black-Scholes web calculator.');
  assert.equal(next.id, 'work_link');
});

test('applyAnswer: work_description "skip" leaves description undefined', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), works: [{ title: 'Option Pricer' }] };
  const { profile: p } = applyAnswer(base, { id: 'work_description', entryIdx: 0 }, 'skip');
  assert.equal(p.works[0].description, undefined);
});

test('applyAnswer: work_link stores link and advances to work_more', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), works: [{ title: 'Option Pricer' }] };
  const { next, profile: p } = applyAnswer(base, { id: 'work_link', entryIdx: 0 }, 'https://github.com/ada/op');
  assert.equal(p.works[0].link, 'https://github.com/ada/op');
  assert.equal(next.id, 'work_more');
});

test('applyAnswer: work_more "yes" advances to work_title with next index', () => {
  const { applyAnswer } = getClient();
  const base = { ...emptyBeginnerProfile(), works: [{ title: 'Option Pricer' }] };
  const { next } = applyAnswer(base, { id: 'work_more' }, 'yes');
  assert.equal(next.id, 'work_title');
  assert.equal((next as { id: string; entryIdx: number }).entryIdx, 1);
});

test('applyAnswer: work_more "no" advances to review', () => {
  const { applyAnswer } = getClient();
  const base = emptyBeginnerProfile();
  const { next } = applyAnswer(base, { id: 'work_more' }, 'no');
  assert.equal(next.id, 'review');
});

test('applyAnswer: full works entry round-trips correctly through normalization', () => {
  const { applyAnswer } = getClient();
  let profile = emptyBeginnerProfile();

  function step<S extends Record<string, unknown>>(s: S) { return s as unknown as Parameters<typeof applyAnswer>[1]; }

  // Quickly get to work_title via exp_more path
  let r = applyAnswer(profile, step({ id: 'name' }), 'Ada');
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'Engineer');
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'skip'); // summary
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'skip'); // edu_institution → exp_role
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'Analyst'); // exp_role
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'Acme'); // exp_organization
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'skip'); // exp_years
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'skip'); // exp_highlight
  profile = r.profile;
  r = applyAnswer(profile, r.next as Parameters<typeof applyAnswer>[1], 'no'); // exp_more → work_title
  profile = r.profile;
  assert.equal((r.next as { id: string }).id, 'work_title');

  r = applyAnswer(profile, step({ id: 'work_title', entryIdx: 0 }), 'Option Pricer');
  profile = r.profile;
  r = applyAnswer(profile, step({ id: 'work_description', entryIdx: 0 }), 'Black-Scholes calc');
  profile = r.profile;
  r = applyAnswer(profile, step({ id: 'work_link', entryIdx: 0 }), 'https://github.com/ada/op');
  profile = r.profile;
  r = applyAnswer(profile, step({ id: 'work_more' }), 'no');
  profile = r.profile;
  assert.equal((r.next as { id: string }).id, 'review');

  const normalized = normalizeBeginnerProfile(profile);
  assert.equal(normalized.works.length, 1);
  assert.equal(normalized.works[0].title, 'Option Pricer');
  assert.equal(normalized.works[0].description, 'Black-Scholes calc');
  assert.equal(normalized.works[0].link, 'https://github.com/ada/op');
});

// The chat answer-quality gate (decideChatGate + fieldOf/stepKey/isSkip/isYes)
// now lives in lib/onboarding/chat-gate.ts and is unit-tested directly in
// tests/chat-gate.test.ts — no React/jsdom harness needed.

// Suppress unused variable warning
void ((_: string) => _);
