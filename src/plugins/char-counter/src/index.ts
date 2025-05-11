import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	position: string;
	display: string;
	commas: boolean;
	minChars: number;
	supportSLM: boolean;
};

let unpatch: any;
export default {
	onLoad: () => {
		vstorage.position ??= "pill";
		vstorage.display ??= "full";
		vstorage.commas ??= true;
		vstorage.minChars ??= 1;
		vstorage.supportSLM ??= true;

		unpatch = patcher();
	},
	onUnload: () => unpatch?.(),
	settings: Settings,
};
