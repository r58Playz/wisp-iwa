mkdir pkg
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' cargo build --target wasm32-unknown-unknown -Z build-std=panic_abort,std --release "$@"
wasm-bindgen --target web --out-dir pkg/ target/wasm32-unknown-unknown/release/wisp_iwa_rust.wasm
