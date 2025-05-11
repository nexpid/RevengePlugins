import { logger } from "@vendetta";

import type { AppleMusicSong, Song, SoundcloudSong, SpotifySong } from "../../types";

// https://music.apple.com/assets/index-923f60bc.js
const appleMusicDevToken =
	"eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzMyMTMyODU5LCJleHAiOjE3MzkzOTA0NTksInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.QmJkRh6Ds6mPQ3fnyi7lxz32UdU8hJWZokV9AiwKQbSeZOfwkitUfrz2lbFCleLAQZCJQBPeYYXubbq8VcgC5A";

interface SongInfoBase {
	service: Song["service"];
	label: string;
	sublabel?: string;
	thumbnailUrl: string;
}

export interface SongInfoEntry {
	id: string;
	label: string;
	sublabel: string;
	explicit: boolean;
	duration: number;
	previewUrl?: string;
}

export type SongInfo =
	& SongInfoBase
	& (
		| {
			type: "single";
			explicit: boolean;
			duration: number;
			previewUrl?: string;
		}
		| {
			type: "entries";
			entries: SongInfoEntry[];
		}
	);

const randomCover = () =>
	`https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5) + 1}.png`;

const skeletonSongInfoBase = (() => ({
	service: "spotify",
	label: "Song Spotlight",
	sublabel: "John Doe",
	thumbnailUrl: randomCover(),
})) as () => SongInfoBase;

export const skeletonSongInfo = {
	single: (() => ({
		...skeletonSongInfoBase(),
		type: "single",
		explicit: false,
		duration: 60000,
	})) as () => SongInfo,
	entries: (() => ({
		...skeletonSongInfoBase(),
		type: "entries",
		entries: [],
	})) as () => SongInfo,
};

export function soundcloudUrl(_url: string) {
	const url = new URL(_url);
	url.searchParams.set("client_id", "nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic");
	url.searchParams.set("app_version", "1732876988");
	url.searchParams.set("format", "json");

	return url.toString();
}

