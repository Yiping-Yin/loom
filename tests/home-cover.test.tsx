/**
 * tests/home-cover.test.tsx
 *
 * Contract for HomeConversationalCover — the conversation-first cosmic front
 * door (new-user). Mirrors the getClient()/CSS-shim harness from
 * conversational-onboarding.test.tsx: stub the CSS modules, next/navigation,
 * next/link and profile-storage BEFORE the component is first require()'d, then
 * render it to static markup and assert the locus surface (living prompt +
 * input + whisper links) renders and the constellation field is aria-hidden.
 *
 * Run via: npm run test:contracts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import Module from 'node:module';
import type { ConversationApi } from '../lib/onboarding/useConversation';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── CSS module stub (must precede the first require of the component) ─────────
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

 
(require.extensions as any)['.css'] = (mod: { exports: typeof cssModuleExports }) => {
  mod.exports = cssModuleExports;
};

// ── Dependency stubs (installed before the component is first require()'d) ────
const _orig = (Module.prototype as NodeJS.Module).require as (id: string) => unknown;

// Opt-in mock for the shared conversation hook. When set, HomeConversationalCover
// binds to this api instead of the real useConversation(); when null, the real
// hook runs (so the first-paint tests below are unaffected). This lets a static
// render exercise the review/save branch — which the real hook only reaches after
// async chat interaction that renderToStaticMarkup cannot drive.
let mockConversation: ConversationApi | null = null;

(Module.prototype as NodeJS.Module).require = function stubRequire(
  this: NodeJS.Module,
  id: string,
): unknown {
  if (id.endsWith('onboarding/useConversation')) {
    const real = _orig.call(this, id) as typeof import('../lib/onboarding/useConversation');
    return { ...real, useConversation: () => mockConversation ?? real.useConversation() };
  }
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
  if (id.endsWith('profile-storage')) {
    return {
      readBeginnerProfileLocal: () => null,
      writeBeginnerProfileLocal: () => undefined,
      BEGINNER_PROFILE_KEY: 'loom:beginner-profile',
    };
  }
  return _orig.call(this, id);
} as typeof _orig;

// ── Render helpers ───────────────────────────────────────────────────────────
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

function getCover() {
  return require('../app/HomeConversationalCover') as typeof import('../app/HomeConversationalCover');
}

// A ConversationApi parked at the review step. Only the fields the cover reads
// are populated; a partial cast keeps the rest out so the view binds. Overrides
// flip the one field a given test cares about (saveError / doneBeat / saving).
function reviewApi(overrides: Partial<ConversationApi> = {}): ConversationApi {
  const { emptyBeginnerProfile } = require('../lib/profile/beginner-profile') as {
    emptyBeginnerProfile: () => BeginnerProfile;
  };
  const noop = () => undefined;
  const base: Partial<ConversationApi> = {
    profile: emptyBeginnerProfile(),
    step: { id: 'review' },
    messages: [{ from: 'loom', text: "You're all set! Here's what I have." }],
    input: '',
    setInput: noop,
    isTyping: false,
    checking: false,
    saving: false,
    doneBeat: false,
    saveError: '',
    promptText: '',
    inputRef: { current: null },
    bottomRef: { current: null },
    handleSubmit: async () => undefined,
    handleSave: noop,
    goToForm: noop,
  };
  return { ...base, ...overrides } as ConversationApi;
}

function renderWithApi(api: ConversationApi): string {
  mockConversation = api;
  try {
    const { HomeConversationalCover } = getCover();
    return render(<HomeConversationalCover />);
  } finally {
    mockConversation = null;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('HomeConversationalCover: first contact renders the landing hero + input', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);
  const text = visibleText(html);

  // First contact is the product landing: the editorial hero headline is the
  // brand line; the live conversational prompt sits above the answer input.
  assert.match(html, /class="heroHeadline"/);
  assert.match(text, /woven into one self/i);
  assert.match(html, /class="heroPrompt"/);
  assert.ok(text.length > 0);

  // The single answer input must render with its accessible label/placeholder.
  assert.match(html, /Type your answer/i);
  assert.match(html, /aria-label="Your answer"/);

  // The LOOM wordmark sits in the nav.
  assert.match(text, /LOOM/);
});

test('HomeConversationalCover: renders both whisper links (no sign-in)', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);
  const text = visibleText(html);

  assert.match(text, /See an example/i);
  assert.match(html, /href="\/example"/);
  assert.match(text, /Prefer a form\?/i);

  // No sign-in chrome on the cover.
  assert.doesNotMatch(text, /sign in|log in|sign up/i);
});

test('HomeConversationalCover: the constellation field is decorative (aria-hidden)', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);

  // ConstellationField renders an <svg aria-hidden="true"> and the cosmic field
  // div is aria-hidden too — both decorative, none in the a11y tree.
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  assert.match(html, /loom-cosmic-field/);
});

test('HomeConversationalCover: renders without error with no initial state', () => {
  const { HomeConversationalCover } = getCover();
  let html = '';
  assert.doesNotThrow(() => {
    html = render(<HomeConversationalCover />);
  });
  assert.ok(html.length > 0);
});

test('HomeConversationalCover: offers a quiet résumé-import affordance before review', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);
  const text = visibleText(html);

  // A new user can auto-fill from a CV instead of typing — a single quiet
  // "Import a résumé" whisper in the nav line.
  assert.match(text, /Import a résumé/i);

  // It opens the system file picker DIRECTLY — a hidden file input, with no
  // inline panel/format blurb/paste box (the cover stays sparse).
  assert.match(html, /type="file"/);
  assert.doesNotMatch(html, /aria-expanded/);
});

// ── Landing mode: hero + showcase + footer, but NO top nav ────────────────────

test('HomeConversationalCover: a new visitor sees no top nav — conversation only', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);

  // A new user (no profile) is driven purely by the conversation to complete
  // their profile — no top nav bar (no Begin CTA, no nav links) before they're in.
  assert.doesNotMatch(html, /class="nav"/);
  assert.doesNotMatch(visibleText(html), /\bBegin\b/);
});

test('HomeConversationalCover: landing shows the product showcase (sample LOOM)', () => {
  const { HomeConversationalCover } = getCover();
  const text = visibleText(render(<HomeConversationalCover />));

  // Substance via SHOWING a finished LOOM through a fictional persona — never
  // the owner's data. (The capability star-river viz was removed; the persona
  // card + its proof chips carry the "finished LOOM" substance.)
  assert.match(text, /weaving/i);
  assert.match(text, /Maya Chen/);
  assert.match(text, /artifacts verified/i);
});

test('HomeConversationalCover: landing grounds the page with a real footer', () => {
  const { HomeConversationalCover } = getCover();
  const text = visibleText(render(<HomeConversationalCover />));

  assert.match(text, /© 2026/);
  assert.match(text, /Help/);
});

// ── Review / Save branch (the bug: cover ignored c.step → no Save UI) ──────────

test('HomeConversationalCover: at review, shows a Save affordance and hides the chat input', () => {
  const html = renderWithApi(reviewApi());
  const text = visibleText(html);

  // The Save control the cover was missing — completes the flow without looping.
  // (renderToStaticMarkup escapes the & in "Save & see…", so match the tail.)
  assert.match(text, /see my profile/i);

  // The chat input must be gone at review (typing + submit re-appended the same
  // review prompt forever — the endless loop this fix closes).
  assert.doesNotMatch(html, /aria-label="Your answer"/);
  assert.doesNotMatch(html, /Type your answer/i);

  // The résumé import is an answer-time affordance — gone once we reach review
  // (nothing left to pre-fill). This also keeps the cover from reading import
  // fields the review-branch mock intentionally omits.
  assert.doesNotMatch(text, /Import a résumé/i);

  // The form escape is still offered.
  assert.match(text, /Prefer a form\?/i);
});

test('HomeConversationalCover: at review, surfaces a save error', () => {
  const msg = "Couldn't save your profile — your browser is blocking local storage.";
  const html = renderWithApi(reviewApi({ saveError: msg }));

  assert.match(html, /role="alert"/);
  assert.match(visibleText(html), /blocking local storage/i);
});

test('HomeConversationalCover: at review, the done beat replaces the Save button while navigating', () => {
  const html = renderWithApi(reviewApi({ doneBeat: true }));
  const text = visibleText(html);

  assert.match(text, /opening your Digital Me/i);
  // While navigating, the Save button is gone (no double-submit, no flicker).
  assert.doesNotMatch(text, /see my profile/i);
});
