import { clipboard, ReactNative as RN, url } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import type { ImageSourcePropType } from "react-native";

import AppleMusicIcon from "../../../assets/images/services/AppleMusicIcon.png";
import SoundcloudIcon from "../../../assets/images/services/SoundcloudIcon.png";
import { lang } from "../..";
import type { AppleMusicSong, Song, SoundcloudSong, SpotifySong } from "../../types";
import { soundcloudUrl } from "./info";

export const serviceToIcon = {
	spotify: getAssetIDByName("img_account_sync_spotify_light_and_dark"),
	soundcloud: SoundcloudIcon,
	applemusic: AppleMusicIcon,
} satisfies Record<Song["service"], ImageSourcePropType>;

const serviceToApp = {
	spotify({ type, id }: SpotifySong) {
		return [
			`spotify://${type}/${id}`,
			`https://open.spotify.com/${type}/${id}`,
		];
	},
	async soundcloud({ type, id }: SoundcloudSong) {
		const res = await fetch(
			soundcloudUrl(`https://api-widget.soundcloud.com/${type}s/${id}`),
			{
				cache: "force-cache",
				headers: {
					"cache-control": "public; max-age=1800",
				},
			},
		);
		if (res.status !== 200) return false;

		try {
			const link = (await res.json()).permalink_url;
			return [
				link?.replace("https://soundcloud.com/", "soundcloud://"),
				link,
			];
		} catch {
			return false;
		}
	},
	applemusic({ type, id }: AppleMusicSong) {
		// you literally just cannot open the apple music app on android. oh well
		return [
			`music://music.apple.com/${type}/songspotlight/${id}`,
			`https://music.apple.com/${type}/songspotlight/${id}`,
		];
	},
} as Record<
	Song["service"],
	(song: any) => string[] | Promise<string[] | false>
>;

export const linkCacheSymbol = Symbol.for("songspotlight.cache.servicelink");
(window as any)[linkCacheSymbol] ??= new Map();

export async function getServiceLink(
	song: Song,
	dry?: boolean,
): Promise<string | false> {
	const hash = song.service + song.type + song.id;

	const links = (window as any)[linkCacheSymbol].get(hash)
		?? (await serviceToApp[song.service](song));
	if (!links) return false;
	(window as any)[linkCacheSymbol].set(hash, links);

	if (dry) return links[links.length - 1] ?? links[0];

	for (const link of links) if (await RN.Linking.canOpenURL(link)) return link;
	return links[links.length - 1] ?? links[0];
}

export async function openLink(song: Song) {
	const link = await getServiceLink(song);
	if (link !== false) url.openDeeplink(link);
	else {
		showToast(
			lang.format("toast.cannot_open_link", {}),
			getAssetIDByName("CircleXIcon-primary"),
		);
	}
}

export async function copyLink(song: Song) {
	const link = await getServiceLink(song, true);
	if (link) {
		clipboard.setString(link),
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
