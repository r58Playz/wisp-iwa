import { create_tcp } from "../wasm";

class TcpForwarder {
	localPort: number;
	remoteHost: string;
	remotePort: number;
	socket: TCPServerSocket;
	clients: { id: Symbol, socket: TCPSocket }[] = [];

	constructor(localPort: number, remoteHost: string, remotePort: number) {
		this.localPort = localPort;
		this.remoteHost = remoteHost;
		this.remotePort = remotePort;
		this.socket = new TCPServerSocket("127.0.0.1", { localPort: localPort });
	}

	async forward() {
		let opened = await this.socket.opened;
		// @ts-expect-error
		for await (const _client of opened.readable) {
			const client = _client as TCPSocket;
			const symbol = Symbol();
			(async () => {
				const opened = await client.opened;
				const stream = await create_tcp(this.remoteHost, this.remotePort);

				this.clients.push({ id: symbol, socket: client });
				try {
					await Promise.race([opened.readable.pipeTo(stream.write), stream.read.pipeTo(opened.writable)]);
				} catch (err) {
					console.warn("forwarding failed: ", err);
				}
				client.close();
				this.clients = this.clients.filter(({ id }) => id !== symbol);
			})();
		}
	}

	async close() {
		await Promise.all([...this.clients.map(({ socket }) => socket.close()), this.socket.close()]);
	}
}

(window as any).TcpForwarder = TcpForwarder;

const Ports: Component<{}, {}> = function() {
	return (
		<div>
			a HTTP?? in the TCP/UDP stream?? how queer!! ive never seen such a thing- i must inquire about this further with vk6 post-haste!!
		</div>
	);
};

export default Ports;
