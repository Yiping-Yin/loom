import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { makeIco } from './icon-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const brandDir = path.join(publicDir, 'brand');
const appIconDir = path.join(root, 'macos-app', 'Loom', 'Assets.xcassets', 'AppIcon.appiconset');

const interlacedSourceSvg = path.join(root, 'design', 'icon-simplification', 'loom-clever-interlaced-l.svg');
const lunarSource = path.join(brandDir, 'loom_lunar_comet_icon.png');
const lunarSvg = path.join(brandDir, 'loom_lunar_comet_icon.svg');

function monoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Loom interlaced L mark">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 176 147 V 352 H 384" stroke-width="38"/>
    <path d="M 118 262 C 175 221, 243 228, 289 268 C 327 301, 360 319, 419 319" stroke-width="32"/>
    <path d="M 176 147 V 235" stroke-width="38"/>
    <path d="M 176 308 V 352 H 384" stroke-width="38"/>
  </g>
</svg>
`;
}

async function renderPng(size, output) {
  await sharp(interlacedSourceSvg, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

// Current macOS masks app icons into its own squircle and mounts any artwork
// that doesn't fill the canvas on a gray legacy plate (the "ring"). The
// interlaced-L source is a pre-rounded tile with margins, so for the
// AppIcon set we trim the tile, scale it 18% past full bleed (the baked
// corner rounding lands outside the system mask) and back the corners
// with the artwork's own gradient so no transparency survives.
async function renderMacIconPng(size, output) {
  const rendered = await sharp(interlacedSourceSvg, { density: 384 })
    .resize(1600, 1600, { fit: 'contain' })
    .png()
    .toBuffer();
  const tile = await sharp(rendered).trim().png().toBuffer();
  const oversize = Math.round(size * 1.18);
  const offset = Math.floor((oversize - size) / 2);
  const bleed = await sharp(tile)
    .resize(oversize, oversize, { fit: 'fill' })
    .extract({ left: offset, top: offset, width: size, height: size })
    .png()
    .toBuffer();
  const backing = await sharp(bleed)
    .resize(32, 32, { fit: 'fill' })
    .resize(size, size, { fit: 'fill' })
    .removeAlpha()
    .png()
    .toBuffer();
  await sharp(backing)
    .composite([{ input: bleed }])
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

function requireSource(file) {
  if (!existsSync(file)) {
    throw new Error(`Missing icon source: ${path.relative(root, file)}`);
  }
}

mkdirSync(publicDir, { recursive: true });
mkdirSync(brandDir, { recursive: true });
mkdirSync(appIconDir, { recursive: true });

requireSource(interlacedSourceSvg);

copyFileSync(interlacedSourceSvg, lunarSvg);
copyFileSync(lunarSvg, path.join(publicDir, 'icon.svg'));
copyFileSync(lunarSvg, path.join(publicDir, 'icon-bold.svg'));
copyFileSync(lunarSvg, path.join(publicDir, 'icon-apple-preview.svg'));
copyFileSync(lunarSvg, path.join(brandDir, 'loom_app_icon.svg'));
copyFileSync(lunarSvg, path.join(brandDir, 'loom_app_icon_macos.svg'));
writeFileSync(path.join(publicDir, 'icon-mono.svg'), monoSvg());

await renderPng(1024, lunarSource);
copyFileSync(lunarSource, path.join(brandDir, 'loom_icon_var6.png'));
copyFileSync(lunarSource, path.join(brandDir, 'loom_app_icon_macos.png'));
copyFileSync(lunarSource, path.join(brandDir, 'loom_app_icon_exact_reference.png'));

await renderPng(512, path.join(brandDir, 'loom_app_icon_macos_preview_gray.png'));
await renderPng(512, path.join(brandDir, 'loom_app_icon_macos_preview_light.png'));
await renderPng(256, path.join(brandDir, 'loom_lunar_orb.png'));
await renderPng(512, path.join(publicDir, 'icon.png'));
await renderPng(512, path.join(publicDir, 'icon-bold.png'));
await renderPng(512, path.join(publicDir, 'icon-apple-preview.png'));
await renderPng(180, path.join(publicDir, 'apple-touch-icon.png'));
await renderPng(64, path.join(publicDir, 'favicon-64.png'));

const faviconPng = readFileSync(path.join(publicDir, 'favicon-64.png'));
writeFileSync(path.join(publicDir, 'favicon.ico'), makeIco(faviconPng, 64));

for (const size of [16, 32, 64, 128, 256, 512, 1024]) {
  await renderMacIconPng(size, path.join(appIconDir, `icon_${size}.png`));
}

console.log('Generated Loom interlaced L icons from design/icon-simplification/loom-clever-interlaced-l.svg.');
