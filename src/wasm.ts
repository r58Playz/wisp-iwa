import init, { WispIwa } from "../rust/pkg/wisp_iwa_rust";
import { settings } from "./store";
import { ReadPort, ResizeClosure, WriteClosure } from "./term";
await init({ module_or_path: "./wisp_iwa_rust_bg.wasm" });

export let status: Stateful<{ connected: boolean }> = $state({ connected: false });

let client: WispIwa | undefined;

async function get_client(): Promise<WispIwa> {
	if (client) {
		return client;
	} else {
		// @ts-expect-warning typescript is stupid...
		client = await new WispIwa(settings.wisp, (e: string) => {
			console.warn("disconnected", e);
			status.connected = false;
		});
		return client;
	}
}

export async function reconnect(): Promise<void> {
	let client = await get_client();
	await client.replace_mux();
	status.connected = true;
}

export async function create_twisp(term: string): Promise<{ read: ReadPort, write: WriteClosure, resize: ResizeClosure, id: number }> {
	const client = await get_client();
	const stream: {
		read: ReadableStream,
		write: WritableStream,
		resize: (rows: number, cols: number) => Promise<void>,
		id: number
	} = await client.new_twisp(term) as any;

	const writer = stream.write.getWriter();

	const write = (x: Uint8Array) => {
		writer.write(x);
	}
	const resize = (cols: number, rows: number) => {
		console.log("resizing to ", cols, rows);
		stream.resize(rows, cols);
	}

	const channel = new MessageChannel();
	(async () => {
		// @ts-expect-error again... typescript is stupid...
		for await (const item: Uint8Array of stream.read) {
			channel.port1.postMessage({ type: "data", data: item });
		}
		channel.port1.postMessage({ type: "close" });
	})();

	return { read: channel.port2, write: write, resize: resize, id: stream.id };
}
