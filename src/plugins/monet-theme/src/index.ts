import { findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { getDiscordTheme } from "$/types";
import type { ThemeDataWithPlus, VendettaSysColors } from "$/typings";

import usePatches from "./components/hooks/usePatches";
import settings from "./components/Settings";
import { apply, build } from "./stuff/buildTheme";

export const patchesURL = () =>
	`https://raw.githubusercontent.com/nexpid/VendettaMonetTheme/${
		vstorage.patches.commit ?? "main"
	}/patches.jsonc`;
export const devPatchesURL = "http://192.168.2.22:8730/patches.jsonc";

const ThemeStore = findByStoreName("ThemeStore");

export const getSysColors = () =>
	(window as any).__vendetta_syscolors as VendettaSysColors | null;

export const hasThemeKey = Symbol.for("monettheme.isThemed");
export const hasTheme = () => {
	const { bunny, [hasThemeKey]: isThemed } = window as any;
	return (
		!bunny.themes.getCurrentTheme()
		&& (bunny.themes.getThemeFromLoader()?.id === "monet-theme" || isThemed)
	);
};

export const vstorage = storage as {
	colors: {
		neutral1: string;
		neutral2: string;
		accent1: string;
		accent2: string;
		accent3: string;
	};
	config: {
		wallpaper: string | "none";
		custom: {
			title: string;
			url: string;
		}[];
	};
	reapply: {
		enabled: boolean;
		cache: {
			colors?: string;
			theme?: string;
		};
	};
	patches: {
		from: "git" | "local";
		commit?: string;
	};
};

export const patches = new Array<any>();

export default {
	settings,
	onLoad: async () => {
		const syscolors = getSysColors();

		vstorage.colors ??= {
			neutral1: syscolors?.neutral1[7] ?? "#747679",
			neutral2: syscolors?.neutral2[7] ?? "#70777C",
			accent1: syscolors?.accent1[7] ?? "#007FAC",
			accent2: syscolors?.accent2[7] ?? "#657985",
			accent3: syscolors?.accent3[7] ?? "#787296",
		};
		vstorage.config ??= {
			wallpaper: "none",
			custom: [],
		};
		vstorage.patches ??= {
			from: "git",
		};

		let lTheme = getDiscordTheme();
		const oldColors = vstorage.reapply?.cache?.colors;
		const oldTheme = vstorage.reapply?.cache?.theme;

		vstorage.reapply ??= {
			enabled: false,
			cache: {
				colors: JSON.stringify(syscolors),
				theme: lTheme,
			},
		};
		vstorage.reapply.cache = {
			colors: JSON.stringify(syscolors),
			theme: lTheme,
		};

		const reapply = async () => {
			if (!vstorage.reapply.enabled || !hasTheme()) return;
			showToast("Reapplying Monet Theme", getAssetIDByName("RetryIcon"));

			const cpatches = await usePatches.patches;
			if (!cpatches) {
				return showToast(
					"Failed to fetch color patches!",
					getAssetIDByName("CircleXIcon-primary"),
				);
			}

			let theme: ThemeDataWithPlus;
			try {
				theme = build(cpatches);
			} catch (_e: any) {
				showToast(
					"Failed to build theme!",
					getAssetIDByName("CircleXIcon-primary"),
				);
				return;
			}

			apply(theme);
		};

		if (
			oldTheme
			&& oldColors
			&& syscolors
			&& (vstorage.reapply.cache.colors !== oldColors
				|| vstorage.reapply.cache.theme !== oldTheme)
		) {
			reapply();
		}

		const onThemeChanged = () => {
			const newLTheme = getDiscordTheme();
			if (lTheme !== newLTheme) reapply();
			lTheme = newLTheme;
		};

		ThemeStore.addChangeListener(onThemeChanged);
		patches.push(() => ThemeStore.removeChangeListener(onThemeChanged));
	},
	onUnload: () => {
		for (const x of patches) x();

		if (hasTheme()) {
			showConfirmationAlert({
				title: "Deselect Theme",
				content: "Monet theme is currently selected, would you like to deselect it?",
				onConfirm: async () => {
					apply(null);
				},
				confirmText: "Unload",
				confirmColor: "brand" as ButtonColors,
				cancelText: "Cancel",
			});
		}
	},
};
