import { findByProps } from "@vendetta/metro";
import { clipboard, React, ReactNative as RN, stylesheet, url } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { ContextMenu, PressableScale, Stack } from "$/lib/redesign";

import { renderSong, type RenderSongInfo } from "@song-spotlight/api/handlers";
import type { Song } from "@song-spotlight/api/structs";
import { sid } from "@song-spotlight/api/util";
import { lang } from "../..";
import { serviceIcons } from "../../stuff/songs";
import { ModifiedDataContext } from "../Settings";

const { FormRow } = Forms;

const { GestureDetector, Gesture } = findByProps("GestureDetector");

const cardHeight = 38 + 32;
const separator = 8;

const animMs = 150;

export default function SongInfo({
	song,
	disabled,
	index,
	itemCount,
	positions,
	commit,
	updatePos,
}: {
	song: Song;
	disabled: boolean;
	index: number;
	itemCount: number;
	positions: Record<string, number>;
	commit: () => void;
	updatePos: (value: Record<string, number>) => void;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		cardOuter: {
			borderRadius: 8,
			backgroundColor: semanticColors.CARD_BACKGROUND_DEFAULT,
		},
		card: {
			backgroundColor: semanticColors.BACKGROUND_MOD_MUTED,
			borderRadius: 8,
			alignItems: "center",
		},
		songIcon: {
			width: 30,
			height: 30,
			backgroundColor: semanticColors.BACKGROUND_MOD_SUBTLE,
			borderRadius: 15,
			justifyContent: "center",
			alignItems: "center",
		},
		grabberHitbox: {
			width: 20 + 16 * 2,
			height: "auto",
			flexGrow: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		grabber: {
			tintColor: semanticColors.INTERACTIVE_ICON_DEFAULT,
			width: 20,
			height: 20,
		},
	});

	const poss = React.useRef(positions);
	poss.current = positions;

	const id = sid(song);
	const [songRender, setSongRender] = React.useState<null | false | RenderSongInfo>(
		null,
	);
	const { data, setData } = React.useContext(ModifiedDataContext);

	React.useEffect(() => {
		setSongRender(null);

		renderSong(song)
			.then(val => setSongRender(val))
			.catch(() => setSongRender(false));
	}, [id]);

	const topper = Reanimated.useSharedValue(
		(poss.current[id] - index) * (cardHeight + separator),
	);

	const dragging = React.useRef(false);
	const zIndex = Reanimated.useSharedValue(1);
	const prevTopper = Reanimated.useSharedValue(0);
	const opacity = Reanimated.useSharedValue(disabled ? 0.5 : 1);

	// can't use useAnimatedReaction :(
	const oldPos = React.useRef([poss.current[id] - index, index]);
	const newPos = [poss.current[id] - index, index];
	if (oldPos.current[0] !== newPos[0] || oldPos.current[1] !== newPos[1]) {
		if (!dragging.current) {
			if (oldPos.current[1] !== newPos[1]) {
				const indDiff = newPos[1] - oldPos.current[1];
				topper.value -= indDiff * (cardHeight + separator);
			}
			topper.value = Reanimated.withTiming(
				(poss.current[id] - index) * (cardHeight + separator),
				{ duration: animMs },
			);
		}
		oldPos.current = newPos;
	}

	const pan = Gesture.Pan()
		.minDistance(1)
		.onStart(() => {
			dragging.current = !disabled && !!songRender;
			if (!dragging.current) return;

			prevTopper.value = topper.value;
			zIndex.value = 100;
		})
		.onUpdate(({ translationY }) => {
			if (!dragging.current) return;
			const top = -index,
				bottom = itemCount - 1 - index;

			const height = cardHeight + separator;
			topper.value = Math.max(
				Math.min(prevTopper.value + translationY, bottom * height),
				top * height,
			);

			const toPos = Math.max(
				Math.min(
					Math.floor(
						(prevTopper.value + translationY + cardHeight / 2)
							/ (cardHeight + separator),
					),
					bottom,
				),
				top,
			);

			if (poss.current[id] !== toPos + index) {
				const ind = Object.entries(poss.current).find(
					([_, v]) => v === toPos + index,
				)?.[0];
				if (ind) {
					updatePos({
						...poss.current,
						[id]: toPos + index,
						[ind]: poss.current[id],
					});
				}
			}
		})
		.onEnd(() => {
			if (!dragging.current) return;
			dragging.current = false;

			topper.value = Reanimated.withTiming(
				(poss.current[id] - index) * (cardHeight + separator),
				{ duration: animMs },
			);
			zIndex.value = 1;
			commit();
		});

	React.useEffect(() => {
		opacity.value = Reanimated.withTiming(disabled ? 0.5 : 1, { duration: 50 });
	}, [disabled]);

	return (
		<Reanimated.default.View
			style={[{
				position: "relative",
				opacity: disabled ? 0.5 : 1,
			}, {
				top: topper,
				zIndex,
				elevation: zIndex,
				opacity,
			}]}
		>
			<ContextMenu
				title={lang.format("sheet.manage_song.title", {})}
				triggerOnLongPress
				align="below"
				items={[
					{
						label: lang.format("sheet.manage_song.copy_link", {}),
						variant: "default",
						action: () => {
							if (disabled || !songRender) return;

							clipboard.setString(songRender.link);
							showToast(
								lang.format("toast.copied_link", {}),
								getAssetIDByName("CopyIcon"),
							);
						},
						iconSource: getAssetIDByName("LinkIcon"),
					},
					{
						label: lang.format("sheet.manage_song.remove_song", {}),
						variant: "destructive",
						async action() {
							if (disabled || !songRender) return;

							showToast(
								lang.format("toast.removed_song", {}),
								getAssetIDByName("TrashIcon"),
							);

							setData(
								data.filter(item => sid(item) !== sid(song)),
							);
						},
						iconSource: getAssetIDByName("TrashIcon"),
					},
				]}
			>
				{props => (
					<PressableScale
						{...props}
						onPress={() => songRender && url.openDeeplink(songRender.link)}
						style={{
							position: "relative",
							left: 0,
							top: 0,
							bottom: 0,
							right: 0,
						}}
						disabled={disabled || !songRender}
					>
						<Reanimated.default.View style={styles.cardOuter}>
							<Stack direction="horizontal" style={styles.card}>
								<Stack
									direction="horizontal"
									spacing={16}
									style={{
										padding: 16,
										alignItems: "center",
										flexShrink: 1,
									}}
								>
									<RN.View style={styles.songIcon}>
										<FormRow.Icon
											source={serviceIcons[song.service]}
										/>
									</RN.View>
									<RN.View
										style={{
											flexShrink: 1,
											flexBasis: "100%",
											height: 38,
											alignItems: "flex-start",
											justifyContent: "center",
										}}
									>
										{!songRender
											? (
												songRender === false
													? (
														<Text
															variant="text-md/semibold"
															color="TEXT_MUTED"
														>
															{"<err!>"}
														</Text>
													)
													: <RN.ActivityIndicator size="small" />
											)
											: (
												<>
													<Text
														variant="text-md/semibold"
														color="TEXT_DEFAULT"
														lineClamp={1}
													>
														{songRender.label}
													</Text>
													<Text
														variant="text-sm/medium"
														color="TEXT_MUTED"
														lineClamp={1}
													>
														{songRender.sublabel}
													</Text>
												</>
											)}
									</RN.View>
								</Stack>
								{itemCount > 1 && (
									<RN.View style={{ marginLeft: "auto" }}>
										<GestureDetector gesture={pan}>
											<RN.Pressable
												style={styles.grabberHitbox}
											>
												<RN.Image
													source={getAssetIDByName(
														"DragIcon",
													)}
													style={styles.grabber}
												/>
											</RN.Pressable>
										</GestureDetector>
									</RN.View>
								)}
							</Stack>
						</Reanimated.default.View>
					</PressableScale>
				)}
			</ContextMenu>
		</Reanimated.default.View>
	);
}
