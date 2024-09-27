import init from "../rust/pkg/wisp_iwa_rust";
await init({ module_or_path: "./wisp_iwa_rust_bg.wasm" });

export { hi } from "../rust/pkg/wisp_iwa_rust";

