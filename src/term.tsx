import { settings, terminalTheme } from "./store";

export type ReadPort = MessagePort;
export type WriteClosure = (data: Uint8Array) => void;
export type ResizeClosure = (cols: number, rows: number) => void;
export type RenameClosure = (title: string) => void;

const Term: Component<
	{ read: MessagePort, write: WriteClosure, resize: ResizeClosure, rename: RenameClosure },
	{}
> = function() {
	this.css = `
		border: none;
		width: 100%;
		height: 100%;
	`;
	const channel = new MessageChannel();
	this.mount = () => {
		this.root.addEventListener("load", () => {
			channel.port1.onmessage = (e) => {
				if (e.data.type === "data") {
					this.write(e.data.data);
				} else if (e.data.type === "resize") {
					this.resize(e.data.cols, e.data.rows);
				} else if (e.data.type === "title") {
					this.rename(e.data.title);
				}
			};
			const root = this.root as HTMLIFrameElement;
			root.contentWindow!.postMessage({
				port: channel.port2, 
				fontFamily: settings.termFont,
				webgl: settings.termWebgl,
				theme: JSON.parse(JSON.stringify(terminalTheme)),
			}, { transfer: [channel.port2] });
			this.read.onmessage = (e) => {
				if (e.data.type === "data") {
					channel.port1.postMessage({ type: "data", data: e.data.data });
				}
			};
		});
	}

	return <iframe src="/term.html" />
};

export default Term;
