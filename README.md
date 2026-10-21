# ttf2woff2-wasm

Convert TTF and OTF (CFF-flavored OpenType) fonts to WOFF2 format. WASM build of [0x6b/ttf2woff2](https://github.com/0x6b/ttf2woff2).

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

OTF/CFF input is supported starting with v0.14.1, using the same API:

```js
const otf = fs.readFileSync("font.otf");
const woff2 = ttf2woff2(otf);
fs.writeFileSync("font.woff2", woff2);
```

## Migration from nfroidure/ttf2woff2

package.json:

```diff
-"ttf2woff2": "^3.0.0"
+"@0x6b/ttf2woff2-wasm": "^0.14.1"
```

Your code:

```diff
-const ttf2woff2 = require('ttf2woff2');
+const ttf2woff2 = require('@0x6b/ttf2woff2-wasm');

const woff2 = ttf2woff2(ttfBuffer);
```

## API

### `ttf2woff2(input: Buffer | Uint8Array, options?: { transformGlyfLoca?: boolean }): Buffer`

Convert TTF or OTF/CFF font data to WOFF2 format synchronously.

### Encoding behavior

For OTF/CFF input, CFF tables are preserved without transformation and only Brotli-compressed: the WOFF2 specification defines no CFF transformation. The `transformGlyfLoca` option has no effect on these fonts.

The WASM encoder uses Brotli quality 11. By default, `transformGlyfLoca` is `false`: the original `glyf`/`loca` tables are preserved without transformation and are still Brotli-compressed. Disabling transformation avoids glyph reconstruction that can make some fonts incompatible with Chromium and Google's WOFF2 decoder, at the cost of potentially larger output. Existing one-argument calls use this default.

To explicitly enable transformation:

```js
const woff2 = ttf2woff2(ttf, { transformGlyfLoca: true });
```

Transformation can reduce output size, but reconstructed glyph offsets can exceed the range of a short `loca` table, causing affected fonts to be rejected by Chromium or Google's decoder. Validate transformed output with your target browsers and decoders before using it.

## Benchmark

Measured on Linux x64 in an Amp Orb (8 vCPUs, Intel Xeon @ 2.60 GHz), Node.js v26.10.0, using [ttf2woff2](https://www.npmjs.com/package/ttf2woff2) v8.0.0 and a release build of ttf2woff2-wasm v0.14.0. Results are specific to these fonts and this environment.

### Conversion Performance

Each variant runs sequentially with 3 warm-up conversions followed by 10 timed conversions. Input files are read before timing, module initialization is excluded, and garbage collection is requested before each timed batch via `--expose-gc`. The script reports mean, minimum, maximum, and output size; the table shows the mean.

| Input | Variant | Mean conversion time | Output size |
| ----- | ------- | -------------------: | ----------: |
| WarpnineSans-Regular.ttf (269.1 KiB) | native | 1,554 ms | 82,180 bytes |
| | WASM default | 995 ms | 89,020 bytes |
| | WASM opt-in | 867 ms | 80,444 bytes |
| NotoSansJP-Medium.ttf (5.5 MiB) | native | 24,468 ms | 2,375,784 bytes |
| | WASM default | 21,231 ms | 2,779,880 bytes |
| | WASM opt-in | 15,732 ms | 2,322,440 bytes |

The native measurement loads the compiled addon directly and fails if it is unavailable, rather than silently measuring that package's WASM fallback. WASM uses Brotli quality 11: default leaves `glyf`/`loca` untransformed, while opt-in sets `transformGlyfLoca: true`. These modes have different size/compatibility tradeoffs; opt-in is not a recommendation for all fonts. See [Encoding behavior](#encoding-behavior).

Memory usage is not compared: JavaScript heap deltas do not capture native allocations, WASM linear memory, or peak process memory.

Run from the repository root:

```console
$ cargo xtask build
$ cd bench
$ npm install ttf2woff2@8.0.0
$ node --expose-gc benchmark.cjs
```

### Package Size

| Package                 | Unpacked package |
| ----------------------- | ---------------- |
| ttf2woff2-wasm v0.14.0   | ≈0.92 MiB        |
| ttf2woff2 v8.0.0         | ≈4.20 MiB        |

Sizes are the npm tarball contents after unpacking, excluding dependencies and generated native build artifacts, not total installation disk usage. The WASM size is from the local release build (`npm pack --dry-run --json ./pkg`); the native package size is from npm metadata (`npm view ttf2woff2@8.0.0 dist.unpackedSize`). The WASM package requires no native compilation.

## CI and releases

Pull requests run WASM unit tests and Node.js package tests on Linux, macOS, and Windows with Node.js 24, plus Clippy and Rust formatting checks. CI can also be run manually from the Actions tab.

Releases use [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC), without a stored npm token. Before the first release, configure the trusted publisher for `@0x6b/ttf2woff2-wasm` on npmjs.com:

- Organization or user: `0x6b`
- Repository: `ttf2woff2-wasm`
- Workflow filename: `release.yml`
- Environment name: `release`
- Allow direct publishing with `npm publish`.

Configure the GitHub `release` environment with any required approval or tag restrictions. npm requires a new trusted publisher to complete its first successful publish within two days of configuration, so set it up close to the first release.

To release, update `Cargo.toml` and `js/package.json` to the same stable version, merge the tested changes, then push the corresponding `vX.Y.Z` tag. The release workflow rejects mismatched versions and prerelease tags, reruns WASM and Node.js tests, and publishes the built `pkg/` directory to npm as `latest`. It does not create a GitHub Release or publish to crates.io.

## License

- The [Noto Sans Japanese](https://fonts.google.com/noto/specimen/Noto+Sans+JP) font in [tests/fixtures/](tests/fixtures) is licensed under [OFL](https://fonts.google.com/noto/specimen/Noto+Sans+JP/license).
- The [WarpnineSans](https://github.com/0x6b/warpnine-fonts) font in [tests/fixtures/](tests/fixtures) is licensed under [OFL](https://github.com/0x6b/warpnine-fonts/blob/main/OFL).
- Everything else is dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
