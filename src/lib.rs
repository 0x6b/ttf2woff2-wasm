use ttf2woff2::{BrotliQuality, EncodeOptions, encode_with_options};
use wasm_bindgen::prelude::*;

/// Convert TTF font data to WOFF2 format.
///
/// Preserves the original glyf/loca tables unless transformation is explicitly enabled.
///
/// # Arguments
/// * `ttf_data` - The TTF font data as a byte array
/// * `quality` - Brotli compression quality (0-11, default: 11)
/// * `transform_glyf_loca` - Enable glyf/loca transformation (default: false).
///   Transformed output may be rejected by Chromium or Google's WOFF2 decoder.
///
/// # Returns
/// The WOFF2 compressed font data
#[wasm_bindgen]
pub fn convert(
    ttf_data: &[u8],
    quality: Option<u8>,
    transform_glyf_loca: Option<bool>,
) -> Result<Vec<u8>, JsError> {
    let options = EncodeOptions {
        quality: BrotliQuality::from(quality.unwrap_or(11)),
        transform_glyf_loca: transform_glyf_loca.unwrap_or(false),
        ..EncodeOptions::default()
    };
    encode_with_options(ttf_data, options).map_err(|e| JsError::new(&e.to_string()))
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;

    use super::*;

    #[wasm_bindgen_test]
    fn convert_empty_returns_error() {
        let result = convert(&[], None, None);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn convert_invalid_returns_error() {
        let result = convert(&[0, 1, 2, 3], None, None);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn convert_ttf_to_woff2() {
        let ttf = include_bytes!("../tests/fixtures/WarpnineSans-Regular.ttf");
        let result = convert(ttf, None, None).expect("conversion should succeed");
        // WOFF2 magic number: 'wOF2'
        assert_eq!(&result[0..4], b"wOF2");
        // Should be significantly smaller than TTF input
        assert!(result.len() < ttf.len() / 3, "compression ratio too low");
    }
}
