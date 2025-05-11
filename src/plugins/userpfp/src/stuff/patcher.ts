import { logger } from "@vendetta";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { safeFetch } from "@vendetta/utils";

import { dataURL, enabled, lang } from "..";
import type { DataFile } from "../types";

const avatarStuff = findByProps("getUserAvatarURL", "getUserAvatarSource");

const UserStore = findByStoreName("UserStore");

let data: DataFile;
const fetchData = async () => {
	try {
		data = await (
			await safeFetch(dataURL, {
				headers: { "cache-control": "max-age=1800" },
			})
		).json();
	} catch (e) {
		logger.error("fetch error", e);

		showToast(
			lang.format("toast.fetch_error", {}),
			getAssetIDByName("CircleXIcon-primary"),
		);
	}
};

const getCustomAvatar = (id: string, isStatic?: boolean) => {
	if (!data.avatars[id]) return;

	const avatar = data.avatars[id];
	if (isStatic && urlExt(avatar) === "gif") {
		return avatar.replace(".gif", ".png");
	}
	return avatar;
};

const urlExt = (url: string) => new URL(url).pathname.split(".").slice(-1)[0];

export default async () => {
	const patches = new Array<() => void>();

	await fetchData();
	if (!data || !enabled) return () => void 0;

	const dataInterval = setInterval(() => void fetchData(), 1000 * 60 * 60);
	patches.push(() => {
		clearInterval(dataInterval);
	});

	patches.push(
		after("getUser", UserStore, ([id], ret) => {
			const ext = data.avatars[id] && urlExt(data.avatars[id]);
			if (ext === "gif" && ret) {
				const avatar = ret.avatar ?? "0";
				ret.avatar = !avatar.startsWith("a_") ? `a_${avatar}` : avatar;
			}
		}),
	);

	patches.push(
		after(
			"getUserAvatarURL",
			avatarStuff,
			([{ id }, animate]) => getCustomAvatar(id, !animate),
		),
	);
	patches.push(
		after("getUserAvatarSource", avatarStuff, ([{ id }, animate], ret) => {
			const custom = getCustomAvatar(id, !animate);
			if (!custom) return;

			return custom ? { uri: custom } : ret;
		}),
	);

	return () => {
		for (const x of patches) {
			x();
		}
	};
};
