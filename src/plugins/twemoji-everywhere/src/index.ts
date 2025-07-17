import { ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import type { emojipacks } from "./stuff/twemoji";

export const vstorage = storage as {
	emojipack: keyof typeof emojipacks;
};

export const lang = new Lang("twemoji_everywhere");

export function onLoad() {
	vstorage.emojipack ??= RN.Platform.select({
		default: "default",
		ios: "twemoji",
	});
}

export const onUnload = patcher();

export const settings = Settings;
