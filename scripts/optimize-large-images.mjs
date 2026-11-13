import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');

function getAllImages(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllImages(fullPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.webp', '.png', '.jpg', '.jpeg'].includes(ext)) {
        if (stat.size > 1024 * 1024) { // > 1MB
          results.push({ path: fullPath, size: stat.size, ext });
        }
      }
    }
  }
  return results;
}

async function optimize() {
  const images = getAllImages(PUBLIC_DIR);
  console.log(`Found ${images.length} images larger than 1MB to optimize.`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const item of images) {
    totalOriginal += item.size;
    const rel = path.relative(PUBLIC_DIR, item.path);
    try {
      const img = sharp(item.path);
      const meta = await img.metadata();

      let pipeline = img.resize({
        width: 2200,
        height: 2200,
        fit: 'inside',
        withoutEnlargement: true,
      });

      let buffer;
      if (item.ext === '.webp') {
        buffer = await pipeline.webp({ quality: 82, effort: 5 }).toBuffer();
      } else if (item.ext === '.png') {
        // High quality PNG compression
        buffer = await pipeline.png({ compressionLevel: 9, quality: 85 }).toBuffer();
      } else {
        buffer = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      }

      if (buffer.length < item.size) {
        fs.writeFileSync(item.path, buffer);
        totalOptimized += buffer.length;
        const savedMB = ((item.size - buffer.length) / (1024 * 1024)).toFixed(2);
        const percent = (((item.size - buffer.length) / item.size) * 100).toFixed(1);
        console.log(`✓ Optimized "${rel}": ${(item.size / 1024 / 1024).toFixed(2)}MB -> ${(buffer.length / 1024 / 1024).toFixed(2)}MB (saved ${savedMB}MB, -${percent}%)`);
      } else {
        totalOptimized += item.size;
        console.log(`= Skipped "${rel}" (already optimal)`);
      }
    } catch (err) {
      totalOptimized += item.size;
      console.error(`✗ Error optimizing "${rel}":`, err.message);
    }
  }

  const origMB = (totalOriginal / 1024 / 1024).toFixed(2);
  const optMB = (totalOptimized / 1024 / 1024).toFixed(2);
  const savedTotalMB = ((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2);
  console.log(`\n===========================================`);
  console.log(`Total original: ${origMB} MB`);
  console.log(`Total optimized: ${optMB} MB`);
  console.log(`Total saved: ${savedTotalMB} MB (${(((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1)}% reduction)`);
  console.log(`===========================================`);
}

optimize();

