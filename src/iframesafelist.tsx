import Term from "./term";

function difference(a: string[], b: string[]) {
	return a.filter(x => !b.includes(x));
}

export const IframeSafeList: Component<{ list: { el: DLElement<typeof Term>, id: string }[], active: string }, { oldList: string[], oldId: string }> = function() {
	this.css = `
		position: relative;
		width: 100%;
		height: 100%;
		* {
			position: absolute;
			top: 0;
			left: 0;
		}
		.hidden {
			visibility: hidden;
		}
	`;
	this.oldList = [];
	this.oldId = "";
	this.mount = () => {
		useChange([this.list, this.active], () => {
			this.root.querySelector(`[data-id="${this.oldId}"]`)?.classList.add("hidden");
			this.root.querySelector(`[data-id="${this.active}"]`)?.classList.remove("hidden");
			this.oldId = this.active;

			const ids = this.list.map(({ id }) => id);
			const removed = difference(this.oldList, ids);
			const added = difference(ids, this.oldList);
			for (const id of removed) {
				this.root.querySelector(`[data-id="${id}"]`)?.remove();
			}
			for (const id of added) {
				const el = this.list.find(({ id: x }) => x === id)!;
				el.el.setAttribute("data-id", "" + id);
				this.root.appendChild(el.el);
			}
			this.oldList = ids;
		});
	};
	return <div></div>;
}
