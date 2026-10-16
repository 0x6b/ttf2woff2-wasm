const { readFileSync } = require('fs');
const { createHash } = require('crypto');
const { strict: assert } = require('assert');
const ttf2woff2 = require('../pkg/index.js');

const fixtures = [
  {
    name: 'WarpnineSans-Regular.ttf',
    expectedSize: 89020,
    expectedHash: 'c8bbfb41170591b5817557c6cb427887fb57f2bea0d268ffac3192e3c71524b7',
    transformedSize: 80444,
    transformedHash: '908b3b850363bb854d0e15235aacc78a01eea0dc9fe36c1dfc1455a9a76b43a2',
  },
  {
    name: 'NotoSansJP-Medium.ttf',
    expectedSize: 2779880,
    expectedHash: '9c81190cf79b7dbccf93be1ab84f84fa6bce5469799f65c7000a33e35ae749ec',
    transformedSize: 2322440,
    transformedHash: 'fc468e182077775416b83056f131845f8fa1ba347ea629d7e8973ea8348ea094',
  },
];

function assertTransformVersion(result, name, expectedVersion) {
  assert.equal(result.subarray(0, 4).toString(), 'wOF2');
  let offset = 48;
  let glyfLocaTables = 0;
  for (let i = 0; i < result.readUInt16BE(12); i++) {
    const flags = result[offset++];
    const tagIndex = flags & 0x3f;
    const tag = tagIndex === 63 ? result.subarray(offset, offset + 4).toString() : null;
    if (tagIndex === 63) offset += 4;
    const isGlyfLoca = tagIndex === 10 || tagIndex === 11 || tag === 'glyf' || tag === 'loca';
    const transformVersion = flags >> 6;
    if (isGlyfLoca) {
      assert.equal(transformVersion, expectedVersion, `${name}: unexpected glyf/loca transform version`);
      glyfLocaTables++;
    }
    // Skip UIntBase128 original length, then transformed length if present.
    while (result[offset++] & 0x80) {}
    if (isGlyfLoca ? transformVersion !== 3 : transformVersion !== 0) {
      while (result[offset++] & 0x80) {}
    }
  }
  assert.equal(glyfLocaTables, 2, `${name}: missing glyf/loca tables`);
}

for (const { name, expectedSize, expectedHash, transformedSize, transformedHash } of fixtures) {
  const ttf = readFileSync(`./tests/fixtures/${name}`);
  const result = ttf2woff2(ttf);
  const resultHash = createHash('sha256').update(result).digest('hex');

  assert.ok(Buffer.isBuffer(result));
  assertTransformVersion(result, name, 3); // Null transform by default.
  assert.equal(result.length, expectedSize, `${name}: size mismatch: got ${result.length}, expected ${expectedSize}`);
  assert.equal(resultHash, expectedHash, `${name}: hash mismatch: got ${resultHash}`);
  assert.deepEqual(ttf2woff2(ttf, {}), result, `${name}: empty options must preserve defaults`);
  assert.deepEqual(ttf2woff2(ttf, { transformGlyfLoca: false }), result, `${name}: explicit false must preserve defaults`);

  const transformed = ttf2woff2(new Uint8Array(ttf), { transformGlyfLoca: true });
  assert.ok(Buffer.isBuffer(transformed));
  assertTransformVersion(transformed, name, 0);
  assert.equal(transformed.length, transformedSize, `${name}: transformed size mismatch`);
  assert.equal(createHash('sha256').update(transformed).digest('hex'), transformedHash, `${name}: transformed hash mismatch`);

  console.log(`✓ ${name} (default: ${result.length} bytes; opt-in: ${transformed.length} bytes)`);
}
