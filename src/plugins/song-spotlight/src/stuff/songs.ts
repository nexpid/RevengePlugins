import type { RenderInfoBase, RenderSongInfo } from "@song-spotlight/api/handlers";
import { getAssetIDByName } from "@vendetta/ui/assets";
import AppleMusicIcon from "../../assets/images/services/AppleMusicIcon.png";
import SoundcloudIcon from "../../assets/images/services/SoundcloudIcon.png";

const thumbnailUrl = "https://cdn.discordapp.com/embed/avatars/0.png";

const skeletonSongInfoBase = {
	label: "Song Spotlight",
	sublabel: "John Doe",
	link: "https://discord.com",
	explicit: false,
} as RenderInfoBase;

export const skeletonSongInfo = {
	single: {
		form: "single",
		...skeletonSongInfoBase,
		thumbnailUrl,
		single: {},
	} as RenderSongInfo,
	list: {
		form: "list",
		...skeletonSongInfoBase,
		thumbnailUrl,
		list: [],
	} as RenderSongInfo,
};

export const serviceIcons = {
	spotify: getAssetIDByName("img_account_sync_spotify_light_and_dark"),
	soundcloud: SoundcloudIcon,
	applemusic: AppleMusicIcon,
};
