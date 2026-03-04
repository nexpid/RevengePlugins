import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	custom: {
		host: string;
		clientId: string;
	};
};

export const lang = new Lang("song_spotlight");
const patches: (any)[] = [];
export function onLoad() {
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
