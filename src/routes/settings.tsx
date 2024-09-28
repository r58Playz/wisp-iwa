// @ts-ignore
import { TextField, Card, Button, argbFromHex, genScheme, sourceColorFromImage, hexFromArgb } from "m3-dreamland";
import { settings } from "../store";

const transformContrast = function(contrast: number): number {
	return contrast == 0
		? -0.5
		: contrast == 1
			? 0
			: contrast == 2
				? 6 / 12
				: contrast == 3
					? 8 / 12
					: contrast == 4
						? 10 / 12
						: contrast == 5
							? 11 / 12
							: 1
}

const MaterialSettings: Component<{}, { colorSelector: HTMLElement, fileSelector: HTMLInputElement }> = function() {
	const schemes = ["tonal_spot", "content", "fidelity", "vibrant", "expressive", "neutral", "monochrome"];
	useChange([settings.themeScheme, settings.themeColor, settings.themeContrast], () => {
		const { light, dark } = genScheme(schemes[settings.themeScheme], transformContrast(settings.themeContrast), argbFromHex(settings.themeColor));
		settings.lightTheme = light;
		settings.darkTheme = dark;
	});

	this.css = `
		.picker {
			display: flex;
			flex-direction: column;
		}

		.picker input {
			visibility: hidden;	
			width: 0;
			height: 0;
		}

		.buttons {
			display: flex;
			gap: 1em;
		}

		.titlecase {
			text-transform: capitalize;
		}

		@media (max-width: 830px) {
			.buttons {
				flex-direction: column;
				align-items: center;
			}
		}
	`;

	return (
		<div>
			<Card type="filled">
				<div class="buttons">
					<div class="picker">
						<Button type="tonal" on:click={() => { this.colorSelector.click(); }}>Color: {use(settings.themeColor, x => x.toUpperCase())}</Button>
						<input type="color" bind:value={use(settings.themeColor)} bind:this={use(this.colorSelector)} />
					</div>
					<div class="picker">
						<Button type="tonal" on:click={() => { this.fileSelector.click(); }}>Get color from image</Button>
						<input type="file" accept="image/*" bind:this={use(this.fileSelector)} on:change={() => {
							if (!this.fileSelector.files) return;
							const reader = new FileReader();
							reader.onload = async () => {
								const image = new Image();
								image.src = String(reader.result);
								settings.themeColor = hexFromArgb(await sourceColorFromImage(image));
							};
							reader.readAsDataURL(this.fileSelector.files[0]);
						}} />
					</div>
					<Button type="tonal" on:click={() => { settings.themeScheme = (settings.themeScheme + 1) % 7 }}>
						<span class="titlecase">
							Scheme: {use(settings.themeScheme, x => schemes[x].replace("_", " "))}
						</span>
					</Button>
					<Button type="tonal" on:click={() => { settings.themeContrast = (settings.themeContrast + 1) % 7 }}>
						Contrast: {use(settings.themeContrast, x => x + 1)}
					</Button>
				</div>
			</Card>
		</div>
	)
}

const Settings: Component<{}, {}> = function() {
	this.css = `
		.TextField-m3-container {
			width: min(800px, 100%);
		}
		.invalid-url {
			color: rgb(var(--m3-scheme-error));
		}
	`;

	const testUrl = (url: string) => {
		try {
			const parsed = new URL(url);
			if (!(parsed.protocol === "wss:" || parsed.protocol === "ws:")) return false;
			return true;
		} catch {
			return false;
		}
	};

	return (
		<div>
			<h1 class="m3-font-headline-medium">Settings</h1>
			<div>
				<TextField bind:value={use(settings.wisp)} bind:error={use(settings.wisp, x => !testUrl(x))} name="Wisp Server URL" />
				{use(settings.wisp, x => testUrl(x) ? undefined : (
					<div class="m3-font-label-medium invalid-url">
						Invalid URL.
					</div>
				))}
			</div>
			<h2 class="m3-font-title-large">Terminal</h2>
			<TextField bind:value={use(settings.font)} name="Font" />
			<h2 class="m3-font-title-large">Material UI</h2>
			<MaterialSettings />
		</div>
	);
};

export default Settings;
