const { convert } = require('./ttf2woff2_wasm.js');

function ttf2woff2(inputContent) {
    const input = inputContent instanceof Uint8Array 
        ? inputContent 
        : new Uint8Array(inputContent);
    return Buffer.from(convert(input));
}

module.exports = ttf2woff2;
module.exports.default = ttf2woff2;
module.exports.ttf2woff2 = ttf2woff2;
