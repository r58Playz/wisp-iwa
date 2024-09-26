import Term, { ReadPort, ResizeClosure, WriteClosure } from "../term";
// @ts-ignore
import { Tabs } from "m3-dreamland";

const Twisp: Component<{}, { terms: [string, ReadPort, WriteClosure, ResizeClosure][], currentTerm: string }> = function() {
	this.css = `
		height: 100%;
		display: flex;
		flex-direction: column;

		.terminal {
			flex: 1;
		}

		.inactive {
			display: none;
		}
	`;

	this.terms = [];

	this.mount = async () => {
		// test code until i hook up wisp: `websocat ws-listen:127.0.0.1:5000 cmd:'cat' --binary`
		for (const _ of [1, 2, 3]) {
			const ws = new WebSocket("ws://localhost:5193/test");
			ws.binaryType = 'arraybuffer';
			const channel = new MessageChannel();
			ws.onmessage = (e) => {
				channel.port1.postMessage(e.data);
			}
			const write = (e: Uint8Array) => ws.send(e);
			const resize = (c: number, r: number) => { };
			const symbol = crypto.randomUUID();
			this.currentTerm = symbol;
			this.terms = [...this.terms, [symbol, channel.port2, write, resize]];
		}
	}

	return (
		<div>
			<Tabs
				primary={true}
				bind:items={use(this.terms, x => x.map(([sym]) => { return { name: "Terminal", value: sym } }))}
				bind:tab={use(this.currentTerm)}
			/>
			{use(this.terms, x => x.map(([sym, r, w, resize]) => {
				return (
					<div class={use`terminal ${use(this.currentTerm, x => x === sym ? "" : "inactive")}`}>
						<Term read={r} write={w} resize={resize} />
					</div>
				);
			}))}
		</div>
	);
};

export default Twisp;
