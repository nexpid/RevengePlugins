import {
	rebuildLink,
	type RenderInfoBase,
	type RenderSongInfo,
} from "@song-spotlight/api/handlers";
import type { Song } from "@song-spotlight/api/structs";
import { clipboard, url } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import AppleMusicIcon from "../../assets/images/services/AppleMusicIcon.png";
import SoundcloudIcon from "../../assets/images/services/SoundcloudIcon.png";
import { lang } from "..";

const thumbnailUrl = "https://cdn.discordapp.com/embed/avatars/0.png";

const skeletonSongInfoBase = {
	label: "Song Spotlight",
	sublabel: "John Doe",
	explicit: false,
} as RenderInfoBase;

export const skeletonSongInfo = {
	single: {
		...skeletonSongInfoBase,
		form: "single",
		thumbnailUrl,
		single: {
			link: "https://discord.com",
		},
	} as RenderSongInfo,
	list: {
		...skeletonSongInfoBase,
		form: "list",
		thumbnailUrl,
		list: [],
	} as RenderSongInfo,
};

export const serviceIcons = {
	spotify: getAssetIDByName("img_account_sync_spotify_light_and_dark"),
	soundcloud: SoundcloudIcon,
	applemusic: AppleMusicIcon,
};

export async function openLink(song: Song) {
	const link = await rebuildLink(song);
	if (link !== false) url.openDeeplink(link);
	else {
		showToast(
			lang.format("toast.cannot_open_link", {}),
			getAssetIDByName("CircleXIcon-primary"),
		);
	}
}

export async function copyLink(song: Song) {
	const link = await rebuildLink(song);
	if (link) {
		clipboard.setString(link);
		showToast(
			lang.format("toast.copied_link", {}),
			getAssetIDByName("CopyIcon"),
		);
	} else {
		return showToast(
			lang.format("toast.cannot_open_link", {}),
			getAssetIDByName("CircleXIcon-primary"),
		);
	}
}

export function sid(song: Song) {
	return [song.service, song.type, song.id].join(":");
}
