import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { ContextMenu, PressableScale, Stack } from "$/lib/redesign";

import { lang } from "../..";
import { copyLink, openLink, serviceToIcon } from "../../stuff/songs";
import { getSongInfo, type SongInfo } from "../../stuff/songs/info";
import type { Song } from "../../types";
import { ModifiedDataContext } from "../Settings";

const { FormRow } = Forms;

const { GestureDetector, Gesture } = findByProps("GestureDetector");

const cardHeight = 38 + 32;
const separator = 8;

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
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
		},
		card: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
			alignItems: "center",
		},
		song: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
		},
		grabberHitbox: {
			width: 20 + 16 * 2,
			height: "auto",
			flexGrow: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		grabber: {
			tintColor: semanticColors.INTERACTIVE_NORMAL,
			width: 20,
			height: 20,
		},
	});

	const poss = React.useRef(positions);
	poss.current = positions;

	const [songInfo, setSongInfo] = React.useState<null | false | SongInfo>(
		null,
	);
	const { data, setData } = React.useContext(ModifiedDataContext);

	React.useEffect(() => {
		setSongInfo(null);

		getSongInfo(song)
			.then(val => setSongInfo(val))
			.catch(() => setSongInfo(false));
	}, [song.service + song.type + song.id]);

	const hash = song.service + song.type + song.id;
	const topper = Reanimated.useSharedValue(
		(poss.current[hash] - index) * (cardHeight + separator),
	);

	const dragging = React.useRef(false);
	const zIndex = Reanimated.useSharedValue(1);
	const prevTopper = Reanimated.useSharedValue(0);

	// can't use useAnimatedReaction :(
	const oldPos = React.useRef([poss.current[hash] - index, index]);
	const newPos = [poss.current[hash] - index, index];
	if (oldPos.current[0] !== newPos[0] || oldPos.current[1] !== newPos[1]) {
		if (!dragging.current) {
			if (oldPos.current[1] !== newPos[1]) {
				const indDiff = newPos[1] - oldPos.current[1];
				topper.value -= indDiff * (cardHeight + separator);
			}
			topper.value = Reanimated.withTiming(
				(poss.current[hash] - index) * (cardHeight + separator),
				{ duration: 150 },
			);
		}
		oldPos.current = newPos;
	}

	const pan = Gesture.Pan()
		.minDistance(1)
		.onStart(() => {
			dragging.current = !disabled && !!songInfo;
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

			if (poss.current[hash] !== toPos + index) {
				const ind = Object.entries(poss.current).find(
					([_, v]) => v === toPos + index,
				)?.[0];
				if (ind) {
					updatePos({
						...poss.current,
						[hash]: toPos + index,
						[ind]: poss.current[hash],
					});
				}
			}
		})
		.onEnd(() => {
			if (!dragging.current) return;
			dragging.current = false;

			topper.value = Reanimated.withTiming(
				(poss.current[hash] - index) * (cardHeight + separator),
				{ duration: 150 },
			);
			zIndex.value = 1;
			commit();
		});

	return (
		<Reanimated.default.View
			style={{
				position: "relative",
				top: topper,
				zIndex,
				elevation: zIndex,
				opacity: disabled ? 0.5 : 1,
			}}
		>
			<ContextMenu
				title={lang.format("sheet.manage_song.title", {})}
				triggerOnLongPress
				align="below"
				items={[
					{
						label: lang.format("sheet.manage_song.copy_link", {}),
						variant: "default",
						action: () => !disabled && songInfo && copyLink(song),
						iconSource: getAssetIDByName("LinkIcon"),
					},
					{
						label: lang.format("sheet.manage_song.remove_song", {}),
						variant: "destructive",
						async action() {
							if (disabled || !songInfo) return;

							showToast(
								lang.format("toast.removed_song", {}),
								getAssetIDByName("TrashIcon"),
							);

							const hash = song.service + song.type + song.id;
							setData(
								data.filter(
									sng =>
										sng.service + sng.type + sng.id
											!== hash,
								),
							);
						},
						iconSource: getAssetIDByName("TrashIcon"),
					},
				]}
			>
				{props => (
					<PressableScale
						{...props}
						onPress={() => openLink(song)}
						style={{
							position: "relative",
							left: 0,
							top: 0,
							bottom: 0,
							right: 0,
						}}
						disabled={disabled || !songInfo}
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
									<FormRow.Icon
										source={serviceToIcon[song.service]}
									/>
									<RN.View
										style={{
											flexShrink: 1,
											flexBasis: "100%",
											height: 38,
											alignItems: "flex-start",
											justifyContent: "center",
										}}
									>
										{!songInfo
											? (
												songInfo === false
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
														color="TEXT_NORMAL"
														lineClamp={1}
													>
														{songInfo.label}
													</Text>
													<Text
														variant="text-sm/medium"
														color="TEXT_MUTED"
														lineClamp={1}
													>
														{songInfo.sublabel}
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
