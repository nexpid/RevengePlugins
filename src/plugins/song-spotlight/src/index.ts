import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import settings from "./components/Settings";
import patcher from "./stuff/patcher";

const { inspect } = findByProps("inspect");

export const vstorage = storage as {
	custom: {
		host: string;
		clientId: string;
	};
};

export const initState = {
	inits: [] as string[],
};

export const showDebugLogs = false;
export const debugLogs = new Array<string>();
export function debugLog(...messages: any[]) {
	debugLogs.push(
		`[${new Date().toISOString()}] ${messages.map(x => inspect(x)).join(", ")}`,
	);
}

export const lang = new Lang("song_spotlight");
const patches = new Array<any>();
export default {
	onLoad: () => {
		debugLog("Plugin started");
		vstorage.custom ??= {
			host: "",
			clientId: "",
		};

		patches.push(patcher());
	},
	onUnload: () => {
		for (const x of patches) x();
	},
	settings,
};
