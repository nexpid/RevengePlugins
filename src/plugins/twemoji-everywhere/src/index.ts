import { ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";
import { emojiPacks, type Pack } from "./stuff/packs";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	emojipack: Pack;
};

export const lang = new Lang("twemoji_everywhere");

export function onLoad() {
	if (!emojiPacks[vstorage.emojipack]) {
		vstorage.emojipack = RN.Platform.select({
			default: "default",
			ios: "twemoji",
		});
	}
}

export const onUnload = patcher();

export const settings = Settings;
