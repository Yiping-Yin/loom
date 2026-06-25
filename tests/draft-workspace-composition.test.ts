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
  // The editor reads the CURRENT user's profile (for the starters' avatar), not the
  // hardcoded owner — the editor lives inside everyone's Digital Me.
  assert.doesNotMatch(draftClient, /Yiping Yin/);
  assert.doesNotMatch(draftClient, /yiping-profile-white-shirt/);
  assert.match(draftClient, /readBeginnerProfileLocal/);
  assert.match(draftClient, /<h1 className="new-loom-draft__sr-title">Studio<\/h1>/);
  // The calm header carries no "Studio" labels: the eyebrow kicker + meta row were
  // dropped; the back link + title carry context. The hidden sr-title h1 stays (a11y).
  assert.doesNotMatch(draftClient, /__eyebrow">Studio/);
  assert.doesNotMatch(draftClient, /<span>Studio<\/span>/);
  // The calm empty-state entry (StudioStarters) is wired in and shown when the draft
  // is empty, so a normal user lands on "Add to your Digital Me", not the full editor.
  assert.match(draftClient, /from '\.\/StudioStarters'/);
  assert.match(draftClient, /isEmptyDraft/);
  assert.match(draftClient, /<StudioStarters\b/);
  // The power surface (Inspector) lives in a closed-by-default Details drawer, so the
  // writing surface stays calm until the user asks for the details.
  assert.match(draftClient, /const \[detailsOpen, setDetailsOpen\] = useState\(false\)/);
  assert.match(draftClient, /new-loom-draft__details/);
  assert.match(draftClient, /aria-expanded=\{detailsOpen\}/);
  assert.match(draftDeskCss, /\.surface :global\(\.new-loom-draft__details\)/);
  assert.doesNotMatch(draftClient, /new-loom-draft__wordmark/);
  assert.doesNotMatch(globals, /new-loom-draft__wordmark/);
  // The always-on identity rail is gone — a calm single column, no 3-panel grid.
  assert.doesNotMatch(draftClient, /new-loom-draft__identity-rail/);
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
  // The dense default header (OUTPUT chips + proof strip + jargon) is gone; the calm
  // header is a slim top bar + a quiet grounding line + a soft "Help me write".
  assert.match(draftClient, /new-loom-draft__topbar/);
  assert.match(draftClient, /Help me write/);
  assert.match(draftClient, /new-loom-draft__grounding/);
  assert.match(draftClient, /Backed by/);
  assert.doesNotMatch(draftClient, /new-loom-draft__type-rail/);
  assert.doesNotMatch(draftClient, /new-loom-draft__proof-strip/);
  assert.doesNotMatch(draftClient, /Source-grounded writing/);
  // The power features (answer publishing, provenance) still exist — in Details.
  assert.match(draftClient, /Publish answer preview/);
  assert.match(draftClient, /Provenance/);

  assert.doesNotMatch(globals, /grid-template-columns:\s*minmax\(14rem,\s*17rem\)/);
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
