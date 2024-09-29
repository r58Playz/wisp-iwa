import init, { WispIwa } from "../rust/pkg/wisp_iwa_rust";
import { settings } from "./store";
import { ReadPort, ResizeClosure, WriteClosure } from "./term";
await init({});

export let status: Stateful<{ connected: boolean, wisp: string | null }> = $state({ connected: false, wisp: null });

let client: WispIwa | undefined;

async function get_client(recreate?: boolean): Promise<WispIwa> {
	if (client && status.wisp === settings.wisp && !recreate) {
		return client;
	} else {
		if (client)
			await client.close();

		client = new WispIwa(settings.wisp, settings.certificate, (e: string) => {
			console.warn("disconnected", e);
			status.connected = false;
			status.wisp = null;
		});

		await client.replace_mux();
		status.connected = true;
		status.wisp = settings.wisp;

		return client;
	}
}

export async function reconnect(): Promise<void> {
	await get_client(true);
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

export async function create_tcp(host: string, port: number): Promise<{ read: ReadableStream, write: WritableStream, id: number }> {
	const client = await get_client();
	const stream: {
		read: ReadableStream,
		write: WritableStream,
		id: number
	} = await client.new_tcp(host, port) as any;
	return stream;
}
