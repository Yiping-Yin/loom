import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const home = os.homedir();
const defaultAppPath = path.join(home, 'Applications', 'Loom.app');
const appPath = process.env.LOOM_APP_PATH
  ? path.resolve(process.env.LOOM_APP_PATH)
  : defaultAppPath;
const defaultPdf = path.join(
  home,
  'Desktop',
  'Private Wiki',
  'UNSW',
  'MATH 2991',
  'W 1',
  'Week 1 Notes.pdf',
);
const pdfPath = process.env.LOOM_NATIVE_PDF ?? defaultPdf;
const pdfTitle = path.basename(pdfPath);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = process.env.LOOM_NATIVE_VERIFY_DIR
  ? path.resolve(process.env.LOOM_NATIVE_VERIFY_DIR)
  : path.join(repoRoot, '.codex', 'native-sidecar-verify');
const preferencePlistPaths = [
  path.join(home, 'Library', 'Containers', 'com.yinyiping.loom', 'Data', 'Library', 'Preferences', 'com.yinyiping.loom.plist'),
  path.join(home, 'Library', 'Preferences', 'com.yinyiping.loom.plist'),
];
const snapshotMirrorPaths = [
  path.join(
    home,
    'Library',
    'Containers',
    'com.yinyiping.loom',
    'Data',
    'Library',
    'Application Support',
    'Loom',
    'reflection-workspace-snapshot.json',
  ),
  path.join(home, 'Library', 'Application Support', 'Loom', 'reflection-workspace-snapshot.json'),
];
const screenshotDir = path.join(workDir, 'screenshots');
const takeScreenshots = process.argv.includes('--screenshots');
const reportOnly = process.argv.includes('--report-only');
const preflightOnly = process.argv.includes('--preflight');
const serviceCaptureOnly = process.argv.includes('--service-capture-only');
const currentSnapshotPath = path.join(workDir, 'current-snapshot.json');
const reportJsonPath = path.join(workDir, 'learning-experiment-report.json');
const reportMarkdownPath = path.join(workDir, 'learning-experiment-report.md');
const learningOutputPacketMarkdownPath = path.join(workDir, 'learning-output-packet.md');
const learningOutputPacketHtmlPath = path.join(workDir, 'learning-output-packet.html');
const learningOutputPacketPdfPath = path.join(workDir, 'learning-output-packet.pdf');
const learningOutputPacketPdfSourceHashPath = `${learningOutputPacketPdfPath}.source.sha256`;
const preflightJsonPath = path.join(workDir, 'native-sidecar-preflight.json');
const computerUseReadbackPath = path.join(workDir, 'computer-use-readback.json');
const defaultsExportTimeoutMs = 2500;
const swiftHelperTimeoutMs = 5000;
const snapshotHelperTimeoutMs = 1500;
let cachedPdfLearningSelections = null;

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: '/bin/zsh',
  }).trim();
}

function safeRun(command) {
  try {
    return {
      ok: true,
      output: run(command),
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error?.stdout ?? error?.message ?? error),
    };
  }
}