const services = {
	async spotify({ type, id, service }: SpotifySong) {
		const res = await fetch(
			`https://open.spotify.com/embed/${type}/${id}`,
			{
				cache: "force-cache",
				headers: {
					"cache-control": "public; max-age=1800",
				},
			},
		).then(x => x.text());

		try {
			const nextData = res
				.split("type=\"application/json\">")[1]
				.split("</script")[0];
			const json = JSON.parse(nextData);
			const entity = json.props.pageProps.state?.data?.entity;
			if (!entity) return false;

			const base: SongInfoBase = {
				service,
				label: entity.title,
				sublabel: entity.subtitle
					?? entity.artists?.map(x => x.name).join(", "),
				thumbnailUrl: (
					entity.coverArt?.sources?.sort(
						(a, b) => a.width - b.width,
					)[0]
						?? entity.visualIdentity.image?.sort(
							(a, b) => a.maxWidth - b.maxWidth,
						)[0]
				)?.url ?? randomCover(),
			};

			if (type === "track") {
				return {
					...base,
					type: "single",
					explicit: !!entity.isExplicit,
					duration: entity.duration ?? 0,
					previewUrl: entity.audioPreview?.url,
				};
			}

			return {
				...base,
				type: "entries",
				entries: entity.trackList.map(track => ({
					id: track.uid,
					label: track.title,
					sublabel: track.subtitle,
					explicit: !!track.isExplicit,
					duration: track.duration ?? 0,
					previewUrl: track.audioPreview?.url,
				})),
			};
		} catch (e) {
			logger.error("info->spotify", e, `${service}->${type}->${id}`);
			return false;
		}
	},
	async soundcloud({ service, type, id }: SoundcloudSong) {
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
			const data = await res.json();

			const base: SongInfoBase = {
				service,
				label: data.username ?? data.title,
				sublabel: data.user?.username
					?? (data.track_count
						&& `${data.track_count} track${data.track_count !== 1 ? "s" : ""}`),
				thumbnailUrl: data.artwork_url ?? data.avatar_url ?? randomCover(),
			};

			const getPreview = async (url: string) => {
				try {
					const { url: previewUrl } = await fetch(url, {
						cache: "force-cache",
						headers: {
							"cache-control": "public; max-age=1800",
						},
					}).then(x => x.json());
					return previewUrl;
				} catch {
					return undefined;
				}
			};

			if (type === "user") {
				let tracks = new Array<any>();

				const tracksRes = await fetch(
					soundcloudUrl(
						`https://api-widget.soundcloud.com/users/${id}/tracks?limit=20`,
					),
					{
						cache: "force-cache",
						headers: {
							"cache-control": "public; max-age=1800",
						},
					},
				);
				if (tracksRes.status === 200) {
					tracks = (await tracksRes.json()).collection;
				}

				return {
					...base,
					type: "entries",
					entries: await Promise.all(
						tracks
							.filter(track => track.streamable)
							.map(track => ({
								id: String(track.id),
								label: track.title,
								sublabel: track.user.username,
								explicit: !!track.publisher_metadata?.explicit,
								duration: track.duration ?? 0,
								previewUrl: (
									track.media.transcodings.find(
										({ format }) =>
											format.protocol === "progressive"
											&& format.mime_type === "audio/mpeg",
									) ?? track.media.transcodings[0]
								)?.url,
							}))
							.map(track =>
								track.previewUrl
									? getPreview(
										soundcloudUrl(track.previewUrl),
									).then(previewUrl => ({
										...track,
										previewUrl,
									}))
									: track
							),
					),
				};
			}
			if (type === "playlist") {
				return {
					...base,
					type: "entries",
					entries: await Promise.all(
						data.tracks
							.filter(track => track.streamable)
							.map(track => ({
								id: String(track.id),
								label: track.title,
								sublabel: track.user.username,
								explicit: !!track.publisher_metadata?.explicit,
								duration: track.duration ?? 0,
								previewUrl: (
									track.media.transcodings.find(
										({ format }) =>
											format.protocol === "progressive"
											&& format.mime_type === "audio/mpeg",
									) ?? track.media.transcodings[0]
								)?.url,
							}))
							.map(track =>
								track.previewUrl
									? getPreview(
										soundcloudUrl(track.previewUrl),
									).then(previewUrl => ({
										...track,
										previewUrl,
									}))
									: track
							),
					),
				};
			}

			const previewUrl = (
				data.media.transcodings.find(
					({ format }) =>
						format.protocol === "progressive"
						&& format.mime_type === "audio/mpeg",
				) ?? data.media.transcodings[0]
			)?.url;
			return {
				...base,
				type: "single",
				explicit: !!data.publisher_metadata?.explicit,
				duration: data.duration ?? 0,
				previewUrl: previewUrl && (await getPreview(soundcloudUrl(previewUrl))),
			};
		} catch (e) {
			logger.error("info->soundcloud", e, `${service}->${type}->${id}`);
			return false;
		}
	},
	async applemusic({ service, type, id }: AppleMusicSong) {
		const res = await fetch(
			`https://amp-api.music.apple.com/v1/catalog/us/${type}s/${id}?include=songs`,
			{
				headers: {
					authorization: `Bearer ${appleMusicDevToken}`,
					origin: "https://music.apple.com",
				},
			},
		);
		if (res.status !== 200) return false;

		try {
			const { attributes, relationships } = (await res.json()).data[0];

			const base: SongInfoBase = {
				service,
				label: attributes.name,
				sublabel: attributes.artistName ?? "Popular tracks",
				thumbnailUrl: attributes.artwork.url?.replace(/{[wh]}/g, "72")
					?? randomCover(),
			};

			if (type === "song") {
				return {
					...base,
					type: "single",
					explicit: attributes.contentRating === "explicit",
					duration: attributes.durationInMillis ?? 0,
					previewUrl: attributes.previews[0]?.url,
				};
			}

			return {
				...base,
				type: "entries",
				entries: (relationships.songs ?? relationships.tracks).data
					.filter(
						song => song.attributes.artistName === attributes.name,
					)
					.map(({ attributes: song }) => ({
						id: song.isrc,
						label: song.name,
						sublabel: song.artistName,
						explicit: song.contentRating === "explicit",
						duration: song.durationInMillis ?? 0,
						previewUrl: song.previews[0]?.url,
					})),
			};
		} catch (e) {
			logger.error("info->applemusic", e, `${service}->${type}->${id}`);
			return false;
		}
	},
} satisfies Record<Song["service"], (song: any) => Promise<SongInfo | false>>;

export const infoCacheSymbol = Symbol.for("songspotlight.cache.songinfo");
(window as any)[infoCacheSymbol] ??= new Map();

export async function getSongInfo(song: Song): Promise<false | SongInfo> {
	const hash = song.service + song.type + song.id;
	if ((window as any)[infoCacheSymbol].has(hash)) {
		return (window as any)[infoCacheSymbol].get(hash)!;
	}

	const res = await services[song.service](song as any);
	if (res && res.type === "entries") res.entries = res.entries.slice(0, 15);
	(window as any)[infoCacheSymbol].set(hash, res);
	return res;
}
