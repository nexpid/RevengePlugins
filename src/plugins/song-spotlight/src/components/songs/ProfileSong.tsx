import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { rawColors, semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { hideActionSheet } from "$/components/ActionSheet";
import Modal from "$/components/Modal";
import Text from "$/components/Text";
import { FlashList, Reanimated } from "$/deps";
import { ContextMenu, IconButton, PressableScale, Stack } from "$/lib/redesign";
import { createThemeContextStyleSheet, formatDuration, openModal } from "$/types";

import FastForwardIcon from "../../../assets/images/player/FastForwardIcon.png";
import { lang } from "../..";
import { useCacheStore } from "../../stores/CacheStore";
import { copyLink, openLink, serviceToIcon } from "../../stuff/songs";
import { getSongInfo, skeletonSongInfo, type SongInfo } from "../../stuff/songs/info";
import type { Song } from "../../types";
import AudioPlayer from "../AudioPlayer";
import Settings from "../Settings";
import { EntrySong } from "./EntrySong";

const minTracksInEntriesView = 3;
const { useThemeContext } = findByProps("useThemeContext");

export default function ProfileSong({
	song,
	customBorder,
	playing,
}: {
	song: Song;
	customBorder?: string;
	playing: {
		currentlyPlaying: string | null;
		setCurrentlyPlaying: (value: string | null) => void;
	};
}) {
	const isEntries = ["album", "playlist", "artist", "user"].includes(
		song.type,
	);
	const themeContext = useThemeContext();

	const [_songInfo, setSongInfo] = React.useState<null | false | SongInfo>(
		null,
	);
	const songInfo = _songInfo
		|| (isEntries ? skeletonSongInfo.entries() : skeletonSongInfo.single());

	React.useEffect(() => {
		setSongInfo(null);

		getSongInfo(song)
			.then(val => setSongInfo(val))
			.catch(() => setSongInfo(false));
	}, [song.service + song.type + song.id]);

	const cardBackground = themeContext.theme === "light"
		? `${rawColors.PRIMARY_400}29`
		: `${rawColors.PLUM_0}08`;
	const noCardBackground = themeContext.theme === "light"
		? `${rawColors.PRIMARY_400}14`
		: `${rawColors.PLUM_0}09`;
	const cardBorder = customBorder ?? semanticColors.BORDER_SUBTLE;

	const styles = createThemeContextStyleSheet({
		card: {
			width: "100%",
			backgroundColor: cardBackground,
			borderColor: cardBorder,
			borderWidth: 1,
			borderRadius: 10,
		},
		noCard: {
			backgroundColor: noCardBackground,
			borderRadius: 10,
			borderColor: noCardBackground,
		},
		thumbnail: {
			width: 64,
			height: 64,
			borderRadius: 8,
		},
		explicit: {
			width: 18,
			height: 18,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 4,
			backgroundColor: cardBorder,
		},
		entriesMain: {
			borderTopColor: cardBorder,
			borderTopWidth: 1,
			paddingHorizontal: 10,
			height: 36 * minTracksInEntriesView
				+ 4 * (minTracksInEntriesView - 1)
				+ 10 * 2,
		},
		service: {
			position: "absolute",
			top: 0,
			right: 0,
			width: 24,
			height: 24,
			borderBottomLeftRadius: 9,
			borderTopRightRadius: 10,
			backgroundColor: cardBorder,
			justifyContent: "center",
			alignItems: "center",
		},
		serviceIcon: {
			tintColor: semanticColors.INTERACTIVE_NORMAL,
			width: 18,
			height: 18,
		},
	});

	const cardThing = () => (_songInfo ? styles.card : styles.noCard);

	const opacityValue = Reanimated.useSharedValue(_songInfo ? 1 : 0);
	const backgroundColor = Reanimated.useSharedValue(
		cardThing().backgroundColor,
	);
	const borderColor = Reanimated.useSharedValue(cardThing().borderColor);

	React.useEffect(() => {
		opacityValue.value = Reanimated.withSpring(_songInfo ? 1 : 0);
		backgroundColor.value = Reanimated.withSpring(
			cardThing().backgroundColor,
		);
		borderColor.value = Reanimated.withSpring(cardThing().borderColor);
	}, [!!_songInfo]);

	return (
		<Reanimated.default.View
			style={[
				styles.card,
				!_songInfo && styles.noCard,
				{ backgroundColor, borderColor },
			]}
		>
			<Reanimated.default.View
				style={[
					{ opacity: _songInfo ? 1 : 0 },
					{ opacity: opacityValue },
				]}
				key={"body"}
			>
				<RN.View style={styles.service}>
					<RN.Image
						source={serviceToIcon[song.service]}
						style={styles.serviceIcon}
					/>
				</RN.View>
				<AudioPlayer song={songInfo} id={song.id} playing={playing}>
					{({ player, loaded, resolved }) => (
						<>
							<Stack
								direction="horizontal"
								spacing={12}
								style={{ padding: 10 }}
							>
								<ContextMenu
									title={songInfo.label}
									triggerOnLongPress
									items={[
										{
											label: lang.format(
												"sheet.user_song.steal_song",
												{},
											),
											variant: "default",
											action() {
												const data = useCacheStore.getState()
													.data ?? [];
												if (data.length >= 6) {
													return showToast(
														lang.format(
															"toast.steal_song_no_space_left",
															{},
														),
														getAssetIDByName(
															"CircleXIcon-primary",
														),
													);
												}
												if (
													data.find(
														item =>
															item.service
																	+ item.type
																	+ item.id
																=== song.service
																	+ song.type
																	+ song.id,
													)
												) {
													return showToast(
														lang.format(
															"toast.song_already_exists",
															{},
														),
														getAssetIDByName(
															"CircleXIcon-primary",
														),
													);
												}

												const newData = [
													...data,
													song,
												].slice(0, 6);

												hideActionSheet();
												openModal("settings", () => (
													<Modal
														mkey="settings"
														title={lang.format(
															"plugin.name",
															{},
														)}
													>
														<Settings
															newData={newData}
														/>
													</Modal>
												));
											},
											iconSource: getAssetIDByName(
												"UnknownGameIcon",
											),
										},
										{
											label: lang.format(
												"sheet.manage_song.copy_link",
												{},
											),
											variant: "default",
											action: () => copyLink(song),
											iconSource: getAssetIDByName("LinkIcon"),
										},
									]}
								>
									{props => (
										<PressableScale
											{...props}
											onPress={() => openLink(song)}
										>
											<RN.Image
												source={{
													uri: songInfo.thumbnailUrl,
													width: 64,
													height: 64,
													cache: "force-cache",
												}}
												style={styles.thumbnail}
											/>
										</PressableScale>
									)}
								</ContextMenu>
								<Stack
									spacing={-1}
									style={{
										width: "75%",
										flexShrink: 1,
									}}
								>
									<Stack
										direction="horizontal"
										spacing={8}
										style={{ alignItems: "center" }}
									>
										<Text
											variant="text-md/bold"
											color="TEXT_NORMAL"
											style={{ flexShrink: 1 }}
											lineClamp={1}
										>
											{songInfo.label}
										</Text>
										{songInfo.type === "single"
											&& songInfo.explicit && (
											<RN.View
												style={styles.explicit}
											>
												<Text
													variant="text-sm/bold"
													color="TEXT_NORMAL"
												>
													E
												</Text>
											</RN.View>
										)}
									</Stack>
									<Text
										variant="text-md/normal"
										color="TEXT_MUTED"
										lineClamp={1}
										style={{
											flexShrink: 1,
										}}
									>
										{songInfo.sublabel}
									</Text>
								</Stack>
								<RN.View
									style={{
										marginLeft: "auto",
										justifyContent: "flex-end",
									}}
								>
									<Stack
										direction="horizontal"
										spacing={8}
										style={{
											alignSelf: "flex-end",
											alignItems: "flex-end",
										}}
									>
										{songInfo.type === "single" && (
											<Text
												variant="text-md/medium"
												color="TEXT_MUTED"
											>
												{formatDuration(
													Math.ceil(
														songInfo.duration
															/ 1000,
													),
												)}
											</Text>
										)}
										{songInfo.type === "entries" && (
											<IconButton
												variant="secondary"
												icon={FastForwardIcon}
												size="sm"
												disabled={!loaded[0]}
												onPress={() => player.play(true)}
											/>
										)}
										<IconButton
											variant="secondary"
											icon={player.current
												? getAssetIDByName(
													"PauseIcon",
												)
												: getAssetIDByName(
													"PlayIcon",
												)}
											size="sm"
											loading={!resolved[0]}
											disabled={!loaded[0]}
											onPress={() =>
												player.current
													? player.pause()
													: player.play()}
										/>
									</Stack>
								</RN.View>
							</Stack>
							{songInfo.type === "entries" && (
								<RN.View style={styles.entriesMain}>
									<FlashList
										data={songInfo.entries}
										keyExtractor={item => item.id}
										nestedScrollEnabled
										scrollEnabled
										estimatedItemSize={36}
										ItemSeparatorComponent={() => <RN.View style={{ height: 4 }} />}
										ListHeaderComponent={() => <RN.View style={{ height: 5 }} />}
										ListFooterComponent={() => <RN.View style={{ height: 5 }} />}
										extraData={[
											player.current,
											loaded.length,
										]}
										renderItem={({ item, index }) => (
											<EntrySong
												player={player}
												entry={item}
												index={index}
												isLoaded={item.previewUrl
													? loaded.includes(
														item.previewUrl,
													)
													: false}
											/>
										)}
									/>
								</RN.View>
							)}
						</>
					)}
				</AudioPlayer>
			</Reanimated.default.View>
		</Reanimated.default.View>
	);
}
