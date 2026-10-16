declare function ttf2woff2(
    inputContent: Uint8Array | Buffer,
    options?: {
        /** Enable glyf/loca transformation. Default: false. May produce fonts rejected by Chromium or Google's WOFF2 decoder. */
        transformGlyfLoca?: boolean;
    },
): Buffer;
export = ttf2woff2;
