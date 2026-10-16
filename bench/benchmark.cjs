const { readFileSync } = require('fs');
const { strict: assert } = require('assert');
const { arch, cpus, platform } = require('os');
const { performance } = require('perf_hooks');

const fixtures = [
  '../tests/fixtures/WarpnineSans-Regular.ttf',
  '../tests/fixtures/NotoSansJP-Medium.ttf',
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MiB';
}

function benchmark(fn, iterations = 10) {
  // Warm up
  for (let i = 0; i < 3; i++) fn();

  // Force GC if available
  if (global.gc) global.gc();

  const times = [];
  let output;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    output = fn();
    times.push(performance.now() - start);
  }

  assert.ok(Buffer.isBuffer(output));
  assert.equal(output.subarray(0, 4).toString(), 'wOF2');

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { avg, min, max, size: output.length };
}

// Load implementations
let original, wasm;
try {
  // Load the native addon directly: the package entry point can silently
  // fall back to its own WASM implementation if native loading fails.
  original = require('ttf2woff2/build/Release/addon.node').convert;
} catch {
  console.log('Native addon not available; run: npm install ttf2woff2@8.0.0 and check its native build succeeds');
}

try {
  wasm = require('../pkg/index.js');
} catch {
  console.log('WASM build not found, run: cd .. && cargo xtask build');
}

if (!original || !wasm) process.exit(1);

console.log(`Node.js ${process.version}; ${platform()} ${arch()}; ${cpus()[0].model}`);
console.log(`ttf2woff2 ${require('ttf2woff2/package.json').version} (native addon) vs ttf2woff2-wasm ${require('../pkg/package.json').version}`);
console.log('3 warm-up conversions, then 10 timed conversions per variant; input read outside timing.');
console.log('Optional: run with --expose-gc to collect garbage before each timed batch.\n');

for (const path of fixtures) {
  const name = path.split('/').pop();
  const ttf = readFileSync(path);

  console.log(`${name} (${formatBytes(ttf.length)})`);
  console.log('─'.repeat(60));

  for (const [variant, convert] of [
    ['native', () => original(ttf)],
    ['wasm default', () => wasm(ttf)],
    ['wasm opt-in', () => wasm(ttf, { transformGlyfLoca: true })],
  ]) {
    const result = benchmark(convert);
    console.log(`  ${variant}: avg=${result.avg.toFixed(0)}ms  min=${result.min.toFixed(0)}ms  max=${result.max.toFixed(0)}ms  output=${result.size} bytes`);
  }
  console.log();
}
