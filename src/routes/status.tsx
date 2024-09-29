import { reconnect, status } from "../wasm";
// @ts-ignore
import { Card, Button, Icon } from "m3-dreamland";

import iconSettingsEthernet from "@ktibow/iconset-material-symbols/settings-ethernet";
import { settings } from "../store";

const Status: Component<{}, {}> = function() {
	this.css = `
		.container {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1em;
		}

		.error {
			color: rgb(var(--m3-scheme-error));
		}
		.connect {
			display: flex;
			flex-direction: row;
			gap: 1em;
			align-items: center;
		}

		@media (max-width: 800px) {
			.container {
				display: flex;
				flex-direction: column;
			}
		}
	`
	return (
		<div>
			<h1 class="m3-font-headline-large">Status</h1>
			<div class="container">
				<Card type="filled">
					<span>Connected: {use(status.connected, x => x ? "Yes" : "No")}</span>
					{$if(use(status.connected), <span>Wisp server: {use(status.wisp)}</span>)}
				</Card>
				<Card type="filled">
					<div class="connect">
						<Button type="tonal" on:click={reconnect} iconType="left"><Icon icon={iconSettingsEthernet} />Connect</Button>
						{$if(use(settings.wisp, x => x.length === 0), <span class="error">No Wisp server set!</span>)}
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Status;
