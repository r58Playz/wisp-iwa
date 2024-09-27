import Term, { ReadPort, ResizeClosure, WriteClosure } from "../term";
// @ts-ignore
import { Tabs } from "m3-dreamland";

const Twisp: Component<{}, {
	terms: { name: string, id: string, read: ReadPort, write: WriteClosure, resize: ResizeClosure }[],
	currentTerm: string
}> = function() {
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

	const self = this;
	function remove_term(term_id: string) {
		self.terms = self.terms.filter(({ id }) => id !== term_id);
	}

	this.mount = async () => {
		// test code until i hook up wisp: `websocat ws-listen:127.0.0.1:5000 cmd:'cat' --binary`
		for (const x of [1, 2, 3]) {
			const ws = new WebSocket("ws://localhost:5193/test");
			ws.binaryType = 'arraybuffer';
			const channel = new MessageChannel();
			ws.onmessage = (e) => {
				channel.port1.postMessage(e.data);
			}
			const write = (e: Uint8Array) => ws.send(e);
			const resize = (c: number, r: number) => { };
			const symbol = crypto.randomUUID();
			ws.onclose = () => { remove_term(symbol) };
			this.currentTerm = symbol;
			this.terms = [...this.terms, {
				name: "Terminal " + x,
				id: symbol,
				read: channel.port2,
				write: write,
				resize: resize
			}];
		}
	}

	return (
		<div>
			<Tabs
				primary={true}
				bind:items={use(this.terms, x => x.map(({ name, id }) => { return { name: name, value: id } }))}
				bind:tab={use(this.currentTerm)}
			/>
			{use(this.terms, x => x.map(({ id, read, write, resize }) => {
				return (
					<div class={use`terminal ${use(this.currentTerm, x => x === id ? "" : "inactive")}`}>
						<Term read={read} write={write} resize={resize} />
					</div>
				);
			}))}
		</div>
	);
};

export default Twisp;
