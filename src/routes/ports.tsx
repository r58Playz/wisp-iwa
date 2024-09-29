import { create_tcp } from "../wasm";

// @ts-ignore
import { Card, TextField, Button, Icon } from "m3-dreamland";
import iconSwapHoriz from "@ktibow/iconset-material-symbols/swap-horiz";

type TcpForwarderClient = { id: Symbol, streamId: number, remoteHost: string, remotePort: number, socket: TCPSocket, close: () => void };

class TcpForwarder {
	localPort: number;
	remoteHost: string;
	remotePort: number;
	socket: TCPServerSocket;
	stateful: Stateful<{ clients: TcpForwarderClient[] }>;
	closePromise: Promise<{ value?: TCPSocket, done: boolean }>;
	// @ts-expect-error yes it is...
	closeResolve: (value: { value?: TCPSocket, done: boolean }) => void;

	constructor(localPort: number, remoteHost: string, remotePort: number) {
		this.localPort = localPort;
		this.remoteHost = remoteHost;
		this.remotePort = remotePort;
		this.socket = new TCPServerSocket("127.0.0.1", { localPort: localPort });
		this.stateful = $state({ clients: [] });
		this.closePromise = new Promise(r => this.closeResolve = r);
	}

	async forward() {
		let opened = await this.socket.opened;
		const reader = opened.readable.getReader();
		while (true) {
			const { value: client, done } = await Promise.race([reader.read(), this.closePromise]);
			if (!client || done) break;

			const symbol = Symbol();
			(async () => {
				const opened = await client.opened;
				const stream = await create_tcp(this.remoteHost, this.remotePort);
				let closeResolve = () => { };
				const closePromise: Promise<void> = new Promise(r => closeResolve = r);

				this.stateful.clients = [...this.stateful.clients, {
					id: symbol,
					streamId: stream.id,
					remotePort: opened.remotePort,
					remoteHost: opened.remoteAddress,
					socket: client,
					close: closeResolve,
				}];
				const abort = new AbortController();
				const readPipe = opened.readable.pipeTo(stream.write, { signal: abort.signal });
				const writePipe = stream.read.pipeTo(opened.writable, { signal: abort.signal });
				try {
					await Promise.race([readPipe, writePipe, closePromise]);
				} catch (err) {
					console.warn("forwarding failed: ", err);
				}
				abort.abort();
				client.close();
				this.stateful.clients = this.stateful.clients.filter(({ id }) => id !== symbol);
			})();
		}
		reader.cancel();
		this.socket.close();
	}

	async close() {
		this.stateful.clients.forEach(({ close }) => close());
		this.closeResolve({ done: true });
	}
}

const Ports: Component<{ forwarders: TcpForwarder[], localPort: string, remoteHost: string, remotePort: string }, {}> = function() {
	this.forwarders = [];
	this.localPort = "8000";
	this.remoteHost = "localhost";
	this.remotePort = "5901";

	this.css = `
		.controls {
			display: flex;
			flex-direction: row;
			gap: 1em;
			align-items: center;
		}
		.controls .port {
			flex: 1;
		}
		.controls .host {
			flex: 2;
		}
		.TextField-m3-container {
			width: 100%;
			min-width: 10rem !important;
		}
		.controls .port .TextField-m3-container {
			min-width: 7.5rem !important;
		}

		.forwarderList {
			margin-top: 1em;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1em;
		}
		.forwarderHeader {
			display: flex;
			flex-direction: row;
			align-items: center;
		}
		.grow {
			flex: 1;
		}
		.clientList {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}

		@media (max-width: 800px) {
			.forwarderList {
				display: flex;
				flex-direction: column;
			}
		}

		@media (max-width: 700px) {
			.controls {
				flex-direction: column;
				align-items: stretch;
			}
		}
	`;

	const self = this;
	const addForwarder = async () => {
		if (self.forwarders.find((x) => x.localPort === +self.localPort)) return;
		// @ts-ignore
		const forwarder = await new TcpForwarder(+self.localPort, self.remoteHost, +self.remotePort);
		self.forwarders = [...self.forwarders, forwarder];
		await forwarder.forward();
	}
	const removeForwarder = async (port: number) => {
		const forwarder = self.forwarders.find(x => x.localPort === port);
		if (forwarder) {
			await forwarder.close();
			self.forwarders = self.forwarders.filter(x => x.localPort !== port);
		}
	}

	return (
		<div>
			<div class="controls">
				<span class="port">
					<TextField name="Local Port" bind:value={use(this.localPort)} bind:error={use(this.localPort, x => +x !== +x)} />
				</span>
				<span class="host">
					<TextField name="Remote Host" bind:value={use(this.remoteHost)} />
				</span>
				<span class="port">
					<TextField name="Remote Port" bind:value={use(this.remotePort)} bind:error={use(this.remotePort, x => +x !== +x)} />
				</span>
				<Button iconType="left" type="tonal" on:click={addForwarder}><Icon icon={iconSwapHoriz} />Forward</Button>
			</div>
			<div class="forwarderList">
				{use(this.forwarders, x => x.map(x => {
					return (
						<Card type="filled">
							<div class="forwarderHeader">
								<span class="m3-font-title-medium">Forwarder</span>
								<span class="grow"></span>
								<Button type="tonal" on:click={() => { removeForwarder(x.localPort) }}>Stop Forwarding</Button>
							</div>
							<div>
								127.0.0.1:{x.localPort} to {x.remoteHost}:{x.remotePort}
							</div>
							<div class="client-list">
								{use(x.stateful.clients, x => x.map(x => {
									return (
										<div>Stream ID {x.streamId}: {x.remoteHost}:{x.remotePort}</div>
									)
								}))}
							</div>
						</Card>
					)
				}))}
			</div>
		</div>
	);
};

export default Ports;
