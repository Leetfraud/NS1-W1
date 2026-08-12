// scripts/optimize-images.mjs
// Convert mockup sources (png/jpg) to WebP for the portfolio panel + deck.
//
//   npm run images            → every png/jpg in assets/mockups
//   npm run images auri       → only files whose name starts with "auri"
//   npm run images -- --force → re-encode even if a .webp already exists
//
// Sources stay on disk untouched; this only writes siblings. The site is
// WebP-only by design — every browser that can render the portfolio page
// (aspect-ratio, mask-image, backdrop-filter) supports WebP, so there is no
// <picture> fallback to maintain.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'assets', 'mockups');
const QUALITY = 80;
const MAX_EDGE = 2400;   // no mockup is displayed larger than this, even at 2× DPR

const args    = process.argv.slice(2);
const force   = args.includes('--force');
const filters = args.filter(a => !a.startsWith('--'));

const kb = bytes => Math.round(bytes / 1024);

const files = (await readdir(DIR))
  .filter(f => /\.(png|jpe?g)$/i.test(f))
  .filter(f => !filters.length || filters.some(p => f.startsWith(p)))
  .sort();

if (!files.length) {
  console.log('No matching sources in assets/mockups.');
  process.exit(0);
}

let before = 0, after = 0;

for (const file of files) {
  const src  = path.join(DIR, file);
  const dest = src.replace(/\.(png|jpe?g)$/i, '.webp');

  if (!force) {
    try { await stat(dest); console.log(`skip   ${file} (webp exists, use --force)`); continue; }
    catch { /* no webp yet — encode it */ }
  }

  const img  = sharp(src);
  const meta = await img.metadata();
  const tooBig = Math.max(meta.width, meta.height) > MAX_EDGE;

  await img
    .resize(tooBig ? { width: MAX_EDGE, height: MAX_EDGE, fit: 'inside' } : undefined)
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(dest);

  const srcSize = (await stat(src)).size;
  const outSize = (await stat(dest)).size;
  before += srcSize; after += outSize;

  const dims = tooBig ? ` (capped to ${MAX_EDGE}px)` : '';
  const pct  = Math.round((1 - outSize / srcSize) * 100);
  console.log(`ok     ${file} → ${path.basename(dest)}  ${kb(srcSize)} KB → ${kb(outSize)} KB  (−${pct}%)${dims}`);
}

if (before) {
  console.log(`\ntotal  ${kb(before)} KB → ${kb(after)} KB  (−${Math.round((1 - after / before) * 100)}%)`);
}
