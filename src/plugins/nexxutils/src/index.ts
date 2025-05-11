import { storage } from "@vendetta/plugin";

import settings from "./components/Settings";
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
export const version = "0.8.1";

let undevtool: () => void;

export default {
	onLoad: () => {
		vstorage.modules ??= {};
		for (const x of modules) x.storage.enabled && x.start();
		undevtool = devtools();
	},
	onUnload: () => {
		for (const x of modules) x.storage.enabled && x.stop();
		undevtool?.();
	},
	settings,
};
