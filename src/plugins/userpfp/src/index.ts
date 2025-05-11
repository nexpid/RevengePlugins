import { logger } from "@vendetta";
import { id } from "@vendetta/plugin";
import { stopPlugin } from "@vendetta/plugins";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { Lang } from "$/lang";

import patcher from "./stuff/patcher";

export const dataURL = "https://userpfp.github.io/UserPFP/source/data.json";
export let enabled = false;

export const lang = new Lang("userpfp");

let unpatch: () => void;
export default {
	onLoad: async () => {
		enabled = true;
		try {
			unpatch = await patcher();
		} catch (e) {
			logger.error("patch error", e);

			showToast(
				lang.format("toast.patch_error", {}),
				getAssetIDByName("CircleXIcon-primary"),
			);
			stopPlugin(id);
		}
	},
	onUnload: () => {
		enabled = false;
		lang.unload();
		unpatch();
	},
};
