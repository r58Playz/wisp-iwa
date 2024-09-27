import Term, { ReadPort, ResizeClosure, WriteClosure } from "../term";
// @ts-ignore
import { Tabs, TextField, Button, Icon } from "m3-dreamland";
import iconAdd from "@ktibow/iconset-material-symbols/add";
import { settings } from "../store";
import { create_twisp, status } from "../wasm";

const Twisp: Component<{}, {
	terms: { name: string, id: number, read: ReadPort, write: WriteClosure, resize: ResizeClosure }[],
	currentTerm: number
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

		.create {
			display: flex;
			flex-direction: row;
			gap: 1em;
			align-items: center;
		}

		.create > span:has(.TextField-m3-container) {
			flex: 1;
		}
		.TextField-m3-container {
			width: 100%;
		}

		.empty {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	`;

	this.terms = [];

	const self = this;
	function remove_term(term_id: number) {
		self.terms = self.terms.filter(({ id }) => id !== term_id);
	}

	async function create_term() {
		const term = await create_twisp(settings.termPath);
		term.read.addEventListener("message", (e)=>{
			if (e.data.type === "close") {
				remove_term(term.id);
			}
		});
		self.terms = [...self.terms, { read: term.read, write: term.write, resize: term.resize, id: term.id, name: "Stream ID " + term.id }]
		self.currentTerm = term.id;
	}

	return (
		<div>
			{$if(use(status.connected, x => !x), <div class="empty">Not connected</div>, <>
				<div class="create">
					<TextField bind:value={use(settings.termPath)} name="Command to execute" />
					<Button type="tonal" iconType="left" on:click={create_term}><Icon icon={iconAdd} />New</Button>
				</div>
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
			</>)}
		</div>
	);
};

export default Twisp;
