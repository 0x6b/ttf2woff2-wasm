const { readFileSync } = require('fs');
const { performance } = require('perf_hooks');

const fixtures = [
  '../tests/fixtures/WarpnineSans-Regular.ttf',
  '../tests/fixtures/NotoSansJP-Medium.ttf',
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function benchmark(name, fn, iterations = 10) {
  // Warm up
  for (let i = 0; i < 3; i++) fn();

  // Force GC if available
  if (global.gc) global.gc();

  const times = [];
  const memBefore = process.memoryUsage().heapUsed;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const memAfter = process.memoryUsage().heapUsed;
  const memDelta = memAfter - memBefore;

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { name, avg, min, max, memDelta };
}

// Load implementations
let original, wasm;
try {
  const mod = require('ttf2woff2');
  original = mod.default || mod;
} catch {
  console.log('ttf2woff2 not installed, run: npm install ttf2woff2');
}

try {
  wasm = require('../pkg/index.js');
} catch {
  console.log('WASM build not found, run: cd .. && cargo xtask build');
}

if (!original || !wasm) process.exit(1);

console.log('Benchmark: ttf2woff2 (native) vs ttf2woff2-wasm');
console.log('Run with --expose-gc for accurate memory measurements\n');

for (const path of fixtures) {
  const name = path.split('/').pop();
  const ttf = readFileSync(path);

  console.log(`${name} (${formatBytes(ttf.length)})`);
  console.log('─'.repeat(60));

  const orig = benchmark('native', () => original(ttf));
  const wasmRes = benchmark('wasm', () => wasm(ttf));

  const speedup = orig.avg / wasmRes.avg;
  const memRatio = Math.abs(orig.memDelta) / Math.abs(wasmRes.memDelta);

  console.log(`  native: avg=${orig.avg.toFixed(0)}ms  mem=${formatBytes(Math.abs(orig.memDelta))}`);
  console.log(`  wasm:   avg=${wasmRes.avg.toFixed(0)}ms  mem=${formatBytes(Math.abs(wasmRes.memDelta))}`);
  console.log(`  → ${speedup.toFixed(1)}x faster, ${memRatio.toFixed(1)}x less memory\n`);
}
