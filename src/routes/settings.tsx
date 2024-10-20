import { TextField, TextFieldMultiline, Card, Button, Switch, argbFromHex, genScheme, sourceColorFromImage, hexFromArgb } from "m3-dreamland";
import { settings, terminalTheme } from "../store";

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
	const schemes = ["tonal_spot", "content", "fidelity", "vibrant", "expressive", "neutral", "monochrome"] as const;
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

const ColorPicker: Component<{ description: string, color: string }, { picker: HTMLInputElement }> = function() {
	this.css = `
		display: flex;
		flex-direction: column;

		input {
			visibility: hidden;
			width: 0;
			height: 0;
		}
	`
	return (
		<div>
			<Button type="tonal" on:click={() => { this.picker.click(); }}>{use(this.description)}: {use(this.color, x => x.toUpperCase())}</Button>
			<input type="color" bind:value={use(this.color)} bind:this={use(this.picker)} />
		</div>
	)
}

const Settings: Component<{}, {}> = function() {
	this.css = `
		.TextField-m3-container, .TextFieldMultiline-m3-container {
			width: min(800px, 100%);
		}
		.invalid-url {
			color: rgb(var(--m3-scheme-error));
		}
		.switch-wrapper {
			display: flex;
			align-items: center;
			gap: 1em;
		}
		.themeGrid {
			display: flex;
			flex-wrap: wrap;
			gap: 1em;
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
			<h1 class="m3-font-headline-large">Settings</h1>
			<div>
				<TextField bind:value={use(settings.wisp)} error={use(settings.wisp, x => !testUrl(x))} name="Wisp Server URL" />
				{use(settings.wisp, x => testUrl(x) ? undefined : (
					<div class="m3-font-label-medium invalid-url">
						Invalid URL.
					</div>
				))}
			</div>
			<TextFieldMultiline bind:value={use(settings.certificate)} name="Wisp Certificate Authentication Private Key" />

			<h2 class="m3-font-title-large">Material UI</h2>
			<MaterialSettings />

			<h2 class="m3-font-title-large">Terminal</h2>
			<p>
				Terminal settings only apply to new terminals, not existing ones.
			</p>
			<TextField bind:value={use(settings.termFont)} name="Font" />
			<div class="switch-wrapper">
				<span>WebGL renderer</span>
				<Switch bind:checked={use(settings.termWebgl)} />
			</div>
			<h2 class="m3-font-title-large">Terminal Theme</h2>
			<div class="themeGrid">
				<ColorPicker description="Foreground" bind:color={use(terminalTheme.foreground)} />
				<ColorPicker description="Background" bind:color={use(terminalTheme.background)} />
				<ColorPicker description="Cursor" bind:color={use(terminalTheme.cursor)} />
				<ColorPicker description="Cursor accent" bind:color={use(terminalTheme.cursorAccent)} />
				<ColorPicker description="Selection background" bind:color={use(terminalTheme.selectionBackground)} />
				<ColorPicker description="Selection foreground" bind:color={use(terminalTheme.selectionForeground)} />
				<ColorPicker description="Black" bind:color={use(terminalTheme.black)} />
				<ColorPicker description="Red" bind:color={use(terminalTheme.red)} />
				<ColorPicker description="Green" bind:color={use(terminalTheme.green)} />
				<ColorPicker description="Yellow" bind:color={use(terminalTheme.yellow)} />
				<ColorPicker description="Blue" bind:color={use(terminalTheme.blue)} />
				<ColorPicker description="Magenta" bind:color={use(terminalTheme.magenta)} />
				<ColorPicker description="Cyan" bind:color={use(terminalTheme.cyan)} />
				<ColorPicker description="White" bind:color={use(terminalTheme.white)} />
				<ColorPicker description="Bright black" bind:color={use(terminalTheme.brightBlack)} />
				<ColorPicker description="Bright red" bind:color={use(terminalTheme.brightRed)} />
				<ColorPicker description="Bright green" bind:color={use(terminalTheme.brightGreen)} />
				<ColorPicker description="Bright yellow" bind:color={use(terminalTheme.brightYellow)} />
				<ColorPicker description="Bright blue" bind:color={use(terminalTheme.brightBlue)} />
				<ColorPicker description="Bright magenta" bind:color={use(terminalTheme.brightMagenta)} />
				<ColorPicker description="Bright cyan" bind:color={use(terminalTheme.brightCyan)} />
				<ColorPicker description="Bright white" bind:color={use(terminalTheme.brightWhite)} />
			</div>
		</div>
	);
};

export default Settings;
