import { findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";

import { resolveSemanticColor } from "$/types";
import type { PlusColorResolvable } from "$/typings";

const ThemeStore = findByStoreName("ThemeStore");

export function matchTheme(colors: {
	darker?: string;
	light?: string;
	midnight?: string;
}): string | undefined {
	const { theme } = ThemeStore;

	if (theme in colors) return colors[theme];
	if (["dark", "midnight"].includes(theme)) return colors.darker;
	return colors.light;
}

export default function(color: PlusColorResolvable): string | undefined {
	if (Array.isArray(color)) {
		return matchTheme({
			darker: color[0],
			light: color[1],
			midnight: color[2],
		});
	}
	if (color.startsWith("SC_")) {
		return semanticColors[color.slice(3)]
			? resolveSemanticColor(semanticColors[color.slice(3)])
			: "#ffffff";
	}
	if (color.startsWith("RC_")) return rawColors[color.slice(3)] ?? "#ffffff";
	if (color.startsWith("#") && color.length === 4) {
		return `#${color[1].repeat(2)}${color[2].repeat(2)}${color[3].repeat(2)}`;
	}
	if (color.startsWith("#") && color.length === 7) return color;
}
