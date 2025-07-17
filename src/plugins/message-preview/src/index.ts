import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	buttonType: "pill" | "send";
	previewType: "popup" | "clyde";
};

export function onLoad() {
	vstorage.buttonType ??= "pill";
	vstorage.previewType ??= "popup";
}

export const onUnload = patcher();

export const settings = Settings;
