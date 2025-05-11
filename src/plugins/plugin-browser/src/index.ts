import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import patcher from "./stuff/patcher";

export const vstorage = storage as {
	pluginCache: string[];
};

export const lang = new Lang("plugin_browser");

let unpatch: any;
export default {
	onLoad: () => {
		vstorage.pluginCache ??= [];
		unpatch = patcher();
	},
	onUnload: () => unpatch?.(),
};
