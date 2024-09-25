import 'dreamland/dev';
import { Route, Router } from 'dreamland-router';
import type { IconifyIcon } from "@iconify/types";

import iconInsertChart from "@ktibow/iconset-material-symbols/insert-chart";
import iconInsertChartOutline from "@ktibow/iconset-material-symbols/insert-chart-outline";
import iconCodeBlocks from "@ktibow/iconset-material-symbols/code-blocks";
import iconCodeBlocksOutline from "@ktibow/iconset-material-symbols/code-blocks-outline";
import iconSettings from "@ktibow/iconset-material-symbols/settings";
import iconSettingsOutline from "@ktibow/iconset-material-symbols/settings-outline";
import iconLan from "@ktibow/iconset-material-symbols/lan";
import iconLanOutline from "@ktibow/iconset-material-symbols/lan-outline";

// @ts-ignore
import { Styles, NavList, NavListButton } from 'm3-dreamland';

import './index.css';
import { settings } from './store';
import Status from './routes/status';
import Settings from './routes/settings';
import Twisp from './routes/twisp';
import Ports from './routes/ports';

if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
	window.trustedTypes.createPolicy('default', {
		createHTML: string => string
	});
}

const Layout: Component<{
	outlet: HTMLElement,
	routeshow: (path: string) => void,
	routeshown: boolean
}, {
	currentpath: string,
	routes: { path: string, sicon: IconifyIcon, icon: IconifyIcon, label: string }[],
}> = function() {
	this.routeshow = (path) => {
		this.currentpath = path;
	};
	this.css = `
		display: flex;
		min-height: 100vh;

		.navbar {
			position: sticky;
			align-self: flex-start;
			display: flex;
			width: 5rem;
			flex-shrink: 0;
		}

		.content {
			padding: 1rem;
			min-width: 0;
		}

		.content:has(.loading) {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		@media (width < 37.5rem) {
			& {
				flex-direction: column-reverse;
				--m3-util-bottom-offset: 5rem;
			}
			.navbar {
				bottom: 0;
				width: 100%;
				z-index: 3;
			}
			.content {
				flex: 1;
			}
			.items {
				display: contents;
			}
		}

		@media (min-width: 37.5rem) {
			.content {
				flex-grow: 1;
				padding: 1.5rem;
			}
			.navbar {
				top: 0;
				left: 0;
				flex-direction: column;
				min-height: 100vh;
			}
			.items {
				display: flex;
				flex-direction: column;
				gap: 0.75rem;
				justify-content: center;
			}
		}
	`;

	this.routes = [
		{
			path: "status",
			icon: iconInsertChartOutline,
			sicon: iconInsertChart,
			label: "Status",
		},
		{
			path: "twisp",
			icon: iconCodeBlocksOutline,
			sicon: iconCodeBlocks,
			label: "Terminals",
		},
		{
			path: "ports",
			icon: iconLanOutline,
			sicon: iconLan,
			label: "Ports",
		},
		{
			path: "settings",
			icon: iconSettingsOutline,
			sicon: iconSettings,
			label: "Settings",
		},
	];

	return (
		<div>
			<div class="navbar">
				<NavList type="auto">
					<div class="items">
						{this.routes.map(x => {
							return (
								<NavListButton
									bind:icon={use(this.currentpath, y => y === x.path ? x.sicon : x.icon)}
									bind:selected={use(this.currentpath, y => y === x.path)}
									on:click={() => router.navigate(x.path)}
								>
									{x.label}
								</NavListButton>
							);
						})}
					</div>
				</NavList>
			</div>
			<div class="content">
				{use(this.outlet)}
			</div>
		</div>
	)
}

const NotFound: Component<{}, {}> = function() {
	return (
		<div>
			404
		</div>
	)
}

let router = new Router(
	<Route>
		<Route path="" show={<Layout />}>
			<Route path="status" show={<Status />} />
			<Route path="twisp" show={<Twisp />} />
			<Route path="ports" show={<Ports />} />
			<Route path="settings" show={<Settings />} />
		</Route>
		<Route path="*" show={<NotFound />} />
	</Route>
)

const App: Component<{}, { renderRoot: HTMLElement, backgroundEl: HTMLElement, bgColor: string }> = function() {
	this.css = `
		.background {
			background-color: rgb(var(--m3-scheme-background));
		}
	`;
	this.mount = () => {
		router.mount(this.renderRoot);
	}

	useChange([use(settings.lightTheme), use(settings.darkTheme)], ()=>{
		setTimeout(()=>{
			this.bgColor = getComputedStyle(this.backgroundEl).backgroundColor;
		}, 10);
	});

	return (
		<div id="app">
			<meta name="theme-color" content={use(this.bgColor)} />
			<span bind:this={use(this.backgroundEl)} class="background" />
			<Styles
				bind:light={use(settings.lightTheme)}
				bind:dark={use(settings.darkTheme)} />
			<div bind:this={use(this.renderRoot)} />
		</div>
	);
}

window.addEventListener('load', () => {
	try {
		document.getElementById('app')!.replaceWith(<App />);
	} catch (err) {
		document.getElementById('app')!.replaceWith(document.createTextNode("Error while rendering: " + err));
		console.error(err);
	}
});

