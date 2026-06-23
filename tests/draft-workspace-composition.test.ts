import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Draft page is composed as a professional source-grounded workspace', () => {
  const draftPage = read('app/draft/page.tsx');
  const draftClient = read('app/draft/DraftClient.tsx');
  const globals = read('app/globals.css');
  const draftDeskCss = read('app/draft/draft-evidence-desk.module.css');

  // /draft is now a redirect stub — the editor lives inside /digital-me (?edit mode).
  assert.match(draftPage, /'use client'/);
  assert.match(draftPage, /draftStubTarget/);
  assert.doesNotMatch(draftPage, /title: 'Draft · Loom'/);
  // /draft is a focused workbench, not a browsable page — it carries NO global nav,
  // but it must still offer a quiet way home to Digital Me.
  assert.doesNotMatch(draftClient, /LoomGlobalNav/);
  assert.match(draftClient, /<a className="new-loom-draft__home" href="\/digital-me">/);
  assert.match(draftDeskCss, /\.surface :global\(\.new-loom-draft__home\)/);
  // DraftClient accepts an editId so /digital-me can drive which doc opens (by-id).
  assert.match(draftClient, /editId\??:\s*string/);
  assert.match(draftClient, /selectDraftById\(/);
  // The editor identity rail reflects the CURRENT user (the editor lives inside
  // everyone's Digital Me), not the hardcoded owner.
  assert.doesNotMatch(draftClient, /Yiping Yin/);
  assert.doesNotMatch(draftClient, /yiping-profile-white-shirt/);
  assert.match(draftClient, /readBeginnerProfileLocal/);
  assert.match(draftClient, /Your name/);
  assert.match(draftClient, /<h1 className="new-loom-draft__sr-title">Studio<\/h1>/);
  assert.doesNotMatch(draftClient, /new-loom-draft__wordmark/);
  assert.doesNotMatch(globals, /new-loom-draft__wordmark/);
  assert.match(draftClient, /new-loom-draft__identity-rail/);
  assert.match(draftClient, /new-loom-draft__workspace/);
  assert.match(draftClient, /new-loom-draft__document-header/);
  assert.match(draftClient, /new-loom-draft__editor-shell/);
  assert.match(draftClient, /new-loom-draft__editor-toolbar/);
  // The center editor is a block document, not a single textarea: the
  // editor-shell now hosts DraftBlockEditor wired to the canonical blocks[].
  // (The raw `body` textarea is kept as a collapsed serialization bridge.)
  assert.match(draftClient, /import \{ DraftBlockEditor \} from '\.\/DraftBlockEditor'/);
  assert.match(
    draftClient,
    /<DraftBlockEditor\s+blocks=\{blocks\}\s+onChange=\{handleBlocksChange\}\s*\/>/,
  );
  assert.match(draftClient, /new-loom-draft__proof-strip/);
  assert.match(draftClient, /Answer grounded by/);
  assert.match(draftClient, /Publish answer preview/);
  assert.match(draftClient, /Provenance/);

  assert.match(
    globals,
    /\.new-loom-draft\s*\{[\s\S]*grid-template-columns:\s*minmax\(14rem,\s*17rem\)\s+minmax\(0,\s*1fr\)\s+minmax\(21rem,\s*27rem\)/,
  );
  assert.match(globals, /\.new-loom-draft__identity-rail\s*\{/);
  assert.match(globals, /\.new-loom-draft__document-header\s*\{/);
  assert.match(globals, /\.new-loom-draft__editor-shell\s*\{/);
  assert.match(globals, /\.new-loom-draft__proof-strip\s*\{/);
  assert.match(draftDeskCss, /\.surface :global\(\.new-loom-draft__sr-title\)/);
  assert.match(
    draftDeskCss,
    /new-loom-draft__rail-section\[aria-label="Workspace status"\]\s+ol\)[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(draftDeskCss, /new-loom-draft__rail-section\[aria-label="Workspace status"\]\s+li\)[\s\S]*min-height:\s*4\.6rem/);
});
