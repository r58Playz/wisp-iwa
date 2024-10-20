import 'dreamland/dev';
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

// @ts-ignore
if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
	// @ts-ignore
	window.trustedTypes.createPolicy('default', {
		createHTML: (x: string) => x
	});
}

const Layout: Component<{}, {
	routes: { path: string, sicon: IconifyIcon, icon: IconifyIcon, label: string, el: HTMLElement }[],
}> = function() {
	this.css = `
		flex: 1;
		display: flex;

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

		.view {
			width: 100%;
			height: 100%;
		}
		.inactive {
			display: none;
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
			el: <Status />
		},
		{
			path: "twisp",
			icon: iconCodeBlocksOutline,
			sicon: iconCodeBlocks,
			label: "Terminals",
			el: <Twisp />
		},
		{
			path: "ports",
			icon: iconLanOutline,
			sicon: iconLan,
			label: "Ports",
			el: <Ports />
		},
		{
			path: "settings",
			icon: iconSettingsOutline,
			sicon: iconSettings,
			label: "Settings",
			el: <Settings />
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
									type="auto"

									icon={use(settings.page, y => y === x.path ? x.sicon : x.icon)}
									selected={use(settings.page, y => y === x.path)}

									on:click={() => settings.page = x.path}
								>
									{x.label}
								</NavListButton>
							);
						})}
					</div>
				</NavList>
			</div>
			<div class="content">
				{this.routes.map(route => {
					return (
						<div class={use`view ${use(settings.page, x => x === route.path ? "" : "inactive")}`}>
							{route.el}
						</div>
					)
				})}
			</div>
		</div>
	)
}

const App: Component<{}, { renderRoot: HTMLElement, backgroundEl: HTMLElement, bgColor: string }> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		height: 100%;

		.background {
			background-color: rgb(var(--m3-scheme-background));
		}
	`;

	useChange([use(settings.lightTheme), use(settings.darkTheme)], () => {
		setTimeout(() => {
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

			<Layout />
		</div>
	);
}

try {
	document.getElementById('app')!.replaceWith(<App />);
} catch (err) {
	document.getElementById('app')!.replaceWith(document.createTextNode("Error while rendering: " + err));
	console.error(err);
}
