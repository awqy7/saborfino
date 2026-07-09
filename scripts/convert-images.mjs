import sharp from 'sharp';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, renameSync } from 'fs';
import { join, extname, dirname, basename, relative } from 'path';

const PROJECT = 'C:\\Users\\awqy\\saborfino';
const PUBLIC = join(PROJECT, 'public');
const IMAGES = join(PUBLIC, 'images');
const DISHES = join(IMAGES, 'dishes');

// Parse cardapio.js / HomeCardapio.jsx to find all referenced image paths
function findReferencedImages() {
  const paths = new Set();
  const files = [
    join(PROJECT, 'src', 'data', 'cardapio.js'),
    join(PROJECT, 'src', 'pages', 'HomeCardapio.jsx'),
  ];
  const re = /['"`]([^'"`]*\.(jpg|jpeg|png|webp|avif))['"`]/gi;
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    let m;
    while ((m = re.exec(content)) !== null) {
      if (!m[1].startsWith('http')) paths.add(m[1].replace(/^\//, ''));
    }
  }
  return paths;
}

// Collect all image files from directory
function collectImages(dir) {
  const result = [];
  if (!existsSync(dir)) return result;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { result.push(...collectImages(full)); }
    else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) result.push(full);
  }
  return result;
}

const referenced = findReferencedImages();
const allImages = collectImages(IMAGES);

const relPublic = f => '/' + relative(PUBLIC, f).replace(/\\/g, '/');
const allPublicPaths = new Set(allImages.map(f => relPublic(f)));

// Unused images
const unusedImages = allImages.filter(f => !referenced.has(relPublic(f).replace(/^\//, '')));
const unusedSize = unusedImages.reduce((s, f) => s + readFileSync(f).length, 0);

console.log('=== REFERENCIADAS ===');
console.log([...referenced].sort().map(p => `  ${p}`).join('\n'));
console.log(`Total: ${referenced.size}\n`);

console.log('=== NÃO REFERENCIADAS ===');
for (const f of unusedImages) {
  console.log(`  ${relPublic(f)} (${(readFileSync(f).length / 1024).toFixed(1)}KB)`);
}
console.log(`Total: ${unusedImages.length} (${(unusedSize / 1024 / 1024).toFixed(1)}MB)\n`);

// --- CONVERSION ---
const QUALITY_DISH = 80;
const QUALITY_BG = 70;
const MAX_W = 184;

let ok = 0, errs = 0, skip = 0;
const TMP = join(PROJECT, 'scripts', '.tmp');
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

for (const rel of referenced) {
  const abs = join(PUBLIC, rel);
  if (!existsSync(abs)) {
    console.warn(`  [SKIP] não encontrado: ${rel}`);
    skip++; continue;
  }

  const isBg = /(category-background|hero|reference)/i.test(rel);
  const isDish = rel.startsWith('images/dishes/') && !isBg;

  try {
    const buf = readFileSync(abs);
    const img = sharp(buf);
    const meta = await img.metadata();

    let w = meta.width, h = meta.height;
    if (isDish && w > MAX_W) {
      h = Math.round(h * MAX_W / w);
      w = MAX_W;
      img.resize(w, h, { fit: 'cover', position: 'centre' });
    }

    const outName = rel.replace(/\.(jpg|jpeg|png|avif)$/i, '.webp');
    const outAbs = join(PUBLIC, outName);
    const tmpFile = join(TMP, basename(outAbs) + '.tmp');

    await img.webp({ quality: isBg ? QUALITY_BG : QUALITY_DISH }).toFile(tmpFile);

    if (existsSync(outAbs)) unlinkSync(outAbs);
    renameSync(tmpFile, outAbs);

    const newSize = readFileSync(outAbs).length;
    const reduction = ((1 - newSize / buf.length) * 100).toFixed(1);
    const sizeInfo = `(${(buf.length / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB, ${reduction}%)`;

    console.log(`  [OK] ${rel}  ${meta.width}x${meta.height} → ${w}x${h} ${sizeInfo}`);
    ok++;
  } catch (e) {
    // Try without resize for webp files that failed
    try {
      const buf = readFileSync(abs);
      const outName = rel.replace(/\.(jpg|jpeg|png|avif)$/i, '.webp');
      const outAbs = join(PUBLIC, outName);
      const tmpFile = join(TMP, basename(outAbs) + '.tmp');

      await sharp(buf).webp({ quality: QUALITY_DISH }).toFile(tmpFile);
      if (existsSync(outAbs)) unlinkSync(outAbs);
      renameSync(tmpFile, outAbs);
      
      const newSize = readFileSync(outAbs).length;
      const reduction = ((1 - newSize / buf.length) * 100).toFixed(1);
      console.log(`  [OK fallback] ${rel} (${(buf.length/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB, ${reduction}%)`);
      ok++;
    } catch (e2) {
      console.error(`  [ERR] ${rel}: ${e2.message}`);
      errs++;
    }
  }
}

// Cleanup temp dir
try {
  for (const f of readdirSync(TMP)) unlinkSync(join(TMP, f));
  unlinkSync(TMP);
} catch {}

console.log(`\n=== RESUMO ===`);
console.log(`OK: ${ok}  |  Erros: ${errs}  |  Pulados: ${skip}`);
