/**
 * Charter §22 tripwire: the document types the app REGISTERS with Launch
 * Services (project.yml → Info.plist CFBundleDocumentTypes) must stay in
 * lockstep with the types the in-app importer ACCEPTS
 * (nativeFileImporterContentTypes() in IngestionView.swift). Drift means
 * dragging a file onto the Dock icon silently diverges from File-panel
 * import — the exact bug this pins down.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

// Extension (importer side) ↔ UTI (Launch Services side) pairs that must
// both be present. When either side gains a member of the pair without the
// other, this test fails and names the missing half.
const PAIRS: Array<{ ext: string; uti: string }> = [
  { ext: 'pdf', uti: 'com.adobe.pdf' },
  { ext: 'rtf', uti: 'public.rtf' },
  { ext: 'docx', uti: 'org.openxmlformats.wordprocessingml.document' },
  { ext: 'doc', uti: 'com.microsoft.word.doc' },
  { ext: 'xlsx', uti: 'org.openxmlformats.spreadsheetml.sheet' },
  { ext: 'xls', uti: 'com.microsoft.excel.xls' },
  { ext: 'pptx', uti: 'org.openxmlformats.presentationml.presentation' },
  { ext: 'ppt', uti: 'com.microsoft.powerpoint.ppt' },
  { ext: 'md', uti: 'net.daringfireball.markdown' },
  { ext: 'rtfd', uti: 'com.apple.rtfd' },
  { ext: 'csv', uti: 'public.comma-separated-values-text' },
  { ext: 'tsv', uti: 'public.tab-separated-values-text' },
  { ext: 'pages', uti: 'com.apple.iwork.pages.pages' },
  { ext: 'key', uti: 'com.apple.iwork.keynote.key' },
];

test('Launch Services document types stay in lockstep with the in-app importer', () => {
  const projectYml = read('macos-app/Loom/project.yml');
  const ingestion = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');

  const fnStart = ingestion.indexOf('func nativeFileImporterContentTypes()');
  assert.ok(fnStart >= 0, 'nativeFileImporterContentTypes() must exist in IngestionView.swift');
  const fnEnd = ingestion.indexOf('\n}', fnStart);
  assert.ok(fnEnd > fnStart, 'importer function must close');
  const fnBody = ingestion.slice(fnStart, fnEnd);

  for (const { ext, uti } of PAIRS) {
    const importerHas =
      fnBody.includes(`"${ext}"`) ||
      // pdf/rtf ride on the UTType static members rather than extensions.
      (ext === 'pdf' && fnBody.includes('.pdf')) ||
      (ext === 'rtf' && fnBody.includes('.rtf'));
    assert.ok(importerHas, `importer accepts .${ext} (add to nativeFileImporterContentTypes or drop ${uti} from project.yml)`);
    assert.ok(
      projectYml.includes(`- ${uti}`),
      `project.yml LSItemContentTypes must register ${uti} (importer accepts .${ext})`,
    );
  }
});

test('generic text and image UTIs stay registered', () => {
  const projectYml = read('macos-app/Loom/project.yml');
  for (const uti of ['public.text', 'public.plain-text', 'public.image']) {
    assert.ok(projectYml.includes(`- ${uti}`), `project.yml must keep ${uti}`);
  }
});
