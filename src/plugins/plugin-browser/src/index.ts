import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import { Settings } from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	state: {
		// prevent cloud sync from syncing this
		__no_sync: true;
		pluginCache: string[];
	};
	settings: {
		dangerZone: boolean;
	};
};

export const lang = new Lang("plugin_browser");

export function onLoad() {
	storage.state ??= {};
	vstorage.state.__no_sync = true;
	vstorage.state.pluginCache ??= storage.pluginCache ?? [];

	storage.settings ??= {};
	vstorage.settings.dangerZone ??= storage.dangerZone ?? false;

	delete storage.pluginCache;
	delete storage.dangerZone;
}

export const onUnload = patcher();

export const settings = Settings;
