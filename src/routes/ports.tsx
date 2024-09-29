import { create_tcp } from "../wasm";

// @ts-ignore
import { Card, TextField, Button, Icon } from "m3-dreamland";
import iconSwapHoriz from "@ktibow/iconset-material-symbols/swap-horiz";

class TcpForwarder {
	localPort: number;
	remoteHost: string;
	remotePort: number;
	socket: TCPServerSocket;
	stateful: Stateful<{ clients: { id: Symbol, stream_id: number, socket: TCPSocket }[] }> = $state({ clients: [] });

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

				this.stateful.clients = [...this.stateful.clients, { id: symbol, stream_id: stream.id, socket: client }];
				console.log(this.stateful.clients);
				try {
					await Promise.race([opened.readable.pipeTo(stream.write), stream.read.pipeTo(opened.writable)]);
				} catch (err) {
					console.warn("forwarding failed: ", err);
				}
				client.close();
				this.stateful.clients = this.stateful.clients.filter(({ id }) => id !== symbol);
				console.log(this.stateful.clients);
			})();
		}
	}

	async close() {
		await Promise.all([...this.stateful.clients.map(({ socket }) => socket.close()), this.socket.close()]);
	}
}

const TcpForwardingSession: Component<{ forwarder: TcpForwarder }, {}> = function() {
	this.css = `
		.client-list {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}
	`;
	return (
		<div>
			<Card type="filled">
				<div class="m3-font-title-medium">127.0.0.1:{this.forwarder.localPort} to {this.forwarder.remoteHost}:{this.forwarder.remotePort}</div>
				<div class="client-list">
					{use(this.forwarder.stateful.clients, x => x.map(x => {
						return (
							<div>Stream ID {x.stream_id}</div>
						)
					}))}
				</div>
			</Card>
		</div>
	)
}

const Ports: Component<{ forwarders: TcpForwarder[], localPort: string, remoteHost: string, remotePort: string }, {}> = function() {
	this.forwarders = [];
	this.localPort = "8000";
	this.remoteHost = "";
	this.remotePort = "";

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
		}
	`;

	const self = this;
	const addForwarder = async () => {
		// @ts-ignore
		const forwarder = await new TcpForwarder(+self.localPort, self.remoteHost, +self.remotePort);
		self.forwarders = [...self.forwarders, forwarder];
		await forwarder.forward();
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
					return <TcpForwardingSession forwarder={x} />
				}))}
			</div>
		</div>
	);
};

export default Ports;
