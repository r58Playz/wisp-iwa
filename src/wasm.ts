import init from "../rust/pkg/wisp_iwa_rust";

export { hi } from "../rust/pkg/wisp_iwa_rust";

export async function initWasm() {
	await init({ module_or_path: "./wisp_iwa_rust_bg.wasm" });
}
