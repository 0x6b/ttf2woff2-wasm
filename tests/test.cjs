const { readFileSync } = require('fs');
const { createHash } = require('crypto');
const { strict: assert } = require('assert');
const ttf2woff2 = require('../pkg/index.js');

const fixtures = [
  {
    name: 'WarpnineSans-Regular.ttf',
    expectedSize: 80444,
    expectedHash: '908b3b850363bb854d0e15235aacc78a01eea0dc9fe36c1dfc1455a9a76b43a2',
  },
  {
    name: 'NotoSansJP-Medium.ttf',
    expectedSize: 2322440,
    expectedHash: 'fc468e182077775416b83056f131845f8fa1ba347ea629d7e8973ea8348ea094',
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
