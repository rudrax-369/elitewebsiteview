import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, '..', 'public', 'ezgif-696aee2f9bbf4735-png-split');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'frames');
const QUALITY = 75;
const CONCURRENCY = 8; // parallel conversions

// We'll use every frame (all 240) but convert PNG→WebP for massive size savings
// The JS will request webp frames instead

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const pad = (n, size = 3) => String(n).padStart(size, '0');

async function convertFrame(frameNum) {
  const inputFile = path.join(INPUT_DIR, `ezgif-frame-${pad(frameNum)}.png`);
  const outputFile = path.join(OUTPUT_DIR, `frame-${pad(frameNum)}.webp`);

  if (!fs.existsSync(inputFile)) return null;

  await sharp(inputFile)
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(outputFile);

  return outputFile;
}

async function runWithConcurrency(tasks, limit) {
  let index = 0;
  let completed = 0;
  const total = tasks.length;

  async function worker() {
    while (index < tasks.length) {
      const task = tasks[index++];
      await task();
      completed++;
      if (completed % 20 === 0 || completed === total) {
        process.stdout.write(`\r  Converting frames... ${completed}/${total} (${Math.round(completed/total*100)}%)`);
      }
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
}

console.log(`\n🚀 Converting ${240} PNG frames → WebP (quality ${QUALITY})`);
console.log(`   Output: ${OUTPUT_DIR}\n`);

const startTime = Date.now();

const tasks = Array.from({ length: 240 }, (_, i) => () => convertFrame(i + 1));
await runWithConcurrency(tasks, CONCURRENCY);

// Calculate savings
const inputSize = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.png'))
  .reduce((sum, f) => sum + fs.statSync(path.join(INPUT_DIR, f)).size, 0);

const outputSize = fs.readdirSync(OUTPUT_DIR)
  .filter(f => f.endsWith('.webp'))
  .reduce((sum, f) => sum + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const savings = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

console.log(`\n\n✅ Done in ${elapsed}s`);
console.log(`   Input:   ${(inputSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`   Output:  ${(outputSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`   Saved:   ${savings}% 🎉`);
