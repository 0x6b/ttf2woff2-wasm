const { readFileSync } = require('fs');
const { createHash } = require('crypto');
const { strict: assert } = require('assert');
const ttf2woff2 = require('../pkg/index.js');

const fixtures = [
  {
    name: 'WarpnineSans-Regular.ttf',
    expectedSize: 89020,
    expectedHash: 'c8bbfb41170591b5817557c6cb427887fb57f2bea0d268ffac3192e3c71524b7',
  },
  {
    name: 'NotoSansJP-Medium.ttf',
    expectedSize: 2779880,
    expectedHash: '9c81190cf79b7dbccf93be1ab84f84fa6bce5469799f65c7000a33e35ae749ec',
  },
];

for (const { name, expectedSize, expectedHash } of fixtures) {
  const ttf = readFileSync(`./tests/fixtures/${name}`);
  const result = ttf2woff2(ttf);
  const resultHash = createHash('sha256').update(result).digest('hex');

  assert.equal(result.length, expectedSize, `${name}: size mismatch: got ${result.length}, expected ${expectedSize}`);
  assert.equal(resultHash, expectedHash, `${name}: hash mismatch: got ${resultHash}`);

  console.log(`✓ ${name} (${result.length} bytes)`);
}
