import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeIco } from './icon-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const brandDir = path.join(publicDir, 'brand');
const appIconDir = path.join(root, 'macos-app', 'Loom', 'Assets.xcassets', 'AppIcon.appiconset');

const lunarSource = path.join(brandDir, 'loom_lunar_comet_icon.png');
const lunarSvg = path.join(brandDir, 'loom_lunar_comet_icon.svg');

function resize(source, size, output) {
  execFileSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), source, '--out', output], {
    stdio: 'ignore',
  });
}

function requireSource(file) {
  if (!existsSync(file)) {
    throw new Error(`Missing icon source: ${path.relative(root, file)}`);
  }
}

mkdirSync(publicDir, { recursive: true });
mkdirSync(brandDir, { recursive: true });
mkdirSync(appIconDir, { recursive: true });

requireSource(lunarSource);
requireSource(lunarSvg);

copyFileSync(lunarSource, path.join(brandDir, 'loom_icon_var6.png'));
copyFileSync(lunarSource, path.join(brandDir, 'loom_app_icon_macos.png'));
copyFileSync(lunarSvg, path.join(publicDir, 'icon.svg'));

resize(lunarSource, 512, path.join(publicDir, 'icon.png'));
resize(lunarSource, 180, path.join(publicDir, 'apple-touch-icon.png'));
resize(lunarSource, 64, path.join(publicDir, 'favicon-64.png'));

const faviconPng = readFileSync(path.join(publicDir, 'favicon-64.png'));
writeFileSync(path.join(publicDir, 'favicon.ico'), makeIco(faviconPng, 64));

for (const size of [16, 32, 64, 128, 256, 512, 1024]) {
  resize(lunarSource, size, path.join(appIconDir, `icon_${size}.png`));
}

console.log('Generated Loom Moon Ledger icons from public/brand/loom_lunar_comet_icon.png.');
