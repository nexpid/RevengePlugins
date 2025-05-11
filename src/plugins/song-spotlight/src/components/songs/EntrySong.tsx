import { ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import Text from "$/components/Text";
import { PressableScale, Stack } from "$/lib/redesign";
import { createThemeContextStyleSheet } from "$/types";

import type { SongInfoEntry } from "../../stuff/songs/info";
import type { AudioPlayer } from "../AudioPlayer";

export function EntrySong({
	player,
	entry,
	index,
	isLoaded,
}: {
	player: AudioPlayer;
	entry: SongInfoEntry;
	index: number;
	isLoaded: boolean;
}) {
	const styles = createThemeContextStyleSheet({
		indexCont: {
			width: 24,
			alignItems: "center",
			justifyContent: "center",
		},
		pauseIcon: {
			width: 18,
			height: 18,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
		explicit: {
			width: 16,
			height: 16,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 4,
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
		},
	});
	return (
		<PressableScale
			onPress={() =>
				isLoaded
				&& entry.previewUrl
				&& (player.current === entry.previewUrl
					? player.pause()
					: player.play(entry.previewUrl))}
			style={!isLoaded ? { opacity: 0.5 } : {}}
			disabled={!isLoaded}
		>
			<Stack
				direction="horizontal"
				spacing={8}
				style={{ alignItems: "center" }}
			>
				<RN.View
					style={{
						width: 24,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{player.current === entry.previewUrl
						? (
							<RN.Image
								source={getAssetIDByName("PauseIcon")}
								style={styles.pauseIcon}
							/>
						)
						: (
							<Text
								variant="text-md/medium"
								color="TEXT_NORMAL"
								align="center"
							>
								{index + 1}
							</Text>
						)}
				</RN.View>
				<Stack spacing={0}>
					<Text
						variant="text-sm/medium"
						color="TEXT_NORMAL"
						lineClamp={1}
					>
						{entry.label}
					</Text>
					<Stack
						direction="horizontal"
						spacing={4}
						style={{ alignItems: "center" }}
					>
						{entry.explicit && (
							<RN.View style={styles.explicit}>
								<Text variant="text-xs/bold" color="TEXT_MUTED">
									E
								</Text>
							</RN.View>
						)}
						<Text
							variant="text-sm/normal"
							color="TEXT_MUTED"
							lineClamp={1}
						>
							{entry.sublabel}
						</Text>
					</Stack>
				</Stack>
			</Stack>
		</PressableScale>
	);
}
