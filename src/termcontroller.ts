import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const portPromise = new Promise(r => {
	window.addEventListener("message", (e) => {
		r(e.data);
	});
});

const port: MessagePort = await portPromise as any;

const term = new Terminal();
const encoder = new TextEncoder();
const fit = new FitAddon();

term.loadAddon(fit);
term.loadAddon(new WebLinksAddon());
term.loadAddon(new ClipboardAddon());

term.onData((str) => {
	port.postMessage({ type: "data", data: encoder.encode(str) });
})

term.onResize(({cols, rows}) => {
	port.postMessage({ type: "resize", rows: rows, cols: cols });
})

const root = document.querySelector("#terminal")! as HTMLElement;
term.open(root);
fit.fit();

port.onmessage = (e) => {
	if (e.data.type === "data") {
		term.write(e.data.data);
	}
};

const resize = new ResizeObserver(()=>{
	fit.fit();
});
resize.observe(root);
