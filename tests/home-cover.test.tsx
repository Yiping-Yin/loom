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

// ── CSS module stub (must precede the first require of the component) ─────────
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(require.extensions as any)['.css'] = (mod: { exports: typeof cssModuleExports }) => {
  mod.exports = cssModuleExports;
};

// ── Dependency stubs (installed before the component is first require()'d) ────
const _orig = (Module.prototype as NodeJS.Module).require as (id: string) => unknown;

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

// ── Tests ────────────────────────────────────────────────────────────────────

test('HomeConversationalCover: renders the living prompt and the input', () => {
  const { HomeConversationalCover } = getCover();
  const html = render(<HomeConversationalCover />);
  const text = visibleText(html);

  // The first scripted LOOM prompt is the locus before any message.
  assert.match(html, /class="prompt"/);
  assert.ok(text.length > 0);

  // The single answer input must render with its accessible label/placeholder.
  assert.match(html, /Tell me about yourself/i);
  assert.match(html, /aria-label="Your answer"/);

  // The LOOM wordmark sits at the top.
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
