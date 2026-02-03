import { React, ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { hideActionSheet } from "$/components/ActionSheet";
import Modal from "$/components/Modal";
import Text from "$/components/Text";
import { FlashList, Reanimated } from "$/deps";
import { ContextMenu, IconButton, PressableScale, Stack } from "$/lib/redesign";
import { createStyles, formatDuration, openModal } from "$/types";

import { renderSong, type RenderSongInfo } from "@song-spotlight/api/handlers";
import type { Song } from "@song-spotlight/api/structs";
import FastForwardIcon from "../../../assets/images/player/FastForwardIcon.png";
import { lang } from "../..";
import { useCacheStore } from "../../stores/CacheStore";
import { copyLink, openLink, serviceIcons, sid, skeletonSongInfo } from "../../stuff/songs";
import AudioPlayer from "../AudioPlayer";
import Settings from "../Settings";
import { EntrySong } from "./EntrySong";

const minTracksInEntriesView = 3;

const cardBorder = semanticColors.BORDER_MUTED;
const useStyles = createStyles({
	card: {
		width: "100%",
		backgroundColor: semanticColors.BACKGROUND_MOD_MUTED,
		borderColor: cardBorder,
		borderWidth: 1,
		borderRadius: 10,
	},
	noCard: {
		backgroundColor: semanticColors.BACKGROUND_MOD_MUTED,
		borderRadius: 10,
		borderColor: semanticColors.BACKGROUND_MOD_MUTED,
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
		tintColor: semanticColors.INTERACTIVE_ICON_DEFAULT,
		width: 18,
		height: 18,
	},
});

export default function ProfileSong({
	song,
	playing,
}: {
	song: Song;
	customBorder?: string;
	playing: {
		currentlyPlaying: string | null;
		setCurrentlyPlaying: (value: string | null) => void;
	};
}) {
	const isList = !["song", "track"].includes(
		song.type,
	);
	const styles = useStyles();

	const [realSongRender, setSongRender] = React.useState<null | false | RenderSongInfo>(
		null,
	);
	const songRender = React.useMemo(
		() => realSongRender || (isList ? skeletonSongInfo.list : skeletonSongInfo.single),
		[realSongRender],
	);

	React.useEffect(() => {
		setSongRender(null);

		renderSong(song)
			.then(val => setSongRender(val))
			.catch(() => setSongRender(false));
	}, [sid(song)]);

	const cardStyle = () => (realSongRender ? styles.card : styles.noCard);

	const opacityValue = Reanimated.useSharedValue(realSongRender ? 1 : 0);
	const backgroundColor = Reanimated.useSharedValue(
		cardStyle().backgroundColor,
	);
	const borderColor = Reanimated.useSharedValue(cardStyle().borderColor);

	React.useEffect(() => {
		opacityValue.value = Reanimated.withSpring(realSongRender ? 1 : 0);
		backgroundColor.value = Reanimated.withSpring(
			cardStyle().backgroundColor,
		);
		borderColor.value = Reanimated.withSpring(cardStyle().borderColor);
	}, [!!realSongRender]);

	return (
		<Reanimated.default.View
			style={[
				styles.card,
				!realSongRender && styles.noCard,
				{ backgroundColor, borderColor },
			]}
		>
			<Reanimated.default.View
				style={[
					{ opacity: realSongRender ? 1 : 0 },
					{ opacity: opacityValue },
				]}
				key={"body"}
			>
				<RN.View style={styles.service}>
					<RN.Image
						source={serviceIcons[song.service]}
						style={styles.serviceIcon}
					/>
				</RN.View>
				<AudioPlayer song={song} render={songRender} id={song.id} playing={playing}>
					{({ player, loaded, resolved }) => (
						<>
							<Stack
								direction="horizontal"
								spacing={12}
								style={{ padding: 10 }}
							>
								<ContextMenu
									title={songRender.label}
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
												if (data.find(item => sid(item) === sid(song))) {
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
													uri: songRender.thumbnailUrl,
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
											color="TEXT_DEFAULT"
											style={{ flexShrink: 1 }}
											lineClamp={1}
										>
											{songRender.label}
										</Text>
										{songRender.form === "single"
											&& songRender.explicit && (
											<RN.View
												style={styles.explicit}
											>
												<Text
													variant="text-sm/bold"
													color="TEXT_DEFAULT"
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
										{songRender.sublabel}
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
										{songRender.form === "single" && (
											<Text
												variant="text-md/medium"
												color="TEXT_MUTED"
											>
												{songRender.single.audio
													? formatDuration(
														Math.ceil(
															songRender.single.audio.duration
																/ 1000,
														),
													)
													: "-:--"}
											</Text>
										)}
										{songRender.form === "list" && (
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
							{songRender.form === "list" && (
								<RN.View style={styles.entriesMain}>
									<FlashList
										data={songRender.list}
										keyExtractor={item => item.link}
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
												isLoaded={item.audio?.previewUrl
													? loaded.includes(
														item.audio.previewUrl,
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
