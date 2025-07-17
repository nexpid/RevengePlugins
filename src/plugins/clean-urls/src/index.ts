import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";

// https://gitlab.com/ClearURLs/Rules
export const listUrl = "https://rules2.clearurls.xyz/data.minify.json";

export const vstorage = storage as {
	config: {
		redirect: boolean;
		referrals: boolean;
	};
};

export function onLoad() {
	vstorage.config ??= {
		redirect: true,
		referrals: false,
	};
}

export const onUnload = patcher();

export const settings = Settings;
