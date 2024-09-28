import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { ImageAddon } from "@xterm/addon-image";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const portPromise: Promise<{ port: MessagePort, fontFamily: string }> = new Promise(r => {
	window.addEventListener("message", (e) => {
		r(e.data);
	});
});

const { port, fontFamily } = await portPromise;

const root = document.body;

const term = new Terminal();
const encoder = new TextEncoder();
const fit = new FitAddon();

term.options.fontFamily = fontFamily;

term.loadAddon(fit);
term.loadAddon(new WebLinksAddon());
term.loadAddon(new ClipboardAddon());
term.loadAddon(new ImageAddon());

term.onData((str) => {
	port.postMessage({ type: "data", data: encoder.encode(str) });
})

term.onResize(({ cols, rows }) => {
	port.postMessage({ type: "resize", rows: rows, cols: cols });
})

term.onTitleChange((title) => {
	port.postMessage({ type: "title", title: title });
})

term.open(root);
fit.fit();

port.onmessage = (e) => {
	if (e.data.type === "data") {
		term.write(e.data.data);
	}
};

const resize = new ResizeObserver(() => {
	fit.fit();
});
resize.observe(root);
