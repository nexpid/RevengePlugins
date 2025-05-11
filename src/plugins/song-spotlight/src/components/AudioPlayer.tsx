import { React } from "@vendetta/metro/common";

import { MobileAudioSound } from "$/deps";

import type { SongInfo } from "../stuff/songs/info";

export interface AudioPlayer {
	play(urlOrNext?: string | true): void;
	pause(): void;
	current: string | null;
}

const coolSep = "\u0001\u0002";
// Q: ^ what's up with the weird type-service-id${coolSep}previewUrl thing? why not just use the previewUrl directly as a key?
// A: if we have the same song twice (once itself, second time in a playlist), both play at once. so we use this complicated key system instead to avoid this!!

const spotifyPreviewVolume = 0.25;
const defaultPreviewVolume = 0.4;

export default function AudioPlayer({
	song,
	id,
	playing,
	children,
}: {
	song: SongInfo;
	id: string;
	playing: {
		currentlyPlaying: string | null;
		setCurrentlyPlaying: (value: string | null) => void;
	};
	children: ({
		player,
		loaded,
	}: {
		player: AudioPlayer;
		loaded: string[];
		resolved: string[];
	}) => React.ReactNode;
}) {
	const { currentlyPlaying, setCurrentlyPlaying } = playing;

	const sounds = React.useRef<Record<string, MobileAudioSound>>({});
	const [resolved, setResolved] = React.useState<Record<string, boolean>>({});

	const audioPlayer = React.useRef<Omit<AudioPlayer, "current">>({
		play() {},
		pause() {},
	});
	audioPlayer.current = {
		play(urlOrNext) {
			const resolveds = Object.entries(resolved)
				.filter(([_, val]) => val)
				.map(([key]) => key);

			if (typeof urlOrNext === "string") {
				const goodKey = Object.keys(resolved).find(
					key => key.split(coolSep)[1] === urlOrNext,
				);
				if (goodKey) setCurrentlyPlaying(goodKey);
			} else if (urlOrNext === true) {
				const index = currentlyPlaying
					? resolveds.indexOf(currentlyPlaying)
					: -1;
				const url = resolveds[index + 1];

				if (url) setCurrentlyPlaying(url);
				else setCurrentlyPlaying(null);
			} else if (!urlOrNext && resolveds[0]) {
				setCurrentlyPlaying(resolveds[0]);
			}
		},
		pause() {
			setCurrentlyPlaying(null);
		},
	};

	const songs = (
		song.type === "single"
			? [
				song.previewUrl
				&& `${song.type}-${song.service}-${id}${coolSep}${song.previewUrl}`,
			]
			: song.entries.map(
				x =>
					x.previewUrl
					&& `${song.type}-${song.service}-${id}:${x.id}${coolSep}${x.previewUrl}`,
			)
	).filter(x => !!x) as string[];

	React.useEffect(() => {
		if (currentlyPlaying) sounds.current[currentlyPlaying]?.stop();

		sounds.current = Object.fromEntries(
			songs.map((key, i) => {
				const url = key.split(coolSep)[1];
				const [_, service, __] = key.split(coolSep)[0].split("-");
				return [
					key,
					// spotify previews be so loud
					new MobileAudioSound(
						url,
						"media",
						service === "spotify"
							? spotifyPreviewVolume
							: defaultPreviewVolume,
						{
							onLoad(val) {
								setResolved(res => ({
									...res,
									[key]: val,
								}));
							},
							onEnd() {
								const next = songs.find(
									(nextSng, nextI) => nextI > i && resolved[nextSng],
								);
								if (next && sounds.current[next]) {
									setCurrentlyPlaying(next);
								} else setCurrentlyPlaying(null);
							},
						},
					),
				];
			}),
		);
	}, [songs.join(" ")]);

	React.useEffect(() => {
		for (const [url, snd] of Object.entries(sounds.current)) {
			if (currentlyPlaying === url) {
				if (!snd.isPlaying) snd.play();
			} else {
				if (snd.isPlaying) snd.stop();
			}
		}
	}, [currentlyPlaying]);
	React.useEffect(
		() => () => {
			for (const x of Object.values(sounds.current)) x.stop();
		},
		[],
	);

	return (
		<>
			{children({
				player: {
					get play() {
						return audioPlayer.current.play;
					},
					get pause() {
						return audioPlayer.current.pause;
					},
					get current() {
						return playing.currentlyPlaying
								&& songs.find(
									key =>
										key.split(coolSep)[1]
											=== playing.currentlyPlaying?.split(coolSep)[1],
								)
							? playing.currentlyPlaying.split(coolSep)[1]
							: null;
					},
				},
				loaded: Object.entries(resolved)
					.filter(([_, res]) => res)
					.map(([key]) => key.split(coolSep)[1]),
				resolved: Object.keys(resolved).map(
					key => key.split(coolSep)[1],
				),
			})}
		</>
	);
}
