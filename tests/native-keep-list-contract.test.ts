import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Stage 3 keep-list: these registrations are LOAD-BEARING for the capture
// chain (Services entry, loom:// scheme, document types, XPC anchor helper).
// They are pinned BEFORE any cull commit so a deletion can never silently
// break fresh-install capture (framework doc §5 frozen boundary).

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath: string): string {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const INFO_PLIST = 'macos-app/Loom/Info.plist';
const PROJECT_YML = 'macos-app/Loom/project.yml';

test('Info.plist keeps the Capture Selection NSService with the ⌘⇧U key equivalent', () => {
  const plist = read(INFO_PLIST);

  assert.match(plist, /<key>NSServices<\/key>/);
  assert.match(
    plist,
    /<key>NSKeyEquivalent<\/key>\s*<dict>\s*<key>default<\/key>\s*<string>U<\/string>/,
  );
  assert.match(
    plist,
    /<key>NSMenuItem<\/key>\s*<dict>\s*<key>default<\/key>\s*<string>Capture Selection in Loom<\/string>/,
  );
  assert.match(plist, /<key>NSMessage<\/key>\s*<string>captureSelectionInLoom<\/string>/);
  assert.match(plist, /<key>NSPortName<\/key>\s*<string>Loom<\/string>/);
  assert.match(plist, /<string>public\.utf8-plain-text<\/string>/);
  assert.match(plist, /<string>public\.file-url<\/string>/);
});

test('Info.plist keeps the loom:// URL scheme registration', () => {
  const plist = read(INFO_PLIST);

  assert.match(plist, /<key>CFBundleURLTypes<\/key>/);
  assert.match(
    plist,
    /<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>loom<\/string>/,
  );
});

test('Info.plist keeps the PDF, Word, and Excel document types', () => {
  const plist = read(INFO_PLIST);

  assert.match(plist, /<key>CFBundleDocumentTypes<\/key>/);
  assert.match(plist, /<string>com\.adobe\.pdf<\/string>/);
  assert.match(plist, /<string>org\.openxmlformats\.wordprocessingml\.document<\/string>/);
  assert.match(plist, /<string>org\.openxmlformats\.spreadsheetml\.sheet<\/string>/);
});

test('project.yml keeps the LoomAnchorHelper xpc-service target', () => {
  const projectYml = read(PROJECT_YML);

  const targetIndex = projectYml.indexOf('LoomAnchorHelper:');
  assert.ok(targetIndex !== -1, 'LoomAnchorHelper target missing from project.yml');

  const targetBlock = projectYml.slice(targetIndex, targetIndex + 600);
  assert.match(targetBlock, /type:\s*xpc-service/);
  assert.match(targetBlock, /PRODUCT_BUNDLE_IDENTIFIER:\s*com\.yinyiping\.loom\.AnchorHelper/);

  assert.match(projectYml, /target:\s*LoomAnchorHelper/);
});
