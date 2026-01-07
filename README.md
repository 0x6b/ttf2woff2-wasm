# ttf2woff2-wasm

Convert TTF fonts to WOFF2 format. WASM build of [0x6b/ttf2woff2](https://github.com/0x6b/ttf2woff2).

Drop-in replacement for [nfroidure/ttf2woff2](https://www.npmjs.com/package/ttf2woff2) with zero native dependencies.

> [!NOTE]
> This package uses a different Brotli implementation, so the output may differ in size from nfroidure/ttf2woff2. Please verify the output fonts work correctly in your target environment before deploying to production.

## Installation

```console
$ npm install @0x6b/ttf2woff2-wasm
```

## Usage

```js
const ttf2woff2 = require("@0x6b/ttf2woff2-wasm");
const fs = require("fs");

const ttf = fs.readFileSync("font.ttf");
const woff2 = ttf2woff2(ttf);
fs.writeFileSync("font.woff2", woff2);
```

## Migration from nfroidure/ttf2woff2

package.json:

```diff
-"ttf2woff2": "^3.0.0"
+"@0x6b/ttf2woff2-wasm": "^0.10.3"
```

Your code:

```diff
-const ttf2woff2 = require('ttf2woff2');
+const ttf2woff2 = require('@0x6b/ttf2woff2-wasm');

const woff2 = ttf2woff2(ttfBuffer);
```

## API

### `ttf2woff2(input: Buffer | Uint8Array): Buffer`

Convert TTF font data to WOFF2 format synchronously.

## Benchmark

Compared with [ttf2woff2](https://www.npmjs.com/package/ttf2woff2) v8.0.0 on Apple M4 Pro:

### Conversion Performance

```
WarpnineSans-Regular.ttf (269 KB)
  native: avg=930ms  mem=45.9 KB
  wasm:   avg=387ms  mem=21.3 KB
  → 2.4x faster, 2.2x less memory

NotoSansJP-Medium.ttf (5.5 MB)
  native: avg=13592ms  mem=20.6 KB
  wasm:   avg=7807ms   mem=11.4 KB
  → 1.7x faster, 1.8x less memory
```

Run locally: `cd bench && npm install ttf2woff2 && node --expose-gc benchmark.cjs`

### Package Size

| Package                | Installed |
| ---------------------- | --------- |
| ttf2woff2-wasm v0.10.3 | 972 KB    |
| ttf2woff2 v8.0.0       | 11 MB     |

11x smaller installed size (no native compilation needed).

## License

- The [Noto Sans Japanese](https://fonts.google.com/noto/specimen/Noto+Sans+JP) font in [tests/fixtures/](tests/fixtures) is licensed under [OFL](https://fonts.google.com/noto/specimen/Noto+Sans+JP/license).
- The [WarpnineSans](https://github.com/0x6b/warpnine-fonts) font in [tests/fixtures/](tests/fixtures) is licensed under [OFL](https://github.com/0x6b/warpnine-fonts/blob/main/OFL).
- Everything else is dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
