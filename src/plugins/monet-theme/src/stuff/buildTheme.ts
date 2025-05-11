import { logger } from "@vendetta";
import { rawColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { getDiscordTheme } from "$/types";
import type { ThemeDataWithPlus } from "$/typings";

import { hasThemeKey, vstorage } from "..";
import type { Patches, PatchThing } from "../types";
import { getLABShade, parseColor } from "./colors";

export function apply(theme: ThemeDataWithPlus | null) {
	const { bunny } = window as any;

	const val = theme
		? {
			id: "monet-theme",
			selected: false,
			data: theme,
		}
		: null;

	try {
		bunny.themes.selectTheme(val);
		(window as any)[hasThemeKey] = !!val;

		if (!val) showToast("Cleared theme", getAssetIDByName("TrashIcon"));
		else showToast("Applied theme", getAssetIDByName("PaintPaletteIcon"));
		return true;
	} catch (e: any) {
		showToast(
			"Couldn't apply theme!",
			getAssetIDByName("CircleXIcon-primary"),
		);
		logger.error(`Failed to apply theme!\n${e.stack}`);
	}
}

export function build(patches: Patches): ThemeDataWithPlus {
	const raw = {} as Record<string, string>;
	const semantic = {} as Record<string, (string | null)[]>;

	const theme = {
		name: "Material You Theme 2.0",
		description: "A Revenge theme with Material You theming.",
		authors: [
			{
				name: "nexpid",
				id: "853550207039832084",
			},
		],
		spec: 2,
	} as ThemeDataWithPlus;

	const style = getDiscordTheme();

	const get = <T extends PatchThing<any>>(lk: T): T["both"] =>
		Object.assign(lk.both, style === "light" ? lk.light : lk.dark);
	const entries = <T extends object>(obj: T): [string, T[keyof T]][] =>
		Object.entries(obj);

	const checkShouldPut = (shade: number, checks: string[]): boolean => {
		let shouldPut = true;
		for (const c of checks) {
			if (!shouldPut) break;
			if (c.startsWith(">=")) shouldPut = shade >= Number(c.slice(2));
			else if (c.startsWith("<=")) shouldPut = shade <= Number(c.slice(2));
			else if (c.startsWith(">")) shouldPut = shade > Number(c.slice(1));
			else if (c.startsWith("<")) shouldPut = shade < Number(c.slice(1));
		}

		return shouldPut;
	};

	if (patches.version === 3) {
		for (const [x, y] of entries(get(patches.replacers))) {
			const clr = parseColor(y.color);
			if (!clr) continue;

			for (
				const c of Object.keys(rawColors).filter(l => l.startsWith(`${x.split("_")[0]}_`))
			) {
				const shade = Number(c.split("_")[1]);
				if (!checkShouldPut(shade, x.split("_").slice(1))) continue;

				const useShade = y.alternative
					? Math.floor((shade / 26) * 1000)
					: shade;

				raw[c] = getLABShade(
					clr,
					y.base ? useShade + (500 - y.base) : useShade,
					y.ratio,
				);
			}
		}
	}

	const rawPatches = get(patches.raw);
	for (const key of Object.keys(rawPatches)) {
		const clr = parseColor(rawPatches[key]);
		if (clr) raw[key] = clr;
	}

	for (const key of Object.keys(patches.semantic.both)) {
		const clr = parseColor(rawPatches[key]);
		if (clr) semantic[key] = [clr, clr];
	}
	for (const key of Object.keys(patches.semantic.dark)) {
		const clr = parseColor(rawPatches[key]);

		if (semantic[key] && clr) semantic[key][0] = clr;
		else if (clr) semantic[key] = [clr];
	}
	for (const key of Object.keys(patches.semantic.light)) {
		const clr = parseColor(rawPatches[key]);

		if (semantic[key] && clr) semantic[key][1] = clr;
		else if (clr) semantic[key] = [null, clr];
	}

	if (vstorage.config.wallpaper !== "none") {
		theme.background = {
			url: vstorage.config.wallpaper,
			alpha: 1,
		};
	}

	if (patches.version === 3 && patches.plus) {
		theme.plus = {
			customOverlays: true,
			version: 0,
			icons: {},
		};

		const icons = {};
		for (const key of Object.keys(get(patches.plus.icons))) {
			icons[key] = parseColor(key);
		}

		theme.plus.icons = icons;
	}

	theme.semanticColors = semantic as any;
	theme.rawColors = raw;

	return JSON.parse(JSON.stringify(theme));
}
