import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const source = path.join(root, 'public', 'brand', 'loom_icon_var6.png');

mkdirSync(publicDir, { recursive: true });
await sharp(source)
  .resize(512, 512, { fit: 'contain' })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(publicDir, 'icon-bold.png'));
console.log('Generated icon-bold.png from loom_icon_var6.png');
