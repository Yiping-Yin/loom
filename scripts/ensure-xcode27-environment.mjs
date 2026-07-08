#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function fail(message) {
  console.error(`Xcode 27 environment check failed: ${message}`);
  process.exit(1);
}

const xcodeVersion = run('/usr/bin/xcodebuild', ['-version']);
if (!/^Xcode 27\.0\b/m.test(xcodeVersion)) {
  fail(`expected Xcode 27.0, got:\n${xcodeVersion}`);
}

const sdkVersion = run('/usr/bin/xcrun', ['--sdk', 'macosx', '--show-sdk-version']);
if (sdkVersion !== '27.0') {
  fail(`expected macOS SDK 27.0, got ${sdkVersion}`);
}

const developerDir = run('/usr/bin/xcode-select', ['-p']);
if (developerDir !== '/Applications/Xcode.app/Contents/Developer') {
  fail(`expected /Applications/Xcode.app/Contents/Developer, got ${developerDir}`);
}

console.log('Xcode 27 environment ok');
