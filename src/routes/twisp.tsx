import Term from "../term";
import { Tabs, TextField, Button, Icon } from "m3-dreamland";
import iconAdd from "@ktibow/iconset-material-symbols/add";
import { settings } from "../store";
import { create_twisp } from "../wasm";
import { IframeSafeList } from "../iframesafelist";

const Twisp: Component<{}, {
	terms: { name: string, id: string, el: DLElement<typeof Term> }[],
	currentTerm: string,
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
	function remove_term(term_id: string) {
		let idx = self.terms.findIndex(({ id }) => id === term_id);
		self.terms = self.terms.filter(({ id }) => id !== term_id);
		if (self.terms.length) {
			let id = self.terms[Math.min(Math.max(0, idx - 1), self.terms.length - 1)].id;
			self.currentTerm = id;
		}
	}

	function rename_term(term_id: string, title: string) {
		let idx = self.terms.findIndex(({ id }) => id === term_id);
		let terms = self.terms;
		terms[idx].name = title;
		self.terms = terms;
	}

	async function create_term() {
		const term = await create_twisp(settings.termPath);
		const id = "" + term.id;
		term.read.addEventListener("message", (e) => {
			if (e.data.type === "close") {
				remove_term(id);
			}
		});
		const rename = (title: string) => {
			rename_term(id, title);
		};
		self.terms = [...self.terms, {
			el: <Term read={term.read} write={term.write} resize={term.resize} rename={rename} />,
			id: id,
			name: "Stream ID " + id
		}];
		self.currentTerm = id;
	}

	return (
		<div>
			<div class="create">
				<TextField bind:value={use(settings.termPath)} name="Command to execute" />
				<Button type="tonal" iconType="left" on:click={create_term}><Icon icon={iconAdd} />New</Button>
			</div>
			{$if(use(this.terms, x => x.length === 0), undefined,
				<Tabs
					items={use(this.terms, x => x.map(({ name, id }) => { return { name: name, value: id } }))}
					bind:tab={use(this.currentTerm)}
				/>
			)}
			<IframeSafeList list={use(this.terms, x => x.map(({ el, id }) => { return { el: el, id: id } }))} bind:active={use(this.currentTerm)} />
		</div>
	);
};

export default Twisp;
