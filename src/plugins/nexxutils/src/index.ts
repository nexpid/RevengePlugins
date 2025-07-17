import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import modules from "./modules";
import devtools from "./stuff/devtools";

export const vstorage = storage as {
	modules: Record<
		string,
		{
			enabled: boolean;
			options: Record<string, any>;
		}
	>;
};

// major.minor.patch
export const version = "0.9.0";

let undevtool: () => void;

export function onLoad() {
	vstorage.modules ??= {};
	for (const x of modules) x.storage.enabled && x.start();
	undevtool = devtools();
}

export function onUnload() {
	for (const x of modules) x.storage.enabled && x.stop();
	undevtool?.();
}

export const settings = Settings;
