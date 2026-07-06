import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const source = path.join(root, 'public', 'brand', 'loom_icon_var6.png');
const generate8kPreview = process.env.LOOM_GENERATE_8K_ICON_PREVIEW === '1';

mkdirSync(publicDir, { recursive: true });
await sharp(source)
  .resize(512, 512, { fit: 'contain' })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(publicDir, 'icon-apple-preview.png'));
if (generate8kPreview) {
  await sharp(source, { limitInputPixels: false })
    .resize(8192, 8192, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(publicDir, 'icon-apple-preview-8k.png'));
  console.log('Generated icon-apple-preview.png and icon-apple-preview-8k.png from loom_icon_var6.png');
} else {
  console.log('Generated icon-apple-preview.png from loom_icon_var6.png; kept existing icon-apple-preview-8k.png');
}
