use ttf2woff2::{BrotliQuality, encode};
use wasm_bindgen::prelude::*;

/// Convert TTF font data to WOFF2 format.
///
/// # Arguments
/// * `ttf_data` - The TTF font data as a byte array
/// * `quality` - Brotli compression quality (0-11, default: 11)
///
/// # Returns
/// The WOFF2 compressed font data
#[wasm_bindgen]
pub fn convert(ttf_data: &[u8], quality: Option<u8>) -> Result<Vec<u8>, JsError> {
    let q = BrotliQuality::from(quality.unwrap_or(11));
    encode(ttf_data, q).map_err(|e| JsError::new(&e.to_string()))
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;

    use super::*;

    #[wasm_bindgen_test]
    fn convert_empty_returns_error() {
        let result = convert(&[], None);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn convert_invalid_returns_error() {
        let result = convert(&[0, 1, 2, 3], None);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn convert_ttf_to_woff2() {
        let ttf = include_bytes!("../tests/fixtures/WarpnineSans-Regular.ttf");
        let result = convert(ttf, None).expect("conversion should succeed");
        // WOFF2 magic number: 'wOF2'
        assert_eq!(&result[0..4], b"wOF2");
        // Should be significantly smaller than TTF input
        assert!(result.len() < ttf.len() / 3, "compression ratio too low");
    }
}