function firstPdfPageText(target = pdfPath) {
  if (!existsSync(target)) return '';
  try {
    return execFileSync('pdftotext', ['-layout', '-f', '1', '-l', '1', target, '-'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch {
    return '';
  }
}

function normalizedPdfLearningText(raw) {
  return String(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^file:\/\//i.test(line))
    .filter((line) => !/^\d+\/\d+\/\d+,/.test(line))
    .filter((line) => !/^Page \d+/i.test(line))
    .join(' ')
    .replace(/[▪•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceCandidates(text) {
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .map((candidate) => candidate.replace(/\s+/g, ' ').trim())
    .filter((candidate) => candidate.length >= 50 && candidate.length <= 260)
    .filter((candidate) => !/^Source:/i.test(candidate))
    .filter((candidate) => !/^Learning Objectives\b/i.test(candidate))
    .filter((candidate) => !/^Agenda\b/i.test(candidate));
}

function selectPdfLearningSentence(text) {
  const conceptSentence = String(text).match(/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+[–-]\s+[^.]{40,220}\./);
  if (conceptSentence) return conceptSentence[0].replace(/\s+/g, ' ').trim();

  const candidates = sentenceCandidates(text);
  return candidates.find((candidate) => {
    return /\b(involves|using|is|are|enables|allows|plays|helps|means|describes|explains|identif(?:y|ies))\b/i.test(candidate);
  }) ?? candidates[0] ?? 'The selected PDF passage needs a first-pass meaning check.';
}

function selectPdfLearningPhrase(sentence, text) {
  const concept = String(text).match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\s+[–-]\s+/);
  if (concept?.[1]) return concept[1].trim();

  const preferred = String(sentence).match(
    /\b((?:quantitative|algorithmic|financial|market|risk|trading|conscious|statistical|mathematical)\s+[A-Za-z]+)\b/i,
  );
  if (preferred?.[1]) return preferred[1].trim();

  const phrase = String(sentence).match(/\b([A-Za-z]{5,}\s+[A-Za-z]{5,})\b/);
  return phrase?.[1]?.trim() ?? 'selected phrase';
}

function pdfLearningSelections() {
  if (cachedPdfLearningSelections) return cachedPdfLearningSelections;
  const text = normalizedPdfLearningText(firstPdfPageText(pdfPath));
  const sentence = selectPdfLearningSentence(text);
  const phrase = selectPdfLearningPhrase(sentence, text);
  cachedPdfLearningSelections = { sentence, phrase, page: 1 };
  return cachedPdfLearningSelections;
}

function isConsoleLocked() {
  const output = run('/usr/sbin/ioreg -n Root -d1 | /usr/bin/grep -E "IOConsoleLocked|CGSSessionScreenIsLocked" || true');
  return /IOConsoleLocked"? = Yes/.test(output) || /CGSSessionScreenIsLocked"?=Yes/.test(output);
}

function assertConsoleUnlocked() {
  if (!isConsoleLocked()) return;
  throw new Error(
    [
      'Native sidecar verification requires an unlocked macOS session.',
      'Current state: IOConsoleLocked = Yes.',
      'Unlock the Mac, keep Preview/Word/Excel usable as the front surfaces, then rerun:',
      '  npm run verify:native-sidecar -- --screenshots',
    ].join('\n'),
  );
}

function osascript(statement) {
  return execFileSync('/usr/bin/osascript', ['-e', statement], {
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function stopRunningLoom() {
  try {
    execFileSync('/usr/bin/pkill', ['-x', 'Loom'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    sleepMs(400);
  } catch {
    // No running Loom process is fine; the verifier only needs a fresh one.
  }
}

function openAppBundle(target) {
  return execFileSync('/usr/bin/open', [target], {
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function openFileWithLoom(target) {
  return execFileSync('/usr/bin/open', ['-a', appPath, target], {
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function swift(file, args = [], options = {}) {
  return execFileSync('/usr/bin/swift', [file, ...args], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: options.timeout ?? swiftHelperTimeoutMs,
  }).trim();
}

function writeHelpers() {
  mkdirSync(workDir, { recursive: true });
  mkdirSync(screenshotDir, { recursive: true });

  writeFileSync(
    path.join(workDir, 'service-capture.swift'),
    `import AppKit
import Foundation

let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.count >= 1 else {
    fputs("usage: service-capture <text> [file...]\\n", stderr)
    exit(2)
}

let text = arguments[0]
let filePaths = arguments.dropFirst()
let pasteboard = NSPasteboard.general
pasteboard.clearContents()

let textItem = NSPasteboardItem()
textItem.setString(text, forType: .string)
textItem.setString(text, forType: NSPasteboard.PasteboardType("public.utf8-plain-text"))

let urls = filePaths.map { URL(fileURLWithPath: $0) as NSURL }
let objects: [NSPasteboardWriting] = [textItem] + urls
pasteboard.writeObjects(objects)

let ok = NSPerformService("Capture Selection in Loom", pasteboard)
print("ok=\\(ok)")
`,
  );

  writeFileSync(
    path.join(workDir, 'onscreen-windows.swift'),
    `import CoreGraphics
import Foundation

let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] ?? []
for window in windows {
    let owner = window[kCGWindowOwnerName as String] as? String ?? ""
    let name = window[kCGWindowName as String] as? String ?? ""
    guard owner.localizedCaseInsensitiveContains("Loom")
        || owner.localizedCaseInsensitiveContains("Preview")
        || owner.localizedCaseInsensitiveContains("Word")
        || owner.localizedCaseInsensitiveContains("Excel")
    else { continue }

    let id = window[kCGWindowNumber as String] as? Int ?? 0
    let layer = window[kCGWindowLayer as String] as? Int ?? 0
    let bounds = window[kCGWindowBounds as String] as? [String: Any] ?? [:]
    let x = bounds["X"] as? Int ?? 0
    let y = bounds["Y"] as? Int ?? 0
    let width = bounds["Width"] as? Int ?? 0
    let height = bounds["Height"] as? Int ?? 0
    print("\\(id)\\t\\(owner)\\t\\(layer)\\t\\(x),\\(y),\\(width)x\\(height)\\t\\(name)")
}
`,
  );

  writeFileSync(
    path.join(workDir, 'reflection-snapshot.swift'),
    `import Foundation

let arguments = Array(CommandLine.arguments.dropFirst())
guard let plistPath = arguments.first else {
    fputs("usage: reflection-snapshot <exported-defaults.plist>\\n", stderr)
    exit(2)
}

let url = URL(fileURLWithPath: plistPath)
guard let plistData = try? Data(contentsOf: url),
      let plist = try? PropertyListSerialization.propertyList(from: plistData, options: [], format: nil) as? [String: Any],
      let data = plist["loom.reflectionWorkspaceSnapshot"] as? Data,
      let json = String(data: data, encoding: .utf8) else {
    fputs("reflection snapshot not found\\n", stderr)
    exit(1)
}
print(json)
`,
  );

  writeFileSync(
    path.join(workDir, 'reflection-write-snapshot.swift'),
    `import Foundation

let arguments = Array(CommandLine.arguments.dropFirst())
guard let jsonPath = arguments.first else {
    fputs("usage: reflection-write-snapshot <snapshot-json> [plist...] [--mirror mirror-json...]\\n", stderr)
    exit(2)
}

let jsonURL = URL(fileURLWithPath: jsonPath)
guard let data = try? Data(contentsOf: jsonURL),
      JSONSerialization.isValidJSONObject((try? JSONSerialization.jsonObject(with: data)) as Any) else {
    fputs("invalid reflection snapshot json\\n", stderr)
    exit(1)
}

let markerIndex = arguments.firstIndex(of: "--mirror")
let plistPaths: [String]
let mirrorPaths: [String]
if let markerIndex {
    plistPaths = Array(arguments.dropFirst().prefix(markerIndex - 1))
    mirrorPaths = Array(arguments.dropFirst(markerIndex + 1))
} else {
    plistPaths = Array(arguments.dropFirst())
    mirrorPaths = []
}

UserDefaults.standard.set(data, forKey: "loom.reflectionWorkspaceSnapshot")
UserDefaults.standard.synchronize()

var plistWrites = 0
for plistPath in plistPaths {
    let plistURL = URL(fileURLWithPath: plistPath)
    let plistDirectory = plistURL.deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: plistDirectory, withIntermediateDirectories: true)

    var plist: [String: Any] = [:]
    if let existing = try? Data(contentsOf: plistURL),
       let decoded = try? PropertyListSerialization.propertyList(from: existing, options: [], format: nil) as? [String: Any] {
        plist = decoded
    }
    plist["loom.reflectionWorkspaceSnapshot"] = data
    if let encoded = try? PropertyListSerialization.data(fromPropertyList: plist, format: .binary, options: 0) {
        try? encoded.write(to: plistURL, options: .atomic)
        plistWrites += 1
    }
}

var mirrorWrites = 0
for mirrorPath in mirrorPaths {
    let mirrorURL = URL(fileURLWithPath: mirrorPath)
    let mirrorDirectory = mirrorURL.deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: mirrorDirectory, withIntermediateDirectories: true)
    do {
        try data.write(to: mirrorURL, options: .atomic)
        mirrorWrites += 1
    } catch {}
}

print("ok=true plistWrites=\\(plistWrites) mirrorWrites=\\(mirrorWrites)")
`,
  );
}

function requirePath(label, target) {
  if (!existsSync(target)) {
    throw new Error(`${label} not found: ${target}`);
  }
}

function assertIncludes(label, haystack, needle) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label} did not include ${needle}\n${haystack}`);
  }
}

function assertServiceCapture(label, text, filePath) {
  let output = '';
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    try {
      output = swift(path.join(workDir, 'service-capture.swift'), [text, filePath]);
      assertIncludes(label, output, 'ok=true');
      return;
    } catch (error) {
      output = String(error?.stdout ?? error?.message ?? error);
      sleepMs(250);
    }
  }
  throw new Error(`${label}: Capture Selection in Loom did not accept the pasteboard\n${output}`);
}

function readWindows() {
  return swift(path.join(workDir, 'onscreen-windows.swift'));
}

function frontmostAppName() {
  return osascript('tell application "System Events" to get name of first application process whose frontmost is true');
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function companionWindow(windows) {
  return windows
    .split('\n')
    .find((line) => line.includes('\tLoom\t3\t') && line.includes('\tLoom Companion'));
}

function nativeSurfaceTimeoutMs(owner) {
  return owner.startsWith('Microsoft ') ? 18000 : 10000;
}

function assertCompanion(label) {
  let windows = '';
  let companion;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4000) {
    windows = readWindows();
    companion = companionWindow(windows);
    if (companion) break;
    sleepMs(150);
  }
  if (!companion) {
    throw new Error(`${label}: Loom saved receipt was not visible\n${windows}`);
  }
  if (!/27[0-9]x6[0-9]/.test(companion)) {
    throw new Error(`${label}: Loom saved receipt should remain a tiny transient HUD, not a modal card\n${companion}`);
  }
  return { windows, companion };
}

function assertReceiptDoesNotPersist(label) {
  const startedAt = Date.now();
  let latestWindows = readWindows();
  while (Date.now() - startedAt < 6200) {
    sleepMs(250);
    latestWindows = readWindows();
  }
  const loomLines = latestWindows
    .split('\n')
    .filter((line) => line.includes('\tLoom\t'));
  const nonCompanion = loomLines.filter((line) => !line.includes('\tLoom Companion'));
  if (nonCompanion.length > 0) {
    throw new Error(`${label}: Loom left a persistent workspace over the native file\n${nonCompanion.join('\n')}`);
  }
  const companionStillVisible = loomLines.some((line) => line.includes('\tLoom Companion'));
  if (companionStillVisible) {
    throw new Error(`${label}: Loom saved receipt should auto-dismiss instead of staying open\n${loomLines.join('\n')}`);
  }
}

function assertNativeSurface(label, windows, owner, nameFragment) {
  let latestWindows = windows;
  let line;
  const startedAt = Date.now();
  const timeout = nativeSurfaceTimeoutMs(owner);
  while (Date.now() - startedAt < timeout) {
    line = latestWindows
      .split('\n')
      .find((entry) => {
        return entry.includes(`\t${owner}\t`) && (!nameFragment || entry.includes(nameFragment));
      });
    if (line) break;
    sleepMs(250);
    latestWindows = readWindows();
  }
  if (!line) {
    throw new Error(`${label}: expected native ${owner} surface to remain visible\n${latestWindows}`);
  }
  return line;
}

function assertLoomIsNotFrontmost(label) {
  let actual = '';
  const startedAt = Date.now();
  while (Date.now() - startedAt < 1200) {
    actual = frontmostAppName();
    if (actual !== 'Loom') return;
    sleepMs(150);
  }
  throw new Error(`${label}: Loom must not become the frontmost app during native-file learning`);
}

function assertLoomStaysCompanion(label, windows) {
  let latestWindows = windows;
  let nonCompanion = [];
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3000) {
    const loomLines = latestWindows
      .split('\n')
      .filter((line) => line.includes('\tLoom\t'));
    nonCompanion = loomLines.filter((line) => !line.includes('\tLoom Companion'));
    if (nonCompanion.length === 0) return;
    sleepMs(150);
    latestWindows = readWindows();
  }
  throw new Error(`${label}: Loom should not leave a full workspace over the native file during learning\n${nonCompanion.join('\n')}`);
}

function captureCompanion(label, companion) {
  if (!takeScreenshots) return;
  const windowID = companion.split('\t')[0];
  const target = path.join(screenshotDir, `${label}.png`);
  run(`/usr/sbin/screencapture -l ${windowID} ${JSON.stringify(target)}`);
  console.log(`screenshot=${target}`);
}

function readReflectionSnapshot() {
  let lastError;
  const startedAt = Date.now();
  const exportPath = path.join(workDir, 'loom-defaults-export.plist');
  while (Date.now() - startedAt < 7000) {
    try {
      for (const plistPath of preferencePlistPaths) {
        if (!existsSync(plistPath)) continue;
        try {
          const output = swift(path.join(workDir, 'reflection-snapshot.swift'), [plistPath], {
            timeout: snapshotHelperTimeoutMs,
          });
          return JSON.parse(output);
        } catch (error) {
          lastError = error;
        }
      }
      for (const mirrorPath of snapshotMirrorPaths) {
        if (!existsSync(mirrorPath)) continue;
        try {
          return JSON.parse(readFileSync(mirrorPath, 'utf8'));
        } catch (error) {
          lastError = error;
        }
      }
      rmSync(exportPath, { force: true });
      execFileSync('/usr/bin/defaults', ['export', 'com.yinyiping.loom', exportPath], {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: defaultsExportTimeoutMs,
      });
      const output = swift(path.join(workDir, 'reflection-snapshot.swift'), [exportPath]);
      return JSON.parse(output);
    } catch (error) {
      lastError = error;
      sleepMs(150);
    }
  }
  const detail = String(lastError?.stderr ?? lastError?.stdout ?? lastError?.message ?? lastError ?? '').trim();
  throw new Error(
    [
      'reflection snapshot was not readable',
      `snapshot mirror candidates: ${snapshotMirrorPaths.join(', ')}`,
      `direct plist candidates: ${preferencePlistPaths.join(', ')}`,
      `snapshot helper timeout: ${snapshotHelperTimeoutMs}ms`,
      `defaults export timeout: ${defaultsExportTimeoutMs}ms`,
      `domain: com.yinyiping.loom`,
      `export path: ${exportPath}`,
      detail ? `last error: ${detail}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

function writeReflectionSnapshot(snapshot) {
  const target = path.join(workDir, 'restored-reflection-snapshot.json');
  writeFileSync(target, JSON.stringify(snapshot, null, 2));
  const output = swift(path.join(workDir, 'reflection-write-snapshot.swift'), [
    target,
    ...preferencePlistPaths,
    '--mirror',
    ...snapshotMirrorPaths,
  ]);
  assertIncludes('Reflection snapshot restore', output, 'ok=true');
}

function readReflectionSnapshotOrNull(label) {
  try {
    return readReflectionSnapshot();
  } catch (error) {
    const detail = String(error?.message ?? error).split('\n')[0] ?? 'unknown error';
    console.warn(`${label}: could not read current Loom snapshot before verification; cleanup will be best-effort (${detail})`);
    return null;
  }
}

function writePreRunSnapshot(snapshot) {
  if (!snapshot) return;
  writeFileSync(path.join(workDir, 'pre-run-reflection-snapshot.json'), JSON.stringify(snapshot, null, 2));
}

function restoreUserSnapshot(snapshot, label) {
  if (!snapshot) return;
  try {
    stopRunningLoom();
    writeReflectionSnapshot(snapshot);
    console.log(`restoredUserSnapshot=${label}`);
  } catch (error) {
    const detail = String(error?.message ?? error).split('\n')[0] ?? 'unknown error';
    console.warn(`${label}: failed to restore pre-run Loom snapshot; inspect ${path.join(workDir, 'pre-run-reflection-snapshot.json')} (${detail})`);
  }
}

function withRestoredUserSnapshot(label, task) {
  const preRunSnapshot = readReflectionSnapshotOrNull(label);
  writePreRunSnapshot(preRunSnapshot);
  try {
    return task();
  } finally {
    restoreUserSnapshot(preRunSnapshot, label);
  }
}

function restoreSnapshotFocusToPdf(snapshot) {
  const cases = Array.isArray(snapshot?.cases) ? [...snapshot.cases] : [];
  const pdfCaseIndex = cases.findIndex((reflectionCase) => reflectionCase?.title === pdfTitle);
  if (pdfCaseIndex < 0) return snapshot;

  const [pdfCase] = cases.splice(pdfCaseIndex, 1);
  const selectedSource =
    (Array.isArray(pdfCase.sources)
      ? pdfCase.sources.find((source) => source?.label === pdfTitle || source?.fileURL === pathToFileURL(pdfPath).href)
      : null) ?? pdfCase.sources?.[0];

  return {
    ...snapshot,
    cases: [pdfCase, ...cases],
    selectedCaseID: pdfCase.id,
    selectedSourceID: selectedSource?.id ?? null,
  };
}

function persistPdfFocusedSnapshot(snapshot) {
  const restored = restoreSnapshotFocusToPdf(snapshot);
  writeFileSync(currentSnapshotPath, JSON.stringify(restored, null, 2));
  writeReflectionSnapshot(restored);
  return restored;
}

function readSnapshotForReport() {
  if (existsSync(currentSnapshotPath)) {
    return JSON.parse(readFileSync(currentSnapshotPath, 'utf8'));
  }
  try {
    return readReflectionSnapshot();
  } catch (error) {
    throw error;
  }
}

function reportOnlySource(id, folder, label, kind, meta, excerpt, filePath = null) {
  return {
    id,
    folder,
    label,
    kind,
    meta,
    excerpt,
    fileURL: filePath ? pathToFileURL(filePath).href : null,
  };
}

function reportOnlyStep(id, title, subtitle, items) {
  return { id, title, subtitle, items };
}

function reportOnlyMessage(id, eyebrow, body, role = 'loom') {
  return {
    id,
    eyebrow,
    body,
    role: role === 'human' ? { human: {} } : { loom: {} },
  };
}

function reportOnlyLearningCase({ id, title, filePath, sourceKind, meta, input, focusSummary, traceType }) {
  const sourceAnchor = /\.pdf$/i.test(title) ? `${title}, page 1` : title;
  const versionCount = input.filter((item) => String(item).startsWith('Captured ')).length;
  return {
    id,
    title,
    project: 'Learning pass',
    status: 'Second pass ready',
    updatedAt: 'report-only',
    summary: `Report-only learning fixture for ${title}.`,
    tags: ['learning', 'report-only', sourceKind],
    sources: [
      reportOnlySource(
        `${id}-source`,
        'Original file',
        title,
        sourceKind,
        meta,
        input.find((item) => String(item).startsWith('Captured ')) ?? `Opened ${title}.`,
        filePath,
      ),
    ],
    steps: [
      reportOnlyStep('input', 'Input', 'What was captured', input),
      reportOnlyStep('assumption', 'Assumption', 'What had to be true', [
        'First-pass learning is not final understanding; raw captures need review before they become reusable thinking.',
      ]),
      reportOnlyStep('decision', 'Decision Trace', 'Why this path won', [
        `Kept the original file surface primary and used Loom only to commit anchored traces from ${title}.`,
      ]),
      reportOnlyStep('outcome', 'Outcome', 'What reality returned', [
        `Captured ${versionCount} anchored learning trace${versionCount === 1 ? '' : 's'} from ${title}.`,
      ]),
      reportOnlyStep('reflection', 'Reflection', 'What changed in judgment', [
        focusSummary,
        'Second-pass synthesis: compare versions, correct meanings, then separate language understanding from domain knowledge.',
      ]),
      reportOnlyStep('memory', 'Judgment Memory', 'What should be reused', []),
    ],
    messages: [
      reportOnlyMessage(`${id}-m1`, 'Learning trace', [
        `Pass: ${reportOnlyPassLabel(traceType)}`,
        `Learning focus: ${focusSummary.replace(/:.+$/, '').toLowerCase()}`,
        `Trace type: ${traceType}`,
        `Source anchor: ${sourceAnchor}`,
        'Second-pass synthesis prepared from anchored learning traces.',
      ].join('\n')),
    ],
  };
}

function reportOnlyPassLabel(traceType) {
  if (/spreadsheet/i.test(traceType)) return 'data reading pass';
  if (/document|slide|text/i.test(traceType)) return 'source comprehension pass';
  return 'first language pass';
}

function reportOnlyAnchorPrecision({ app, window, kind, file, anchorPrecision }) {
  if (anchorPrecision) return anchorPrecision;
  // Report-only fixtures are allowed to prove that a file was configured, but
  // they must not promote a page/cell claim that only a native app, helper, or
  // user-confirmed capture can prove.
  if (file) return 'file';
  if (window && /pdf/i.test(kind) && /page\s+\d+/i.test(String(window))) return 'window+page';
  if (window) return 'window+time';
  if (app) return 'app+time';
  return 'unknown';
}

function reportOnlyAnchorNote(precision) {
  const normalized = String(precision ?? '').trim().toLowerCase();
  if (normalized === 'file') return 'file confirmed; page or cell not promoted in report-only mode';
  if (normalized === 'window+page') return 'medium: page inferred from window title';
  if (normalized === 'window+time' || normalized === 'app+time') return 'weak: precise file, page, or cell unavailable';
  if (normalized === 'unknown') return 'weak: source app unavailable';
  return null;
}

function evidenceRungForPrecision(precision) {
  const normalized = String(precision ?? '').trim().toLowerCase();
  if (normalized === 'file+cell') return 'selected text + file + cell';
  if (normalized === 'file+page') return 'selected text + file + page';
  if (normalized === 'file') return 'selected text + file';
  if (normalized === 'window+page') return 'selected text + window + page';
  if (normalized === 'window' || normalized === 'window+time') return 'selected text + window + time';
  if (normalized === 'app' || normalized === 'app+time') return 'selected text + app + time';
  return 'selected text only';
}

function fallbackNoteForPrecision(precision) {
  const normalized = String(precision ?? '').trim().toLowerCase();
  if (normalized === 'file+cell' || normalized === 'file+page' || normalized === 'file') return null;
  if (normalized === 'window+page') return 'verify source file before promoting this capture';
  if (normalized === 'window' || normalized === 'window+time' || normalized === 'app' || normalized === 'app+time' || normalized === 'unknown') {
    return 'use appshot, OCR, Vision, or manual confirmation before promoting';
  }
  return 'label precision before promoting';
}

function reportOnlyEvidence({ app, window, kind, file, bundle, anchorPrecision }) {
  const precision = reportOnlyAnchorPrecision({ app, window, kind, file, anchorPrecision });
  return [
    ['app', app],
    ['window', window],
    ['kind', kind],
    ['file', file],
    ['bundle', bundle],
    ['anchor precision', precision],
    ['evidence rung', evidenceRungForPrecision(precision)],
    ['anchor note', reportOnlyAnchorNote(precision)],
    ['fallback note', fallbackNoteForPrecision(precision)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}=${String(value).replace(/\n/g, ' ').replace(/;/g, ',')}`)
    .join('; ');
}

function reportOnlySnapshot(baseSnapshot, fixtures = {}) {
  const snapshot = baseSnapshot && Array.isArray(baseSnapshot.cases)
    ? { ...baseSnapshot, cases: [...baseSnapshot.cases] }
    : { cases: [], selectedCaseID: null, selectedSourceID: null };
  const pdfSelection = pdfLearningSelections();
  const confirmedMeaning =
    /quantitative analysis/i.test(pdfSelection.phrase)
      ? 'Meaning confirmed Quantitative analysis is not generic data analysis; it uses mathematical models and statistical techniques to identify trading opportunities. It is a research method, not a trading strategy by itself.'
      : `Meaning confirmed ${pdfSelection.phrase} is the current concept to explain in your own words before promoting it to reusable memory.`;
  const pdfCase = reportOnlyLearningCase({
    id: 'report-only-pdf-learning',
    title: pdfTitle,
    filePath: pdfPath,
    sourceKind: 'pdf',
    meta: 'page 1',
    traceType: 'PDF passage',
    focusSummary: `User-confirmed meaning: ${cleanConfirmedMeaning(confirmedMeaning)}`,
    input: [
      `Opened original file for learning: ${pdfTitle}.`,
      'First language pass: keep the original file surface primary and capture vocabulary, pronunciation, phrases, sentence meaning, grammar, questions, concepts, and page context as anchored traces.',
      `Captured PDF passage from ${pdfTitle}, page ${pdfSelection.page} [sentence meaning]: ${pdfSelection.sentence}\nEvidence: ${reportOnlyEvidence({ app: 'Preview', window: `${pdfTitle} Page ${pdfSelection.page}`, kind: 'pdf', file: pdfTitle, bundle: 'com.apple.Preview' })}`,
      `Captured PDF passage from ${pdfTitle}, page ${pdfSelection.page} [phrase meaning]: ${pdfSelection.phrase}\nEvidence: ${reportOnlyEvidence({ app: 'Preview', window: `${pdfTitle} Page ${pdfSelection.page}`, kind: 'pdf', file: pdfTitle, bundle: 'com.apple.Preview' })}`,
      `Captured user trace from ${pdfTitle}, page ${pdfSelection.page} [user meaning]: ${confirmedMeaning}`,
    ],
  });
  const wordTitle = 'Loom Word Learning Notes.docx';
  const wordCase = reportOnlyLearningCase({
    id: 'report-only-word-learning',
    title: wordTitle,
    filePath: fixtures.docx,
    sourceKind: 'document',
    meta: 'document selection',
    traceType: 'document selection',
    focusSummary: 'Document meaning: The key sentence I want to remember from this document.',
    input: [
      `Opened original file for learning: ${wordTitle}.`,
      'First language pass: keep the original file surface primary and capture document meaning as anchored traces.',
      `Captured document selection from ${wordTitle} [document meaning]: The key sentence I want to remember from this document.\nEvidence: ${reportOnlyEvidence({ app: 'Microsoft Word', window: wordTitle, kind: 'document', file: wordTitle, bundle: 'com.microsoft.Word' })}`,
    ],
  });
  const excelTitle = 'Loom Excel Learning Table.csv';
  const excelCase = reportOnlyLearningCase({
    id: 'report-only-excel-learning',
    title: excelTitle,
    filePath: fixtures.csv,
    sourceKind: 'spreadsheet',
    meta: 'selected cells',
    traceType: 'spreadsheet cells',
    focusSummary: 'Data meaning: Activation is 42% and retention is 31%.',
    input: [
      `Opened original file for learning: ${excelTitle}.`,
      'Data reading pass: keep the original spreadsheet primary and capture selected cells as anchored traces.',
      `Captured spreadsheet cells from ${excelTitle} [data meaning]: Metric\tValue\nActivation\t42%\nRetention\t31%\nEvidence: ${reportOnlyEvidence({ app: 'Microsoft Excel', window: excelTitle, kind: 'spreadsheet', file: excelTitle, bundle: 'com.microsoft.Excel' })}`,
    ],
  });
  const reportOnlyCases = [pdfCase, wordCase, excelCase];
  const existingIds = new Set(reportOnlyCases.map((entry) => entry.id));
  snapshot.cases = [
    ...reportOnlyCases,
    ...snapshot.cases.filter((entry) => !existingIds.has(entry.id)),
  ];
  snapshot.selectedCaseID = pdfCase.id;
  snapshot.selectedSourceID = pdfCase.sources[0]?.id ?? null;
  return snapshot;
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function processRunning(name) {
  const result = safeRun(`/usr/bin/pgrep -x ${JSON.stringify(name)} >/dev/null && echo true || echo false`);
  return result.output === 'true';
}

function processCommands(name) {
  try {
    const pids = execFileSync('/usr/bin/pgrep', ['-x', name], {
      encoding: 'utf8',
      stdio: 'pipe',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
    return pids.map((pid) => {
      try {
        const command = execFileSync('/bin/ps', ['-p', pid, '-o', 'command='], {
          encoding: 'utf8',
          stdio: 'pipe',
        }).trim();
        return command ? `${pid} ${command}` : pid;
      } catch {
        return pid;
      }
    });
  } catch {
    return [];
  }
}

function appUnderTestMetadata() {
  return {
    path: appPath,
    source: process.env.LOOM_APP_PATH ? 'LOOM_APP_PATH' : 'default user Applications install',
    exists: existsSync(appPath),
  };
}

function fixtureMetadata(fixtures = {}, pdfSource = null) {
  const resolvedPdfPath = pdfSource?.path ?? pdfPath;
  return {
    pdf: {
      path: resolvedPdfPath,
      exists: existsSync(resolvedPdfPath),
      title: pdfSource?.title ?? pdfTitle,
      source: pdfSource?.source ?? 'configured fixture',
      configuredPath: pdfPath,
    },
    word: fixtures.docx
      ? {
          path: fixtures.docx,
          exists: existsSync(fixtures.docx),
        }
      : null,
    excel: fixtures.csv
      ? {
          path: fixtures.csv,
          exists: existsSync(fixtures.csv),
        }
      : null,
  };
}

function readPlistJson(plistPath) {
  return JSON.parse(
    execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', plistPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  );
}

function appInfoPlistPath(targetAppPath = appPath) {
  return path.join(targetAppPath, 'Contents', 'Info.plist');
}

function includesAny(values, expected) {
  return expected.some((value) => values.includes(value));
}

function buildStaticIntegrationContract() {
  const infoPlistPath = appInfoPlistPath();
  const contract = {
    status: 'missing',
    infoPlistPath,
    checks: {
      appExists: existsSync(appPath),
      infoPlistExists: existsSync(infoPlistPath),
      bundleIdentifier: false,
      urlScheme: false,
      serviceDeclared: false,
      serviceMessage: false,
      serviceSendTypes: false,
      pdfDocumentType: false,
      wordDocumentType: false,
      excelDocumentType: false,
    },
    details: {},
  };

  if (!contract.checks.infoPlistExists) return contract;

  const info = readPlistJson(infoPlistPath);
  const documentTypes = info.CFBundleDocumentTypes ?? [];
  const documentContentTypes = documentTypes.flatMap((entry) => entry.LSItemContentTypes ?? []);
  const services = info.NSServices ?? [];
  const serviceNames = services.map((service) => service.NSMenuItem?.default).filter(Boolean);
  const serviceMessages = services.map((service) => service.NSMessage).filter(Boolean);
  const serviceSendTypes = services.flatMap((service) => service.NSSendTypes ?? []);
  const urlSchemes = (info.CFBundleURLTypes ?? []).flatMap((entry) => entry.CFBundleURLSchemes ?? []);

  contract.checks.bundleIdentifier = info.CFBundleIdentifier === 'com.yinyiping.loom';
  contract.checks.urlScheme = urlSchemes.includes('loom');
  contract.checks.serviceDeclared = serviceNames.includes('Capture Selection in Loom');
  contract.checks.serviceMessage = serviceMessages.includes('captureSelectionInLoom');
  contract.checks.serviceSendTypes = ['NSStringPboardType', 'public.utf8-plain-text', 'public.file-url']
    .every((type) => serviceSendTypes.includes(type));
  contract.checks.pdfDocumentType = documentContentTypes.includes('com.adobe.pdf');
  contract.checks.wordDocumentType = includesAny(documentContentTypes, [
    'org.openxmlformats.wordprocessingml.document',
    'com.microsoft.word.doc',
  ]);
  contract.checks.excelDocumentType = includesAny(documentContentTypes, [
    'org.openxmlformats.spreadsheetml.sheet',
    'com.microsoft.excel.xls',
  ]);
  contract.details = {
    bundleIdentifier: info.CFBundleIdentifier,
    urlSchemes,
    serviceNames,
    serviceMessages,
    serviceSendTypes,
    documentContentTypes,
  };
  contract.status = Object.values(contract.checks).every(Boolean) ? 'passed' : 'missing';
  return contract;
}

function runtimeMetadata() {
  return {
    consoleLocked: isConsoleLocked(),
    runningApplications: {
      Loom: processRunning('Loom'),
      Preview: processRunning('Preview'),
      Word: processRunning('Microsoft Word'),
      Excel: processRunning('Microsoft Excel'),
    },
    runningApplicationCommands: {
      Loom: processCommands('Loom'),
      Preview: processCommands('Preview'),
      Word: processCommands('Microsoft Word'),
      Excel: processCommands('Microsoft Excel'),
    },
  };
}

function caseMentionsSource(entry, title) {
  if ((entry?.sources ?? []).some((source) => String(source?.label ?? '').includes(title))) {
    return true;
  }
  return inputItems(entry).some((item) => String(item).includes(title));
}

function traceCase(snapshot, title) {
  // Sidebar cases are user-initiated PROJECTS, not files: a learning project
  // holds several sources, so a per-file expectation matches either a legacy
  // file-named case or a learning project that contains that source.
  const candidates = (snapshot.cases ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      entry?.title === title
      || (entry?.project === 'Learning pass' && caseMentionsSource(entry, title)));
  return candidates
    .sort((left, right) => {
      const strengthDelta = traceStrength(right.entry, snapshot) - traceStrength(left.entry, snapshot);
      if (strengthDelta !== 0) return strengthDelta;
      return right.index - left.index;
    })[0]?.entry;
}

function inputItems(reflectionCase) {
  return reflectionCase?.steps?.find((step) => step.title === 'Input')?.items ?? [];
}

function capturedInputCount(reflectionCase) {
  return inputItems(reflectionCase).filter((item) => String(item).startsWith('Captured ')).length;
}

function sourcePathFromFileURL(value) {
  if (!value) return null;
  try {
    return fileURLToPath(value);
  } catch {
    return null;
  }
}

function firstPdfSource(reflectionCase) {
  return reflectionCase?.sources?.find((source) => {
    const label = String(source?.label ?? '');
    const fileURL = String(source?.fileURL ?? '');
    return /\.pdf$/i.test(label) || /\.pdf(?:$|\?)/i.test(fileURL);
  });
}

function isPdfLearningCase(reflectionCase) {
  if (!reflectionCase || reflectionCase.project !== 'Learning pass') return false;
  if (/\.pdf$/i.test(String(reflectionCase.title ?? ''))) return true;
  return Boolean(firstPdfSource(reflectionCase));
}

function traceStrength(reflectionCase, snapshot) {
  let score = 0;
  if (reflectionCase?.id && reflectionCase.id === snapshot?.selectedCaseID) score += 1000;
  if (traceIntegrityFor(reflectionCase).passed) score += 100;
  score += capturedInputCount(reflectionCase) * 10;
  if (reflectionCase?.status === 'Second pass ready') score += 5;
  return score;
}

function reportPdfSource(snapshot, verificationLevel) {
  const exactCase = traceCase(snapshot, pdfTitle);
  const exactSource = firstPdfSource(exactCase);
  const exactPath = sourcePathFromFileURL(exactSource?.fileURL) ?? pdfPath;

  if (verificationLevel !== 'snapshot-only') {
    return {
      title: pdfTitle,
      path: pdfPath,
      source: 'configured fixture',
      reflectionCase: exactCase,
    };
  }

  if (exactCase && capturedInputCount(exactCase) > 0) {
    return {
      title: exactCase.title,
      path: exactPath,
      source: 'configured fixture with captured traces',
      reflectionCase: exactCase,
    };
  }

  const bestPdfCase = [...(snapshot.cases ?? [])]
    .filter(isPdfLearningCase)
    .sort((a, b) => traceStrength(b, snapshot) - traceStrength(a, snapshot))[0];

  if (bestPdfCase) {
    const source = firstPdfSource(bestPdfCase);
    return {
      title: bestPdfCase.title,
      path: sourcePathFromFileURL(source?.fileURL) ?? exactPath,
      source: 'snapshot PDF learning case',
      reflectionCase: bestPdfCase,
    };
  }

  return {
    title: pdfTitle,
    path: pdfPath,
    source: 'configured fixture',
    reflectionCase: exactCase,
  };
}

function learningInputFingerprint(value) {
  return String(value)
    .replace(/, page \d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function assertNoDuplicateInputFingerprints(label, items) {
  const seen = new Map();
  for (const item of items) {
    const fingerprint = learningInputFingerprint(item);
    seen.set(fingerprint, (seen.get(fingerprint) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    throw new Error(`${label}: duplicate understanding input fingerprints\n${JSON.stringify(duplicates, null, 2)}`);
  }
}

function stepItems(reflectionCase, title) {
  return reflectionCase?.steps?.find((step) => step.title === title)?.items ?? [];
}

function traceMessages(reflectionCase) {
  return reflectionCase?.messages?.map((message) => message.body).join('\n\n') ?? '';
}

function orderedUniqueItems(items) {
  const seen = new Set();
  const output = [];
  for (const item of items ?? []) {
    const key = String(item).replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function compactOutcomeItems(items) {
  const output = [];
  const progressiveOutcomeIndexes = new Map();

  for (const item of orderedUniqueItems(items)) {
    const match = String(item).match(/^Captured \d+ anchored learning traces? from ([^:]+):/);
    if (!match) {
      output.push(item);
      continue;
    }

    const source = match[1];
    if (progressiveOutcomeIndexes.has(source)) {
      output[progressiveOutcomeIndexes.get(source)] = item;
      continue;
    }

    progressiveOutcomeIndexes.set(source, output.length);
    output.push(item);
  }

  return output;
}

function parseCapturedInputLine(item) {
  const value = String(item);
  const prefix = 'Captured ';
  if (!value.startsWith(prefix)) return null;

  const fromIndex = value.indexOf(' from ');
  const focusStart = value.indexOf('[', fromIndex);
  const focusEnd = value.indexOf(']', focusStart);
  if (fromIndex < 0 || focusStart < 0 || focusEnd < 0) return null;

  let text = value.slice(focusEnd + 1).trim();
  const evidenceMarker = '\nEvidence:';
  let evidenceText = '';
  const evidenceIndex = text.indexOf(evidenceMarker);
  if (evidenceIndex >= 0) {
    evidenceText = text.slice(evidenceIndex + evidenceMarker.length).trim();
    text = text.slice(0, evidenceIndex).trim();
  }
  if (text.startsWith(':') || text.startsWith('.')) {
    text = text.slice(1).trim();
  }

  return {
    traceType: value.slice(prefix.length, fromIndex).trim(),
    sourceAnchor: value.slice(fromIndex + ' from '.length, focusStart).trim(),
    focus: value.slice(focusStart + 1, focusEnd).trim(),
    text,
    evidence: parseInputEvidence(evidenceText),
  };
}

function parseInputEvidence(value) {
  if (!value) return {};
  return Object.fromEntries(
    value
      .split(';')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const [label, ...rest] = segment.split('=');
        return [String(label ?? '').trim().toLowerCase(), rest.join('=').trim()];
      })
      .filter(([label, evidenceValue]) => label && evidenceValue),
  );
}

function traceIntegrityFor(reflectionCase) {
  if (!reflectionCase) {
    return {
      passed: false,
      reason: 'case missing',
      versionCount: 0,
      checks: {
        sourceAnchors: false,
        focusLabels: false,
        selectedText: false,
      nativeEvidence: false,
      anchorPrecision: false,
      evidenceRung: false,
      weakAnchorDisclosure: false,
      fallbackDisclosure: false,
      passMetadata: false,
      traceTypeMetadata: false,
      secondPassReadiness: false,
      },
    };
  }

  const input = orderedUniqueItems(inputItems(reflectionCase));
  const versions = input.map(parseCapturedInputLine).filter(Boolean);
  const nativeVersions = versions.filter((version) => !/user trace/i.test(version.traceType));
  const messages = traceMessages(reflectionCase);
  const isWeakAnchorPrecision = (precision) => {
    return /^(window\+page|window\+time|app\+time|unknown)$/i.test(String(precision ?? '').trim());
  };
  const checks = {
    sourceAnchors: versions.length > 0 && versions.every((version) => version.sourceAnchor.length > 0),
    focusLabels: versions.length > 0 && versions.every((version) => version.focus.length > 0),
    selectedText: versions.length > 0 && versions.every((version) => version.text.length > 0),
    nativeEvidence: nativeVersions.length > 0 && nativeVersions.every((version) => {
      return Boolean(version.evidence?.app && version.evidence?.kind);
    }),
    anchorPrecision: nativeVersions.length > 0 && nativeVersions.every((version) => {
      return Boolean(version.evidence?.['anchor precision']);
    }),
    evidenceRung: nativeVersions.length > 0 && nativeVersions.every((version) => {
      return Boolean(version.evidence?.['evidence rung']);
    }),
    weakAnchorDisclosure: nativeVersions.length > 0 && nativeVersions.every((version) => {
      const precision = version.evidence?.['anchor precision'];
      if (!isWeakAnchorPrecision(precision)) return true;
      return Boolean(version.evidence?.['anchor note']);
    }),
    fallbackDisclosure: nativeVersions.length > 0 && nativeVersions.every((version) => {
      const precision = version.evidence?.['anchor precision'];
      if (!isWeakAnchorPrecision(precision)) return true;
      return Boolean(version.evidence?.['fallback note']);
    }),
    passMetadata: /Pass:/.test(messages),
    traceTypeMetadata: /Trace type:/.test(messages),
    secondPassReadiness: reflectionCase.status === 'Second pass ready' && /Second-pass synthesis prepared/.test(messages),
  };
  const passed = Object.values(checks).every(Boolean);

  return {
    passed,
    reason: passed ? 'understanding versions are reviewable' : 'missing required understanding-version evidence',
    versionCount: versions.length,
    checks,
    versions,
  };
}

function allTraceIntegrityPassed(report) {
  return [
    report.pdfLearningExperiment,
    report.wordLearningExperiment,
    report.excelLearningExperiment,
  ].every((trace) => trace?.integrity?.passed);
}

function compactTraceCase(snapshot, title) {
  const reflectionCase = traceCase(snapshot, title);
  return compactTraceCaseFromCase(reflectionCase, title);
}

function compactTraceCaseFromCase(reflectionCase, title) {
  if (!reflectionCase) {
    return {
      title,
      found: false,
    };
  }

  return {
    title: reflectionCase.title,
    found: true,
    project: reflectionCase.project,
    status: reflectionCase.status,
    input: orderedUniqueItems(inputItems(reflectionCase)),
    assumption: orderedUniqueItems(stepItems(reflectionCase, 'Assumption')),
    decisionTrace: orderedUniqueItems(stepItems(reflectionCase, 'Decision Trace')),
    outcome: compactOutcomeItems(stepItems(reflectionCase, 'Outcome')),
    reflection: orderedUniqueItems(stepItems(reflectionCase, 'Reflection')),
    judgmentMemory: orderedUniqueItems(stepItems(reflectionCase, 'Judgment Memory')),
    messages: orderedUniqueItems(reflectionCase.messages?.map((message) => message.body) ?? []),
    integrity: traceIntegrityFor(reflectionCase),
  };
}

function markdownSection(title, items) {
  if (!items?.length) return `### ${title}\n\n- No entries captured.\n`;
  return `### ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}\n`;
}

function reportTraceMarkdown(label, trace) {
  if (!trace?.found) {
    return `## ${label}\n\nTrace was not found in the current Loom snapshot.\n`;
  }

  return [
    `## ${label}`,
    '',
    `- Status: ${trace.status}`,
    `- Project: ${trace.project}`,
    '',
    markdownSection('Input', trace.input),
    markdownSection('Assumption', trace.assumption),
    markdownSection('Decision Trace', trace.decisionTrace),
    markdownSection('Outcome', trace.outcome),
    markdownSection('Reflection', trace.reflection),
    markdownSection('Judgment Memory', trace.judgmentMemory),
    '### Thinking Version Integrity',
    '',
    `- Passed: ${trace.integrity?.passed ? 'yes' : 'no'}`,
    `- Versions: ${trace.integrity?.versionCount ?? 0}`,
    `- Reason: ${trace.integrity?.reason ?? 'not checked'}`,
    '',
  ].join('\n');
}

function packetList(items) {
  const list = orderedUniqueItems(items).filter(Boolean);
  if (list.length === 0) return '- No entries captured yet.';
  return list.map((item) => `- ${item}`).join('\n');
}

function cleanConfirmedMeaning(value) {
  return String(value)
    .replace(/^(meaning confirmed|confirmed)[:\s]+/i, '')
    .trim();
}

function packetFocusLabel(version) {
  const focus = String(version?.focus ?? 'meaning');
  if (/user meaning/i.test(focus)) return 'user-confirmed meaning';
  if (/phrase/i.test(focus)) return 'term / phrase';
  if (/sentence/i.test(focus)) return 'sentence meaning';
  return focus;
}

function packetVersionText(version) {
  if (/user meaning/i.test(version?.focus ?? '')) {
    return cleanConfirmedMeaning(version?.text ?? '');
  }
  return String(version?.text ?? '').trim();
}

function packetFirstPassLine(version) {
  const anchor = version.sourceAnchor ? ` (${version.sourceAnchor})` : '';
  const text = packetVersionText(version);
  const focus = version.focus ?? 'meaning';
  if (/user meaning/i.test(focus)) {
    return `User-confirmed meaning${anchor}: ${text}`;
  }
  if (/phrase/i.test(focus)) {
    return `Term / phrase to review${anchor}: ${text}`;
  }
  if (/sentence/i.test(focus)) {
    return `Sentence to understand${anchor}: ${text}`;
  }
  return `${packetFocusLabel(version)}${anchor}: ${text}`;
}

function packetVersionLines(trace) {
  if (!trace?.found) return [];
  const versions = trace.integrity?.versions ?? [];
  return versions.map((version) => {
    return `${version.sourceAnchor} | ${packetFocusLabel(version)}: ${packetVersionText(version)}`;
  });
}

function packetVersions(trace) {
  if (!trace?.found) return [];
  return trace.integrity?.versions ?? [];
}

function packetSpineLines(report) {
  const title = report.pdfSource.title.replace(/\.pdf$/i, '');
  if (/trading/i.test(title)) {
    return [
      'Spine: trading knowledge becomes useful when market concepts are translated into executable decisions, risks, and reviewable evidence.',
    ];
  }
  return [
    `Spine: ${title} should become a single reviewable chain from source material to understanding to reusable thinking.`,
  ];
}

function packetActiveRecallPrompt(version) {
  const anchor = version.sourceAnchor ? ` (${version.sourceAnchor})` : '';
  const text = packetVersionText(version);
  const focus = version.focus ?? 'meaning';
  if (/user meaning/i.test(focus)) {
    return `Restate the confirmed meaning${anchor}: ______.`;
  }
  if (/phrase/i.test(focus)) {
    return `Fill in${anchor}: "${text}" means ______.`;
  }
  if (/sentence/i.test(focus)) {
    return `Explain in your own words${anchor}: ${text}`;
  }
  if (/word/i.test(focus)) {
    return `Recall${anchor}: word / term "${text}" -> ______.`;
  }
  return `Recall${anchor}: ${text} -> ______.`;
}

function packetActiveRecallLines(trace) {
  return orderedUniqueItems(packetVersions(trace).map(packetActiveRecallPrompt));
}

function packetReviewLines(trace) {
  if (!trace?.found) return [];
  return (trace.integrity?.versions ?? []).map(packetFirstPassLine);
}

function packetLearningTraces(report) {
  return [
    {
      label: `PDF: ${report.pdfSource.title}`,
      trace: report.pdfLearningExperiment,
    },
    {
      label: 'Word: Loom Word Learning Notes.docx',
      trace: report.wordLearningExperiment,
    },
    {
      label: 'Excel: Loom Excel Learning Table.csv',
      trace: report.excelLearningExperiment,
    },
  ];
}

function packetMemoryLines(traces) {
  return traces.flatMap(({ trace }) => trace?.judgmentMemory ?? []);
}

function packetTraceVersionCount(trace) {
  if (!trace?.found) return 0;
  return trace.integrity?.versionCount ?? packetVersions(trace).length;
}

function packetTraceEvidenceValues(trace, key) {
  return orderedUniqueItems(packetVersions(trace)
    .map((version) => version.evidence?.[key])
    .filter(Boolean));
}

function packetSourceCoverageLines(report) {
  return packetLearningTraces(report).map(({ label, trace }) => {
    if (!trace?.found) return `${label}: no anchored learning trace captured yet.`;
    const apps = packetTraceEvidenceValues(trace, 'app');
    const precision = packetTraceEvidenceValues(trace, 'anchor precision');
    const rungs = packetTraceEvidenceValues(trace, 'evidence rung');
    return [
      `${label} -> ${trace.status}`,
      `${packetTraceVersionCount(trace)} understanding version${packetTraceVersionCount(trace) === 1 ? '' : 's'}`,
      apps.length > 0 ? `native app: ${apps.join(', ')}` : null,
      precision.length > 0 ? `anchor precision: ${precision.join(', ')}` : null,
      rungs.length > 0 ? `evidence: ${rungs.join(', ')}` : null,
    ].filter(Boolean).join('; ');
  });
}

function packetTraceSection(label, trace) {
  if (!trace?.found) {
    return [`### ${label}`, '', 'No anchored learning trace has been captured yet.', ''].join('\n');
  }

  const versions = packetVersionLines(trace);
  const reviewLines = packetReviewLines(trace);
  const activeRecallLines = packetActiveRecallLines(trace);
  return [
    `### ${label}`,
    '',
    `Status: ${trace.status}`,
    '',
    '**Captured learning trace**',
    '',
    packetList(versions),
    '',
    '**First-pass understanding**',
    '',
    packetList(reviewLines),
    '',
    '**Active recall prompts**',
    '',
    packetList(activeRecallLines),
    '',
    '**Memory candidates**',
    '',
    packetList(trace.judgmentMemory),
    '',
  ].join('\n');
}

function packetPdfLines(report) {
  const target = report?.pdfSource?.path;
  if (!target || !existsSync(target)) return [];
  return firstPdfPageText(target)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^file:\/\//i.test(line))
    .filter((line) => !/^\d+\/\d+\/\d+,/.test(line));
}

function compactOutlineLines(lines) {
  const output = [];
  for (const rawLine of lines) {
    const line = String(rawLine).replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const startsNewItem =
      /^\d+\./.test(line)
      || /^[a-z]\./i.test(line)
      || /^[A-Z][A-Za-z/& ]{2,50}\s+[–-]\s+/.test(line)
      || output.length === 0;
    if (startsNewItem) {
      output.push(line);
    } else {
      output[output.length - 1] = `${output[output.length - 1]} ${line}`.trim();
    }
  }
  return output.slice(0, 8);
}

function collectOutlineSection(lines, startPattern, stopPatterns) {
  const startIndex = lines.findIndex((line) => startPattern.test(line));
  if (startIndex < 0) return [];
  const section = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (stopPatterns.some((pattern) => pattern.test(line))) break;
    section.push(line);
  }
  return compactOutlineLines(section);
}

function packetSourceOutline(report) {
  const lines = packetPdfLines(report);
  return {
    objectives: collectOutlineSection(lines, /^Learning Objectives\b/i, [
      /^Key Concepts:?$/i,
      /^Agenda\b/i,
      /^Introduction\b/i,
    ]),
    concepts: collectOutlineSection(lines, /^Key Concepts:?$/i, [
      /^Agenda\b/i,
      /^Introduction\b/i,
      /^Trading Logic\b/i,
    ]),
    agenda: collectOutlineSection(lines, /^Agenda\b/i, [
      /^Introduction\b/i,
      /^Trading Logic\b/i,
      /^Quant Analysis\b/i,
    ]),
  };
}

function packetSourceOutlineMarkdown(outline) {
  if (!outline.objectives.length && !outline.concepts.length && !outline.agenda.length) return [];
  return [
    '## Source Outline',
    '',
    ...(outline.objectives.length
      ? ['### Learning Objectives', '', packetList(outline.objectives), '']
      : []),
    ...(outline.concepts.length
      ? ['### Key Concepts', '', packetList(outline.concepts), '']
      : []),
    ...(outline.agenda.length
      ? ['### Agenda', '', packetList(outline.agenda), '']
      : []),
  ];
}

function nativeCapabilityContract() {
  return [
    {
      id: 'pdf-native-reading',
      surface: 'Preview or native PDF app',
      preservedCapability: 'Selection, Look Up, Translate, Copy, search, zoom, page modes, annotations, and macOS Writing Tools where available.',
      loomLayer: 'Capture selected passage, phrase, translation receipt, question, or correction as an understanding version.',
      anchorEvidence: 'Prefer selected text + file + page. If sandbox or app limits block that, use appshot/OCR as visual context only and disclose the weaker precision.',
      refusal: 'Do not build a custom PDF reader or clone the Preview context menu for v1.',
    },
    {
      id: 'word-native-document',
      surface: 'Microsoft Word or native document editor',
      preservedCapability: 'Editing, comments, track changes, version history, styles, spelling, review tools, and document-specific shortcuts.',
      loomLayer: 'Capture selected document meaning, user correction, or reusable writing principle without taking over the document surface.',
      anchorEvidence: 'Prefer selected text + file. Add page, heading, or paragraph only when the native app exposes it; otherwise mark the anchor as file-level.',
      refusal: 'Do not clone Word editing, comments, or version history.',
    },
    {
      id: 'excel-native-spreadsheet',
      surface: 'Microsoft Excel, Numbers, or native spreadsheet app',
      preservedCapability: 'Cell editing, formulas, filters, charts, sheet navigation, data validation, and spreadsheet-native selection.',
      loomLayer: 'Capture selected cells, table meaning, metric interpretation, or data-version notes as reviewable evidence.',
      anchorEvidence: 'Prefer selected cells + file + sheet/cell. If only a visual table is available, store it as visual context only.',
      refusal: 'Do not clone spreadsheet editing, formulas, or chart tooling.',
    },
    {
      id: 'appshot-fallback',
      surface: 'macOS screenshot, Appshot, OCR, Vision, or model extraction',
      preservedCapability: 'The original app stays primary even when text, figure, or table extraction needs visual assistance.',
      loomLayer: 'Attach a compact visual receipt to the understanding version so the user can review what was actually on screen.',
      anchorEvidence: 'Visual context only unless a native file/page/cell anchor is also available.',
      refusal: 'Do not present screenshot or OCR evidence as precise file, page, paragraph, or cell provenance.',
    },
  ];
}

function nativeCapabilityContractMarkdown(items) {
  return [
    '## Native Capability Contract',
    '',
    '| ID | Native surface | Preserved capability | Loom layer | Anchor evidence | Refusal |',
    '| --- | --- | --- | --- | --- | --- |',
    ...items.map((item) => {
      return `| ${markdownTableCell(item.id)} | ${markdownTableCell(item.surface)} | ${markdownTableCell(item.preservedCapability)} | ${markdownTableCell(item.loomLayer)} | ${markdownTableCell(item.anchorEvidence)} | ${markdownTableCell(item.refusal)} |`;
    }),
    '',
  ].join('\n');
}

function packetCell(value, limit = 96) {
  const text = String(value ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function packetVersionIsWeak(version) {
  const precision = String(version?.evidence?.['anchor precision'] ?? '').toLowerCase();
  const fallback = String(version?.evidence?.['fallback note'] ?? '').toLowerCase();
  return precision.includes('window') || precision.includes('visual context only') || fallback.includes('weak');
}

function packetStatusCell(version) {
  const weak = packetVersionIsWeak(version);
  const focus = String(version?.focus ?? '');
  if (/user meaning/i.test(focus)) {
    return weak ? '⚠️ confirmed on a weak anchor' : 'confirmed';
  }
  if (/question/i.test(focus)) return '⚠️ open question';
  if (/correction/i.test(focus)) return 'corrected';
  if (/principle/i.test(focus)) return 'memory candidate';
  return weak ? '⚠️ needs confirmation · weak anchor' : '⚠️ needs confirmation';
}

// The Learning Record follows the owner's report bar (see the design
// handoff): provenance box, scope first, numbered sections, tables for
// structured facts, honest ⚠️ caveats inline, conclusions with their own
// constraints, and a reproducibility trail. The evidence ladder IS the
// report's citation discipline.
function learningOutputPacketMarkdown(report) {
  const learningTraces = packetLearningTraces(report);
  const allVersions = learningTraces.flatMap(({ label, trace }) =>
    packetVersions(trace).map((version) => ({ label, version })));
  const activeRecallLines = learningTraces.flatMap(({ trace }) => packetActiveRecallLines(trace));
  const secondPassItems = learningTraces
    .flatMap(({ trace }) => trace?.messages ?? [])
    .filter((item) => item.includes('Second-pass synthesis prepared'));
  const memoryLines = packetMemoryLines(learningTraces);
  const outputTitle = report.pdfSource.title.replace(/\.pdf$/i, '');
  const sourceOutline = packetSourceOutline(report);
  const capturedTraceCount = learningTraces.filter(({ trace }) => trace?.found).length;
  const totalVersionCount = learningTraces.reduce((sum, { trace }) => sum + packetTraceVersionCount(trace), 0);
  const apps = orderedUniqueItems(learningTraces.flatMap(({ trace }) => packetTraceEvidenceValues(trace, 'app')));
  const rungs = orderedUniqueItems(learningTraces.flatMap(({ trace }) => packetTraceEvidenceValues(trace, 'evidence rung')));
  const weakCount = allVersions.filter(({ version }) => packetVersionIsWeak(version)).length;
  const openQuestions = allVersions.filter(({ version }) => /question/i.test(version.focus ?? ''));
  const corrections = allVersions.filter(({ version }) => /correction/i.test(version.focus ?? ''));

  const sourcesTable = [
    '| Source | Status | Versions | Anchor precision | Evidence rung |',
    '|---|---|---|---|---|',
    ...learningTraces.map(({ label, trace }) => {
      if (!trace?.found) {
        return `| ${packetCell(label, 48)} | not captured | 0 | — | — |`;
      }
      const precision = packetTraceEvidenceValues(trace, 'anchor precision');
      const traceRungs = packetTraceEvidenceValues(trace, 'evidence rung');
      return `| ${packetCell(label, 48)} | ${packetCell(trace.status, 32)} | ${packetTraceVersionCount(trace)} | ${packetCell(precision.join(', ') || '—', 40)} | ${packetCell(traceRungs.join(', ') || '—', 44)} |`;
    }),
  ];

  const recordSections = learningTraces.map(({ label, trace }) => {
    if (!trace?.found) {
      return [`### ${label}`, '', 'No anchored learning trace captured yet.', ''].join('\n');
    }
    const versions = packetVersions(trace);
    return [
      `### ${label}`,
      '',
      `Status: ${trace.status}`,
      '',
      '| # | Focus | Selection / meaning | Anchor | Status |',
      '|---|---|---|---|---|',
      ...versions.map((version, index) =>
        `| ${index + 1} | ${packetCell(packetFocusLabel(version), 28)} | ${packetCell(packetVersionText(version))} | ${packetCell(version.sourceAnchor || '—', 44)} | ${packetCell(packetStatusCell(version), 40)} |`),
      '',
    ].join('\n');
  });

  const trailTable = allVersions.length > 0
    ? [
        '| # | Anchor | Focus | Captured at | Evidence rung |',
        '|---|---|---|---|---|',
        ...allVersions.map(({ version }, index) =>
          `| ${index + 1} | ${packetCell(version.sourceAnchor || '—', 44)} | ${packetCell(packetFocusLabel(version), 28)} | ${packetCell(version.evidence?.['captured at'] || '—', 26)} | ${packetCell(version.evidence?.['evidence rung'] || '—', 40)} |`),
      ]
    : ['- No captures yet.'];

  return [
    `# ${outputTitle} — Learning Record`,
    '',
    `**Source** ${report.pdfSource.title} (\`${report.pdfSource.path}\`) · **Native apps** ${apps.join(', ') || '—'} · **Capture route** macOS Services · pasteboard`,
    '',
    `**Verification** ${totalVersionCount} understanding version${totalVersionCount === 1 ? '' : 's'} across ${capturedTraceCount} source${capturedTraceCount === 1 ? '' : 's'}; every entry carries an explicit anchor-precision label; ${weakCount > 0 ? `${weakCount} weak-anchor entr${weakCount === 1 ? 'y is' : 'ies are'} disclosed inline` : 'no weak anchors in this record'}.`,
    '',
    '## 0. Scope — read this first',
    '',
    packetList([
      'This is a learning record of what was actually captured — not a summary of the source documents.',
      'Meanings are the learner\'s own. Entries marked ⚠️ are not settled knowledge.',
      'Entries below page/cell precision cannot be cited back to an exact location; their status says so inline.',
      'Native file remains the source of truth; Loom records the learning trail only.',
    ]),
    '',
    '## 1. Sources',
    '',
    ...sourcesTable,
    '',
    ...packetSourceOutlineMarkdown(sourceOutline),
    '## 2. Open questions',
    '',
    openQuestions.length > 0
      ? packetList(openQuestions.map(({ version }) =>
          `${packetVersionText(version)} (${version.sourceAnchor || 'no anchor'}) — ⚠️ open; do not promote until confirmed.`))
      : '- None open.',
    '',
    '## 3. Method',
    '',
    packetList([
      'Capture: select in the native app → macOS Services "Capture Selection in Loom" (⌘⇧1) → anchored understanding version. The native app stays primary.',
      `Evidence ladder rungs observed: ${rungs.join('; ') || 'none yet'}.`,
      `Spine: ${packetSpineLines(report).map((line) => line.replace(/^Spine:\s*/, '')).join(' ')}`,
    ]),
    '',
    '## 4. Records & validation',
    '',
    ...recordSections,
    '## 5. Conclusions — promoted principles',
    '',
    memoryLines.length > 0
      ? memoryLines.map((line, index) => `${index + 1}. ${line} *(valid for this record's sources; promoted after user confirmation.)*`).join('\n')
      : '- None promoted yet. Promotion requires a user-confirmed second pass — that gate is the point.',
    '',
    '## 6. Reproducibility — capture trail',
    '',
    ...trailTable,
    '',
    '## 7. Review record',
    '',
    packetList([
      secondPassItems.length > 0
        ? 'Second pass prepared: review captured meanings, separate language understanding from domain knowledge, then promote only stable principles.'
        : 'Second pass not ready: capture at least one meaning and one user correction before compiling memory.',
      corrections.length > 0
        ? `${corrections.length} correction${corrections.length === 1 ? '' : 's'} recorded — see Records & validation.`
        : 'No corrections recorded yet.',
    ]),
    '',
    '## Appendix — Active recall',
    '',
    packetList(activeRecallLines),
    '',
  ].join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function markdownToHtmlBody(markdown) {
  const lines = String(markdown).split('\n');
  const html = [];
  let listType = null;
  let tableRows = [];

  function closeList() {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  }

  function splitTableRow(row) {
    return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  }

  function flushTable() {
    if (tableRows.length === 0) return;
    const rows = tableRows;
    tableRows = [];
    const hasSeparator = rows.length >= 2 && /^\|[\s:|-]+\|$/.test(rows[1].replace(/\s/g, ''));
    const headerCells = splitTableRow(rows[0]);
    const bodyRows = hasSeparator ? rows.slice(2) : rows.slice(1);
    html.push('<table>');
    html.push('<thead><tr>');
    for (const cell of headerCells) html.push(`<th>${inlineMarkdownToHtml(cell)}</th>`);
    html.push('</tr></thead>');
    html.push('<tbody>');
    for (const row of bodyRows) {
      html.push('<tr>');
      for (const cell of splitTableRow(row)) html.push(`<td>${inlineMarkdownToHtml(cell)}</td>`);
      html.push('</tr>');
    }
    html.push('</tbody>');
    html.push('</table>');
  }

  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      closeList();
      tableRows.push(line.trim());
      continue;
    }
    flushTable();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      html.push(`<h${heading[1].length}>${inlineMarkdownToHtml(heading[2])}</h${heading[1].length}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inlineMarkdownToHtml(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inlineMarkdownToHtml(numbered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  }

  flushTable();
  closeList();
  return html.join('\n');
}

function learningOutputPacketHtml(markdown, report) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(report.pdfSource.title.replace(/\.pdf$/i, ''))}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 22mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #172033;
      background: #fff;
      font: 11.5pt/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    }

    h1,
    h2,
    h3 {
      page-break-after: avoid;
      color: #14213d;
      line-height: 1.18;
    }

    h1 {
      margin: 0 0 8mm;
      font-size: 28pt;
      letter-spacing: 0;
    }

    h2 {
      margin: 10mm 0 3mm;
      padding-top: 2mm;
      border-top: 0.7pt solid #d7dde7;
      font-size: 16pt;
    }

    h3 {
      margin: 7mm 0 2mm;
      font-size: 12.5pt;
    }

    p {
      margin: 0 0 3.6mm;
    }

    ul,
    ol {
      margin: 0 0 4mm 5mm;
      padding: 0;
    }

    li {
      margin: 0 0 2mm;
      padding-left: 1mm;
    }

    code {
      padding: 0.2mm 1mm;
      border-radius: 2mm;
      background: #eef2f7;
      font: 10pt/1.4 "SF Mono", Menlo, Consolas, monospace;
    }

    strong {
      color: #111827;
    }

    table {
      width: 100%;
      margin: 0 0 4.5mm;
      border-collapse: collapse;
      font-size: 9.8pt;
      page-break-inside: avoid;
    }

    th {
      text-align: left;
      padding: 1.6mm 2.2mm;
      background: #eef2f7;
      border: 0.5pt solid #d7dde7;
      color: #14213d;
      font-weight: 650;
    }

    td {
      padding: 1.5mm 2.2mm;
      border: 0.5pt solid #d7dde7;
      vertical-align: top;
    }

    .packet-meta {
      margin: 0 0 8mm;
      padding: 3mm 0 0;
      border-top: 1.1pt solid #14213d;
      color: #607089;
      font-size: 9.5pt;
    }

    .packet-footer {
      margin-top: 10mm;
      padding-top: 3mm;
      border-top: 0.7pt solid #d7dde7;
      color: #748196;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <main>
    <div class="packet-meta">Learning packet · Source: ${escapeHtml(report.pdfSource.title)} · Anchored learning trail</div>
    ${markdownToHtmlBody(markdown)}
    <div class="packet-footer">Generated from anchored learning traces. The original file remains the source of truth.</div>
  </main>
</body>
</html>`;
}

function chromeExecutablePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function sha256ForFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function cachedLearningOutputPacketPdf(htmlPath, pdfPath, hashPath = learningOutputPacketPdfSourceHashPath) {
  if (!existsSync(pdfPath) || !existsSync(hashPath)) return null;

  const bytes = statSync(pdfPath).size;
  if (bytes <= 0) return null;

  const htmlHash = sha256ForFile(htmlPath);
  const cachedHash = readFileSync(hashPath, 'utf8').trim();
  if (cachedHash !== htmlHash) return null;

  return {
    status: 'generated',
    path: pdfPath,
    bytes,
    cached: true,
    sourceHash: htmlHash,
    evidence: `Reused cached A4 PDF packet at ${pdfPath}; source HTML hash unchanged.`,
  };
}

function renderLearningOutputPacketPdf(htmlPath, pdfPath) {
  const cachedPdf = cachedLearningOutputPacketPdf(htmlPath, pdfPath);
  if (cachedPdf) return cachedPdf;

  const htmlHash = sha256ForFile(htmlPath);
  const chromePath = chromeExecutablePath();
  if (!chromePath) {
    return {
      status: 'browser-missing',
      evidence: 'Chrome/Chromium executable not found; HTML packet remains printable to PDF.',
    };
  }

  const profileDir = path.join(workDir, 'chrome-profile');
  rmSync(profileDir, { recursive: true, force: true });
  mkdirSync(profileDir, { recursive: true });
  try {
    execFileSync(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pdf-header-footer',
        '--print-to-pdf-no-header',
        `--user-data-dir=${profileDir}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).toString(),
      ],
      {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000,
      },
    );
    const bytes = existsSync(pdfPath) ? statSync(pdfPath).size : 0;
    if (bytes > 0) {
      writeFileSync(learningOutputPacketPdfSourceHashPath, `${htmlHash}\n`);
      return {
        status: 'generated',
        path: pdfPath,
        bytes,
        cached: false,
        sourceHash: htmlHash,
        evidence: `Generated A4 PDF packet at ${pdfPath}.`,
      };
    }

    return {
      status: 'empty',
      evidence: `Chrome ran but did not create a non-empty PDF at ${pdfPath}.`,
    };
  } catch (error) {
    const bytes = existsSync(pdfPath) ? statSync(pdfPath).size : 0;
    if (bytes > 0) {
      writeFileSync(learningOutputPacketPdfSourceHashPath, `${htmlHash}\n`);
      return {
        status: 'generated',
        path: pdfPath,
        bytes,
        cached: false,
        sourceHash: htmlHash,
        warning: String(error?.stderr ?? error?.stdout ?? error?.message ?? error).slice(0, 2000),
        evidence: `Generated non-empty A4 PDF packet at ${pdfPath}; Chrome returned warnings after writing the file.`,
      };
    }

    return {
      status: 'failed',
      evidence: String(error?.stderr ?? error?.stdout ?? error?.message ?? error),
    };
  }
}

function traceEvidenceStatus(trace, verificationLevel) {
  if (!trace?.found) return 'missing';
  return verificationLevel === 'snapshot-only' ? 'snapshot-present' : 'passed';
}

function guiEvidenceStatus(report) {
  if (report.verificationLevel === 'native-sidecar-gui') return 'passed';
  return report.runtime?.consoleLocked ? 'blocked-by-locked-screen' : 'gui-verification-required';
}

function guiEvidenceText(report, passedEvidence) {
  if (report.verificationLevel === 'native-sidecar-gui') return passedEvidence;
  return report.runtime?.consoleLocked
    ? 'Requires unlocked macOS and full GUI verifier.'
    : 'Requires full GUI verifier or Computer Use to confirm native windows, focus, and companion behavior.';
}

function readComputerUseReadback() {
  if (!existsSync(computerUseReadbackPath)) return null;
  try {
    return JSON.parse(readFileSync(computerUseReadbackPath, 'utf8'));
  } catch (error) {
    return {
      status: 'invalid',
      path: computerUseReadbackPath,
      evidence: `Could not parse Computer Use readback: ${String(error?.message ?? error)}`,
    };
  }
}

function buildAcceptanceMatrix(report) {
  const guiStatus = guiEvidenceStatus(report);
  const integrityPassed = allTraceIntegrityPassed(report);
  const staticIntegrationPassed = report.staticIntegration?.status === 'passed';
  const packetGenerated = report.outputPacket?.status === 'generated';
  const pdfPacketGenerated = report.outputPacket?.pdf?.status === 'generated';
  const capabilityContractComplete = nativeCapabilityContractComplete(report.nativeCapabilityContract);
  const computerUsePassed = report.computerUseReadback?.status === 'passed';
  const computerUseObservedWrongWindow = Array.isArray(report.computerUseReadback?.observations)
    && report.computerUseReadback.observations.some((observation) =>
      /wrong-window|ambiguity|different/i.test(`${observation?.result ?? ''} ${JSON.stringify(observation?.details ?? [])}`),
    );
  return [
    {
      id: 'static-native-integration-contract',
      requirement: 'Installed Loom.app declares PDF, Word, Excel, Services capture, and loom:// handoff integration.',
      status: staticIntegrationPassed ? 'passed' : 'missing',
      evidence: staticIntegrationPassed
        ? 'Info.plist declares document types, Capture Selection in Loom, pasteboard send types, bundle id, and loom URL scheme.'
        : 'Installed app Info.plist is missing one or more native integration declarations.',
    },
    {
      id: 'original-file-open-handoff',
      requirement: 'Opening PDF, Word, and Excel files with Loom hands them back to the native apps while Loom only shows a transient saved receipt.',
      status: guiStatus,
      evidence: guiEvidenceText(report, 'Loom file-open handoff produced native Preview, Word, and Excel surfaces.'),
    },
    {
      id: 'pdf-native-surface',
      requirement: 'PDF remains in Preview/native PDF app while Loom records beside it.',
      status: guiStatus,
      evidence: guiEvidenceText(report, 'PDF handoff, capture, focus, and transient receipt assertions passed during the PDF step.'),
    },
    {
      id: 'word-native-surface',
      requirement: 'Word remains the native document surface while Loom captures selected document meaning.',
      status: guiStatus,
      evidence: guiEvidenceText(report, 'Word handoff, capture, focus, and transient receipt assertions passed during the Word step.'),
    },
    {
      id: 'excel-native-surface',
      requirement: 'Excel remains the native spreadsheet surface while Loom captures selected cells.',
      status: guiStatus,
      evidence: guiEvidenceText(report, 'Excel handoff, capture, focus, final native surface, and transient receipt assertions passed.'),
    },
    {
      id: 'loom-companion',
      requirement: 'Loom appears only as a transient saved receipt and does not become the frontmost native-file app.',
      status: guiStatus,
      evidence: guiEvidenceText(report, 'Receipt size, auto-dismiss, frontmost-app, and non-companion window assertions passed.'),
    },
    {
      id: 'pdf-learning-experiment',
      requirement: `${report.pdfSource.title} produces anchored PDF learning traces with second-pass readiness.`,
      status: traceEvidenceStatus(report.pdfLearningExperiment, report.verificationLevel),
      evidence: report.pdfLearningExperiment?.found
        ? `PDF status: ${report.pdfLearningExperiment.status}; inputs: ${report.pdfLearningExperiment.input.length}.`
        : 'PDF learning trace missing from Loom snapshot.',
    },
    {
      id: 'thinking-version-integrity',
      requirement: 'PDF, Word, and Excel captures create reviewable understanding versions with source anchor, anchor precision, weak-anchor disclosure, focus, selected text, pass metadata, trace type, and second-pass readiness.',
      status: integrityPassed
        ? (report.verificationLevel === 'snapshot-only' ? 'snapshot-present' : 'passed')
        : 'missing',
      evidence: integrityPassed
        ? 'All three traces include reviewable understanding-version evidence.'
        : 'One or more traces is missing anchor, anchor precision, weak-anchor disclosure, focus, selected text, pass, trace type, or second-pass readiness.',
    },
    {
      id: 'evidence-ladder-integrity',
      requirement: 'Every native capture states the strongest available evidence rung and gives a fallback note when precision is weak.',
      status: integrityPassed
        ? (report.verificationLevel === 'snapshot-only' ? 'snapshot-present' : 'passed')
        : 'missing',
      evidence: integrityPassed
        ? 'Captured inputs include evidence rung, anchor precision, and weak-anchor fallback disclosure.'
        : 'One or more captures is missing evidence rung or fallback disclosure.',
    },
    {
      id: 'native-capability-preservation',
      requirement: 'Loom does not rebuild mature native actions such as Look Up, Copy, Translate, page mode, Writing Tools, search, zoom, or spreadsheet/document editing.',
      status: computerUsePassed ? 'passed' : guiStatus,
      evidence: computerUsePassed
        ? 'Computer Use readback confirms Preview kept native document text, multiple pages, table structure, zoom, markup, inspector, share, search, and scroll behavior while Loom remains a review layer.'
        : guiEvidenceText(report, 'Human path confirms native PDF/Word/Excel surfaces retain their own tools while Loom records receipts and understanding versions only.'),
    },
    {
      id: 'native-capability-contract',
      requirement: 'The report states, for PDF, Word, Excel, and visual fallback, which native capability stays in charge, what Loom adds, what anchor evidence is allowed, and what Loom refuses to rebuild.',
      status: capabilityContractComplete ? 'passed' : 'missing',
      evidence: capabilityContractComplete
        ? 'Native capability contract covers PDF, Word, Excel, and appshot fallback with preserved capability, Loom layer, anchor evidence, and refusal.'
        : 'Native capability contract is incomplete.',
    },
    {
      id: 'learning-output-packet-baseline',
      requirement: 'After study, Loom should be able to compile a Learning Output Packet at least as readable and complete as the FINS3666 / Circle-style A4 packet: title, source, learning objectives, key concepts, agenda, sections, and page-aware citations.',
      status: pdfPacketGenerated
        ? 'a4-pdf-generated'
        : (packetGenerated ? 'html-markdown-packet-generated' : 'product-standard-required'),
      evidence: packetGenerated
        ? `${pdfPacketGenerated ? report.outputPacket.pdf.evidence : 'Generated Markdown and printable HTML Learning Output Packet; A4 PDF rendering still requires available Chrome/Chromium.'} Markdown: ${report.outputPacket.markdownPath}. HTML: ${report.outputPacket.htmlPath}.`
        : 'This verifier records the baseline standard; PDF/Markdown export generation must prove it in a later implementation pass.',
    },
    {
      id: 'word-learning-trace',
      requirement: 'Word document selection produces an anchored document-meaning trace.',
      status: traceEvidenceStatus(report.wordLearningExperiment, report.verificationLevel),
      evidence: report.wordLearningExperiment?.found
        ? `Word status: ${report.wordLearningExperiment.status}; inputs: ${report.wordLearningExperiment.input.length}.`
        : 'Word learning trace missing from Loom snapshot.',
    },
    {
      id: 'excel-learning-trace',
      requirement: 'Excel spreadsheet cells produce an anchored data-meaning trace.',
      status: traceEvidenceStatus(report.excelLearningExperiment, report.verificationLevel),
      evidence: report.excelLearningExperiment?.found
        ? `Excel status: ${report.excelLearningExperiment.status}; inputs: ${report.excelLearningExperiment.input.length}.`
        : 'Excel learning trace missing from Loom snapshot.',
    },
    {
      id: 'computer-use-human-path',
      requirement: 'Computer Use can inspect and operate the Loom/native-file windows as a human-path test.',
      status: computerUsePassed ? 'passed' : 'external-check-required',
      evidence: computerUsePassed
        ? report.computerUseReadback.evidence
        : 'Requires mcp__computer_use.get_app_state and follow-up UI actions after macOS is unlocked.',
    },
    {
      id: 'source-disambiguation-human-path',
      requirement: 'When Computer Use or Accessibility sees a different native document than the intended learning file, Loom records it as weak context instead of promoting app identity into file/page/cell truth.',
      status: computerUseObservedWrongWindow ? 'passed' : 'not-observed',
      evidence: computerUseObservedWrongWindow
        ? 'Computer Use readback recorded a wrong-window ambiguity and preserves it as a source-disambiguation constraint.'
        : 'No wrong-window case observed in the current readback; source disambiguation still required by product rules.',
    },
  ];
}

function markdownTableCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function acceptanceMatrixMarkdown(criteria) {
  return [
    '## Acceptance Matrix',
    '',
    '| ID | Requirement | Status | Evidence |',
    '| --- | --- | --- | --- |',
    ...criteria.map((item) => {
      return `| ${markdownTableCell(item.id)} | ${markdownTableCell(item.requirement)} | ${markdownTableCell(item.status)} | ${markdownTableCell(item.evidence)} |`;
    }),
    '',
  ].join('\n');
}

function nativeCapabilityContractComplete(items) {
  const requiredIds = [
    'pdf-native-reading',
    'word-native-document',
    'excel-native-spreadsheet',
    'appshot-fallback',
  ];
  if (!Array.isArray(items)) return false;
  return requiredIds.every((id) => {
    const item = items.find((candidate) => candidate?.id === id);
    return Boolean(
      item?.surface
      && item?.preservedCapability
      && item?.loomLayer
      && item?.anchorEvidence
      && item?.refusal,
    );
  });
}

function humanPathChecklist() {
  return [
    {
      id: 'unlock-and-read-windows',
      action: 'Unlock macOS, then use Computer Use get_app_state for Preview, Word, Excel, and Loom.',
      expected: 'Preview, Word, Excel, and Loom windows are inspectable; no cgWindowNotFound or locked-screen failure.',
    },
    {
      id: 'pdf-native-reading-first',
      action: `Open ${pdfTitle} through Loom and inspect the resulting native PDF window.`,
      expected: 'Preview or the default PDF app owns reading, search, zoom, page mode, selection, and context menu behavior.',
    },
    {
      id: 'pdf-system-tools-preserved',
      action: 'In the native PDF window, select text and open the context menu before using Loom capture.',
      expected: 'Look Up, Copy, Translate, page mode, Writing Tools/Summarize where available, search, zoom, and Services remain native macOS actions.',
    },
    {
      id: 'pdf-services-capture',
      action: `Use Capture Selection in Loom for the sentence and phrase from ${pdfTitle}.`,
      expected: 'Loom shows only a tiny transient saved receipt, auto-dismisses, and does not become the frontmost reading surface.',
    },
    {
      id: 'word-native-capture',
      action: 'Open the Word fixture through Loom and capture a selected sentence from Word.',
      expected: 'Microsoft Word remains the document editor; Loom records an anchored document-meaning trace only.',
    },
    {
      id: 'excel-native-capture',
      action: 'Open the Excel/CSV fixture through Loom and capture selected cells from Excel.',
      expected: 'Microsoft Excel remains the spreadsheet editor; Loom records an anchored data-meaning trace only.',
    },
    {
      id: 'review-thinking-version-history',
      action: 'Open Review in Loom after the captures.',
      expected: 'The center shows reviewable understanding versions for PDF, Word, and Excel with source anchors, anchor precision, weak-anchor notes when precision is weak, pass, trace type, selected text, and second-pass readiness.',
    },
    {
      id: 'learning-output-packet-review',
      action: 'After the learning pass, compile or preview the Learning Output Packet.',
      expected: 'The output matches the FINS3666 / Circle-style A4 floor while adding source anchors, pass history, understanding diff, and reusable principles.',
    },
  ];
}

function humanPathChecklistMarkdown(items) {
  return [
    '## Human Path Checklist',
    '',
    '| ID | Action | Expected evidence |',
    '| --- | --- | --- |',
    ...items.map((item) => {
      return `| ${markdownTableCell(item.id)} | ${markdownTableCell(item.action)} | ${markdownTableCell(item.expected)} |`;
    }),
    '',
  ].join('\n');
}

function writeLearningExperimentReport(snapshot, verificationLevel, fixtures = {}) {
  const caveatByLevel = {
    'snapshot-only': 'Generated from an existing Loom snapshot. This does not prove the current GUI capture path.',
    'native-services-smoke': 'Generated after macOS Services capture assertions and Reflection snapshot assertions passed, but native window preservation and transient receipt behavior still require GUI verification.',
    'native-sidecar-gui': 'Generated after native sidecar GUI verification assertions passed.',
  };
  const checkedByByLevel = {
    'snapshot-only': 'Not checked in report-only mode',
    'native-services-smoke': 'Services capture and Reflection snapshot assertions without CGWindow native-surface checks',
    'native-sidecar-gui': 'CGWindowList, frontmost-app checks, transient receipt checks, Services capture, and Reflection snapshot assertions',
  };
  const pdfSource = reportPdfSource(snapshot, verificationLevel);
  const report = {
    generatedAt: new Date().toISOString(),
    verificationLevel,
    caveat: caveatByLevel[verificationLevel] ?? `Unknown verification level: ${verificationLevel}`,
    nativePreservation: {
      expected: 'Preview, Word, and Excel remain the primary native surfaces; Loom only appears as a transient saved receipt.',
      checkedBy: checkedByByLevel[verificationLevel] ?? 'Not checked',
    },
    staticIntegration: buildStaticIntegrationContract(),
    appUnderTest: appUnderTestMetadata(),
    fixtures: fixtureMetadata(fixtures, pdfSource),
    pdfSource: {
      title: pdfSource.title,
      path: pdfSource.path,
      source: pdfSource.source,
    },
    runtime: runtimeMetadata(),
    pdfLearningExperiment: compactTraceCaseFromCase(pdfSource.reflectionCase, pdfSource.title),
    wordLearningExperiment: compactTraceCase(snapshot, 'Loom Word Learning Notes.docx'),
    excelLearningExperiment: compactTraceCase(snapshot, 'Loom Excel Learning Table.csv'),
    nativeCapabilityContract: nativeCapabilityContract(),
    humanPathChecklist: humanPathChecklist(),
    computerUseReadback: readComputerUseReadback(),
  };
  const packetMarkdown = learningOutputPacketMarkdown(report);
  const packetHtml = learningOutputPacketHtml(packetMarkdown, report);
  writeFileSync(learningOutputPacketMarkdownPath, packetMarkdown);
  writeFileSync(learningOutputPacketHtmlPath, packetHtml);
  const packetPdf = renderLearningOutputPacketPdf(learningOutputPacketHtmlPath, learningOutputPacketPdfPath);
  report.outputPacket = {
    status: 'generated',
    formats: ['markdown', 'html', packetPdf.status === 'generated' ? 'pdf' : 'pdf-pending'],
    markdownPath: learningOutputPacketMarkdownPath,
    htmlPath: learningOutputPacketHtmlPath,
    pdfPath: learningOutputPacketPdfPath,
    pdf: packetPdf,
    referenceFloor: 'FINS3666 / Circle-style A4 packet',
    pdfExportStatus: packetPdf.status,
  };
  report.acceptanceMatrix = buildAcceptanceMatrix(report);

  writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));
  writeFileSync(
    reportMarkdownPath,
    [
      '# Loom Native Sidecar Learning Experiment',
      '',
      `Generated: ${report.generatedAt}`,
      `Verification level: ${report.verificationLevel}`,
      '',
      report.caveat,
      '',
      '## Native Preservation',
      '',
      `- Expected: ${report.nativePreservation.expected}`,
      `- Checked by: ${report.nativePreservation.checkedBy}`,
      `- App under test: ${report.appUnderTest.path}`,
      `- PDF source: ${report.pdfSource.title}`,
      `- PDF path: ${report.fixtures.pdf.path}`,
      `- PDF report source: ${report.pdfSource.source}`,
      '',
      nativeCapabilityContractMarkdown(report.nativeCapabilityContract),
      '',
      '## Learning Output Packet Baseline',
      '',
      '- Reference floor: FINS3666 / Circle-style A4 packet.',
      '- Baseline: title, source/provenance, learning objectives, key concepts, agenda, sectioned body, readable typography, page-aware citations.',
      '- Loom layer: source anchors, native use trail, pass history, understanding diff, second-pass synthesis, and reusable principles.',
      `- Markdown packet: ${report.outputPacket.markdownPath}`,
      `- Printable HTML packet: ${report.outputPacket.htmlPath}`,
      `- A4 PDF packet: ${report.outputPacket.pdf.status === 'generated' ? report.outputPacket.pdf.path : report.outputPacket.pdfExportStatus}`,
      `- Current verifier status: ${report.outputPacket.pdf.status === 'generated' ? 'A4 PDF packet generated.' : 'Markdown and HTML generated; A4 PDF rendering still needs implementation evidence.'}`,
      '',
      acceptanceMatrixMarkdown(report.acceptanceMatrix),
      humanPathChecklistMarkdown(report.humanPathChecklist),
      reportTraceMarkdown(`PDF: ${report.pdfSource.title}`, report.pdfLearningExperiment),
      reportTraceMarkdown('Word: Loom Word Learning Notes.docx', report.wordLearningExperiment),
      reportTraceMarkdown('Excel: Loom Excel Learning Table.csv', report.excelLearningExperiment),
    ].join('\n'),
  );

  console.log(`report=${reportJsonPath}`);
  console.log(`reportMarkdown=${reportMarkdownPath}`);
  console.log(`outputPacket=${learningOutputPacketMarkdownPath}`);
  console.log(`outputPacketHtml=${learningOutputPacketHtmlPath}`);
  console.log(`outputPacketPdf=${report.outputPacket.pdf.status === 'generated' ? learningOutputPacketPdfPath : report.outputPacket.pdf.status}`);
}

function writePreflightReport() {
  const latestReport = safeReadJson(reportJsonPath);
  const consoleLocked = isConsoleLocked();
  const latestAcceptanceMatrix = latestReport?.acceptanceMatrix ?? null;
  const reportSummary = latestReport
    ? {
        verificationLevel: latestReport.verificationLevel,
        pdfFound: Boolean(latestReport.pdfLearningExperiment?.found),
        wordFound: Boolean(latestReport.wordLearningExperiment?.found),
        excelFound: Boolean(latestReport.excelLearningExperiment?.found),
        caveat: latestReport.caveat,
        acceptanceMatrix: latestAcceptanceMatrix,
      }
    : null;

  const preflight = {
    generatedAt: new Date().toISOString(),
    status: consoleLocked ? 'blocked:locked-screen' : 'ready-for-gui-verification',
    consoleLocked,
    appUnderTest: appUnderTestMetadata(),
    pdfFixture: fixtureMetadata().pdf,
    staticIntegration: buildStaticIntegrationContract(),
    humanPathChecklist: humanPathChecklist(),
    ...runtimeMetadata(),
    reports: {
      currentSnapshotPath,
      currentSnapshotExists: existsSync(currentSnapshotPath),
      reportJsonPath,
      reportJsonExists: existsSync(reportJsonPath),
      reportMarkdownPath,
      reportMarkdownExists: existsSync(reportMarkdownPath),
      learningOutputPacketMarkdownPath,
      learningOutputPacketMarkdownExists: existsSync(learningOutputPacketMarkdownPath),
      learningOutputPacketHtmlPath,
      learningOutputPacketHtmlExists: existsSync(learningOutputPacketHtmlPath),
      learningOutputPacketPdfPath,
      learningOutputPacketPdfExists: existsSync(learningOutputPacketPdfPath),
      latestReport: reportSummary,
    },
    nextCommands: {
      servicesCaptureSmoke: 'npm run verify:native-sidecar -- --service-capture-only',
      fullGuiVerification: 'npm run verify:native-sidecar -- --screenshots',
      debugAppGuiVerification: 'LOOM_APP_PATH=.codex/DerivedData/Loom/Build/Products/Debug/Loom.app npm run verify:native-sidecar -- --screenshots',
      snapshotOnlyReport: 'npm run verify:native-sidecar -- --report-only',
      preflight: 'npm run verify:native-sidecar -- --preflight',
    },
    acceptanceBoundary: consoleLocked
      ? 'Unlock macOS before claiming native PDF/Word/Excel GUI verification or Computer Use acceptance.'
      : 'Run the full GUI verifier and then inspect the native-sidecar-gui learning report.',
  };

  writeFileSync(preflightJsonPath, JSON.stringify(preflight, null, 2));
  console.log(`preflight=${preflightJsonPath}`);
  console.log(JSON.stringify(preflight, null, 2));
}

function assertAnyInputLine(label, items, predicate) {
  const matches = items.filter(predicate);
  if (matches.length < 1) {
    throw new Error(`${label}: expected at least one matching input line, found ${matches.length}\n${items.join('\n')}`);
  }
}

function assertReflectionTrace(label, snapshot, expectation) {
  const reflectionCase = traceCase(snapshot, expectation.title);
  if (!reflectionCase) {
    throw new Error(`${label}: missing learning case "${expectation.title}"`);
  }

  assertIncludes(label, reflectionCase.project, 'Learning pass');
  assertIncludes(label, reflectionCase.status, expectation.status ?? 'Reading');
  const messages = traceMessages(reflectionCase);
  for (const fragment of expectation.messageFragments ?? [expectation.traceType]) {
    assertIncludes(label, messages, fragment);
  }
  for (const inputFragments of expectation.inputLines ?? [expectation.inputFragments]) {
    assertAnyInputLine(label, inputItems(reflectionCase), (item) => {
      return inputFragments.every((fragment) => item.includes(fragment));
    });
  }
  for (const stepExpectation of expectation.stepItems ?? []) {
    assertAnyInputLine(label, stepItems(reflectionCase, stepExpectation.title), (item) => {
      return stepExpectation.fragments.every((fragment) => item.includes(fragment));
    });
  }
}

function assertLearningInputLine(label, reflectionCase, baseFragments, evidenceAlternatives) {
  assertAnyInputLine(label, inputItems(reflectionCase), (item) => {
    const hasBase = baseFragments.every((fragment) => item.includes(fragment));
    const hasEvidence = evidenceAlternatives.some((fragments) => {
      return fragments.every((fragment) => item.includes(fragment));
    });
    return hasBase && hasEvidence;
  });
}

function makeFixtures() {
  const fixturesDir = path.join(workDir, 'fixtures');
  mkdirSync(fixturesDir, { recursive: true });

  const rtf = path.join(fixturesDir, 'Loom Word Learning Notes.rtf');
  const docx = path.join(fixturesDir, 'Loom Word Learning Notes.docx');
  const csv = path.join(fixturesDir, 'Loom Excel Learning Table.csv');

  writeFileSync(
    rtf,
    String.raw`{\rtf1\ansi\deff0 {\fonttbl {\f0 Helvetica;}}\f0\fs28 The key sentence I want to remember from this document. This document is a Loom native Word capture fixture.}`,
  );
  run(`/usr/bin/textutil -convert docx ${JSON.stringify(rtf)} -output ${JSON.stringify(docx)}`);
  writeFileSync(csv, 'Metric,Value\nActivation,42%\nRetention,31%\n');

  return { docx, csv };
}

function assertLearningExperimentTraces(snapshot, options = {}) {
  const pdfSelection = pdfLearningSelections();
  const pdfTrace = traceCase(snapshot, pdfTitle);
  const pdfPreviewEvidence = [['Evidence: app=Preview', 'kind=pdf']];
  const pdfEvidenceAlternatives = options.allowFileLevelEvidence
    ? [
        ...pdfPreviewEvidence,
        [
          `file=${pdfTitle}`,
          'kind=pdf',
          'anchor precision=file',
          'evidence rung=selected text + file',
        ],
      ]
    : pdfPreviewEvidence;
  assertNoDuplicateInputFingerprints('PDF trace', inputItems(pdfTrace));
  assertReflectionTrace('PDF trace', snapshot, {
    title: pdfTitle,
    status: 'Second pass ready',
    inputLines: [],
    messageFragments: [
      'Pass: first language pass',
      'Learning focus: sentence meaning',
      'Learning focus: phrase meaning',
      'Meaning status: needs user confirmation',
      'Second pass: not synthesized yet',
      `Source: ${pdfTitle}, page ${pdfSelection.page}`,
      'Trace type: PDF passage',
      'Second-pass synthesis prepared',
    ],
    stepItems: [
      {
        title: 'Assumption',
        fragments: ['First-pass learning is not final understanding', 'reusable thinking'],
      },
      {
        title: 'Decision Trace',
        fragments: ['Kept the original file surface primary', pdfTitle],
      },
      {
        title: 'Outcome',
        fragments: [`Captured 2 anchored learning traces from ${pdfTitle}`, 'sentence meaning', 'phrase meaning'],
      },
      {
        title: 'Reflection',
        fragments: ['Sentence meaning to review', pdfSelection.sentence.slice(0, 48)],
      },
      {
        title: 'Reflection',
        fragments: ['Phrase meaning to review', pdfSelection.phrase],
      },
    ],
  });
  assertLearningInputLine(
    'PDF sentence trace',
    pdfTrace,
    [
      `Captured PDF passage from ${pdfTitle}, page ${pdfSelection.page}`,
      '[sentence meaning]',
      pdfSelection.sentence.slice(0, 48),
    ],
    pdfEvidenceAlternatives,
  );
  assertLearningInputLine(
    'PDF phrase trace',
    pdfTrace,
    [
      `Captured PDF passage from ${pdfTitle}, page ${pdfSelection.page}`,
      '[phrase meaning]',
      pdfSelection.phrase,
    ],
    pdfEvidenceAlternatives,
  );
  const wordNativeEvidence = [['Evidence: app=Microsoft Word', 'kind=document']];
  const wordEvidenceAlternatives = options.allowFileLevelEvidence
    ? [
        ...wordNativeEvidence,
        [
          'file=Loom Word Learning Notes.docx',
          'kind=document',
          'anchor precision=file',
          'evidence rung=selected text + file',
        ],
      ]
    : wordNativeEvidence;
  assertReflectionTrace('Word trace', snapshot, {
    title: 'Loom Word Learning Notes.docx',
    status: 'Second pass ready',
    inputLines: [],
    messageFragments: ['Pass: source comprehension pass', 'Learning focus: document meaning', 'Trace type: document selection'],
  });
  assertLearningInputLine(
    'Word trace input',
    traceCase(snapshot, 'Loom Word Learning Notes.docx'),
    [
      'Captured document selection from Loom Word Learning Notes.docx',
      '[document meaning]',
      'The key sentence I want to remember',
    ],
    wordEvidenceAlternatives,
  );

  const excelNativeEvidence = [['Evidence: app=Microsoft Excel', 'kind=spreadsheet']];
  const excelEvidenceAlternatives = options.allowFileLevelEvidence
    ? [
        ...excelNativeEvidence,
        [
          'file=Loom Excel Learning Table.csv',
          'kind=spreadsheet',
          'anchor precision=file',
          'evidence rung=selected text + file',
        ],
      ]
    : excelNativeEvidence;
  assertReflectionTrace('Excel trace', snapshot, {
    title: 'Loom Excel Learning Table.csv',
    status: 'Second pass ready',
    inputLines: [],
    messageFragments: ['Pass: data reading pass', 'Learning focus: data meaning', 'Trace type: spreadsheet cells'],
  });
  assertLearningInputLine(
    'Excel trace input',
    traceCase(snapshot, 'Loom Excel Learning Table.csv'),
    [
      'Captured spreadsheet cells from Loom Excel Learning Table.csv',
      '[data meaning]',
      'Activation',
      'Retention',
    ],
    excelEvidenceAlternatives,
  );
}

function readLearningExperimentSnapshot(options = {}) {
  let snapshot;
  let lastError;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 12000) {
    try {
      snapshot = readReflectionSnapshot();
      assertLearningExperimentTraces(snapshot, options);
      return snapshot;
    } catch (error) {
      lastError = error;
      sleepMs(250);
    }
  }
  if (snapshot) {
    writeFileSync(currentSnapshotPath, JSON.stringify(snapshot, null, 2));
  }
  throw lastError ?? new Error('learning experiment traces did not appear in the Loom snapshot');
}

function runServicesCaptureSmoke() {
  requirePath('Installed Loom app', appPath);
  requirePath('PDF fixture', pdfPath);
  const fixtures = makeFixtures();
  const pdfSelection = pdfLearningSelections();

  stopRunningLoom();
  openAppBundle(appPath);
  sleepMs(1500);

  assertServiceCapture('PDF capture', pdfSelection.sentence, pdfPath);
  assertServiceCapture('PDF phrase capture', pdfSelection.phrase, pdfPath);
  assertServiceCapture(
    'Word capture',
    'The key sentence I want to remember from this document.',
    fixtures.docx,
  );
  assertServiceCapture('Excel capture', 'Metric\tValue\nActivation\t42%\nRetention\t31%', fixtures.csv);

  const snapshot = persistPdfFocusedSnapshot(readLearningExperimentSnapshot({ allowFileLevelEvidence: true }));
  writeLearningExperimentReport(snapshot, 'native-services-smoke', fixtures);
  console.log('Native Services capture smoke passed.');
  console.log(`pdf=${pdfPath}`);
}

function main() {
  writeHelpers();

  if (preflightOnly) {
    writePreflightReport();
    return;
  }

  if (reportOnly) {
    const fixtures = makeFixtures();
    const snapshot = reportOnlySnapshot(readSnapshotForReport(), fixtures);
    writeFileSync(currentSnapshotPath, JSON.stringify(snapshot, null, 2));
    writeLearningExperimentReport(snapshot, 'snapshot-only', fixtures);
    return;
  }

  if (serviceCaptureOnly) {
    withRestoredUserSnapshot('native-services-smoke', runServicesCaptureSmoke);
    return;
  }

  withRestoredUserSnapshot('native-sidecar-gui', () => {
    requirePath('Installed Loom app', appPath);
    requirePath('PDF fixture', pdfPath);
    assertConsoleUnlocked();
    const fixtures = makeFixtures();
    const pdfSelection = pdfLearningSelections();

    stopRunningLoom();
    openAppBundle(appPath);
    openFileWithLoom(pdfPath);
    let result = assertCompanion('PDF file open through Loom');
    assertNativeSurface('PDF file-open windows', result.windows, 'Preview', pdfTitle);
    assertLoomStaysCompanion('PDF file-open windows', result.windows);
    assertServiceCapture('PDF capture', pdfSelection.sentence, pdfPath);
    result = assertCompanion('PDF capture');
    assertNativeSurface('PDF windows', result.windows, 'Preview', pdfTitle);
    assertLoomIsNotFrontmost('PDF capture focus');
    assertLoomStaysCompanion('PDF windows', result.windows);
    captureCompanion('pdf-companion', result.companion);
    assertServiceCapture('PDF phrase capture', pdfSelection.phrase, pdfPath);
    result = assertCompanion('PDF phrase capture');
    assertNativeSurface('PDF phrase windows', result.windows, 'Preview', pdfTitle);
    assertLoomIsNotFrontmost('PDF phrase capture focus');
    assertLoomStaysCompanion('PDF phrase windows', result.windows);

    openFileWithLoom(fixtures.docx);
    result = assertCompanion('Word file open through Loom');
    assertNativeSurface('Word file-open windows', result.windows, 'Microsoft Word', 'Loom Word Learning Notes');
    assertLoomStaysCompanion('Word file-open windows', result.windows);
    assertServiceCapture(
      'Word capture',
      'The key sentence I want to remember from this document.',
      fixtures.docx,
    );
    result = assertCompanion('Word capture');
    assertNativeSurface('Word windows', result.windows, 'Microsoft Word', 'Loom Word Learning Notes');
    assertLoomIsNotFrontmost('Word capture focus');
    assertLoomStaysCompanion('Word windows', result.windows);
    captureCompanion('word-companion', result.companion);

    openFileWithLoom(fixtures.csv);
    result = assertCompanion('Excel file open through Loom');
    assertNativeSurface('Excel file-open windows', result.windows, 'Microsoft Excel', 'Loom Excel Learning Table');
    assertLoomStaysCompanion('Excel file-open windows', result.windows);
    assertServiceCapture('Excel capture', 'Metric\tValue\nActivation\t42%\nRetention\t31%', fixtures.csv);
    result = assertCompanion('Excel capture');
    assertNativeSurface('Excel windows', result.windows, 'Microsoft Excel', 'Loom Excel Learning Table');
    assertLoomIsNotFrontmost('Excel capture focus');
    assertLoomStaysCompanion('Excel windows', result.windows);
    captureCompanion('excel-companion', result.companion);
    assertReceiptDoesNotPersist('Final saved receipt behavior');

    const finalWindows = readWindows();
    assertLoomStaysCompanion('Final Loom surface', finalWindows);

    const snapshot = persistPdfFocusedSnapshot(readLearningExperimentSnapshot());

    writeLearningExperimentReport(snapshot, 'native-sidecar-gui', fixtures);
    console.log('Native sidecar verification passed.');
    console.log(`pdf=${pdfPath}`);
  });
}

main();
