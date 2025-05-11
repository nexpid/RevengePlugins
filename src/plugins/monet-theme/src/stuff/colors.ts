import { rawColors } from "@vendetta/ui";

import { vstorage } from "..";
import { argbFromHex, hexFromArgb } from "./material";
import { Cam16 } from "./material/cam16";
import { HctSolver } from "./material/hctsolver";
import { lstarFromArgb } from "./material/utils";

export function parseColor(clr: string): string | undefined {
	const shade = Number(clr.split("_")[1]);

	if (rawColors[clr]) return rawColors[clr];
	if (clr.startsWith("N1_")) {
		return getLABShade(vstorage.colors.neutral1, 500 - shade + 500);
	}
	if (clr.startsWith("N2_")) {
		return getLABShade(vstorage.colors.neutral2, 500 - shade + 500);
	}
	if (clr.startsWith("A1_")) {
		return getLABShade(vstorage.colors.accent1, 500 - shade + 500);
	}
	if (clr.startsWith("A2_")) {
		return getLABShade(vstorage.colors.accent2, 500 - shade + 500);
	}
	if (clr.startsWith("A3_")) {
		return getLABShade(vstorage.colors.accent3, 500 - shade + 500);
	}
	if (clr.match(/^#(?:[0-9a-f]{6})|(?:[0-9a-f]{3})$/i)) return clr;
}

export function getLABShade(
	color: string,
	shade: number,
	mult?: number,
): string {
	mult ??= 1;

	const argb = argbFromHex(color);
	const cam = Cam16.fromInt(argb);

	return hexFromArgb(
		HctSolver.solveToInt(
			cam.hue,
			cam.chroma,
			lstarFromArgb(argb) + ((500 - shade) / 10) * mult,
		),
	);
}
