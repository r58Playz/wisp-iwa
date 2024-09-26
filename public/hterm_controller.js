import { hterm } from "./hterm.js";

await hterm.initPromise;

const t = new hterm.Terminal();
const portPromise = new Promise(r => {
	window.addEventListener("message", (e) => {
		r(e.data);
	});
});
t.onTerminalReady = async () => {
	const io = t.io.push();
	const port = await portPromise;
	const encoder = new TextEncoder();

	io.onVTKeystroke = (str) => {
		port.postMessage({ type: "data", data: encoder.encode(str) });
	}
	io.sendString = (str) => {
		port.postMessage({ type: "data", data: encoder.encode(str) });
	}
	io.onTerminalResize = (col, row) => {
		port.postMessage({ type: "resize", cols: col, rows: row });
	}

	port.onmessage = (e) => {
		if (e.data.type === "data") {
			io.writeUTF8(e.data.data);
		}
	};
	console.log("ready", port);
}

t.decorate(document.querySelector("#terminal"));
t.installKeyboard();
