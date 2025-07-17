import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import { Settings } from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	pluginCache: string[];
	dangerZone: boolean;
};

export const lang = new Lang("plugin_browser");

export function onLoad() {
	vstorage.pluginCache ??= [];
	vstorage.dangerZone ??= false;
}

export const onUnload = patcher();

export const settings = Settings;
