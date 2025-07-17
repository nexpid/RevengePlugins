import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";
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
export const debugLogs: string[] = [];
export function debugLog(...messages: any[]) {
	debugLogs.push(
		`[${new Date().toISOString()}] ${messages.map(x => inspect(x)).join(", ")}`,
	);
}

export const lang = new Lang("song_spotlight");
const patches: (any)[] = [];
export function onLoad() {
	debugLog("Plugin started");
	vstorage.custom ??= {
		host: "",
		clientId: "",
	};

	patches.push(patcher());
}

export function onUnload() {
	for (const x of patches) x();
}

export const settings = Settings;
