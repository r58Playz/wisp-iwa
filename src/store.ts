// @ts-ignore
import { SerializedScheme } from "m3-dreamland";

export let settings: Stateful<{
	wisp: string,

	lightTheme: SerializedScheme,
	darkTheme: SerializedScheme,
	themeScheme: number,
	themeColor: string,
	themeContrast: number,
}> = $store({
	wisp: "",
	lightTheme: { "primary": 4285289355, "onPrimary": 4294967295, "primaryContainer": 4293843967, "onPrimaryContainer": 4283710322, "inversePrimary": 4292393722, "secondary": 4284832367, "onSecondary": 4294967295, "secondaryContainer": 4293713399, "onSecondaryContainer": 4283253591, "tertiary": 4286599513, "onTertiary": 4294967295, "tertiaryContainer": 4294957534, "onTertiaryContainer": 4284824386, "error": 4290386458, "onError": 4294967295, "errorContainer": 4294957782, "onErrorContainer": 4287823882, "background": 4294965247, "onBackground": 4280097312, "surface": 4294965247, "onSurface": 4280097312, "surfaceVariant": 4293452011, "onSurfaceVariant": 4283057486, "inverseSurface": 4281544501, "inverseOnSurface": 4294373110, "outline": 4286281087, "outlineVariant": 4291609807, "shadow": 4278190080, "scrim": 4278190080, "surfaceDim": 4292860128, "surfaceBright": 4294965247, "surfaceContainerLowest": 4294967295, "surfaceContainerLow": 4294570489, "surfaceContainer": 4294175731, "surfaceContainerHigh": 4293781230, "surfaceContainerHighest": 4293452008, "surfaceTint": 4285289355 },
	darkTheme: { "primary": 4292393722, "onPrimary": 4282131546, "primaryContainer": 4283710322, "onPrimaryContainer": 4293843967, "inversePrimary": 4285289355, "secondary": 4291805658, "onSecondary": 4281740608, "secondaryContainer": 4283253591, "onSecondaryContainer": 4293713399, "tertiary": 4294096832, "onTertiary": 4283114796, "tertiaryContainer": 4284824386, "onTertiaryContainer": 4294957534, "error": 4294948011, "onError": 4285071365, "errorContainer": 4287823882, "onErrorContainer": 4294957782, "background": 4279570968, "onBackground": 4293452008, "surface": 4279570968, "onSurface": 4293452008, "surfaceVariant": 4283057486, "onSurfaceVariant": 4291609807, "inverseSurface": 4293452008, "inverseOnSurface": 4281544501, "outline": 4287991448, "outlineVariant": 4283057486, "shadow": 4278190080, "scrim": 4278190080, "surfaceDim": 4279570968, "surfaceBright": 4282136638, "surfaceContainerLowest": 4279242002, "surfaceContainerLow": 4280097312, "surfaceContainer": 4280360484, "surfaceContainerHigh": 4281084207, "surfaceContainerHighest": 4281807673, "surfaceTint": 4292393722 },
	themeScheme: 0,
	themeColor: "#CBA6F7",
	themeContrast: 1,
}, { ident: "settings", backing: "localstorage", autosave: "auto" })
