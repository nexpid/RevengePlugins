import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";
import load, { patches } from "./stuff/loader";

export enum PatchType {
	Icons = "icons",
	CustomIconOverlays = "custom_icon_overlays",
	MentionLineColor = "mention_line_color",
	Iconpack = "iconpack",
}

export enum InactiveReason {
	NoTheme = "no_theme",
	ThemesPlusUnsupported = "themes_plus_unsupported",
	NoIconpacksList = "no_iconpacks_list",
	NoIconpackConfig = "no_iconpack_config",
	NoIconpackFiles = "no_iconpack_files",
}

export enum ConfigIconpackMode {
	Automatic = "automatic",
	Manual = "manual",
	Disabled = "disabled",
}

export const vstorage = storage as {
	iconpack: {
		mode: ConfigIconpackMode;
		pack?: string;
		custom: {
			url: string;
			suffix: string;
			config: {
				biggerStatus: boolean;
			};
		};
		isCustom: boolean;
	};
	downloadIconpackModalDismissed?: boolean;
	iconpackDownloading?: boolean;
};

export let enabled = false;

export const lang = new Lang("themes_plus");

export function onLoad() {
	vstorage.iconpack ??= {
		mode: ConfigIconpackMode.Automatic,
		custom: {
			url:
				"https://raw.githubusercontent.com/mudrhiod/discord-iconpacks/master/plus/solar-duotone/",
			suffix: "",
			config: {
				biggerStatus: false,
			},
		},
		isCustom: false,
	};
	enabled = true;

	try {
		load();
	} catch (e) {
		console.log("Themes+ failed to load whoopsies!!", e);
	}
}

export function onUnload() {
	enabled = false;
	lang.unload();
	for (const x of patches) {
		x();
	}
}

export const settings = Settings;
