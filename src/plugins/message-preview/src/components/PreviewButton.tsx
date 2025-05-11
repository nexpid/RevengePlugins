import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { Reanimated } from "$/deps";

import openPreview from "../stuff/openPreview";
import type { ChatInputProps } from "../stuff/patcher";

const ACTION_ICON_SIZE = 40;
const styles = stylesheet.createThemedStyleSheet({
	androidRipple: {
		color: semanticColors.ANDROID_RIPPLE,
		cornerRadius: 2147483647,
	} as any,
	actionButton: {
		borderRadius: 2147483647,
		height: ACTION_ICON_SIZE,
		width: ACTION_ICON_SIZE,
		marginHorizontal: 4,
		flexShrink: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: semanticColors.BACKGROUND_SECONDARY_ALT,

		marginLeft: 8,
		marginTop: -4,
	},
	actionIcon: {
		tintColor: semanticColors.INTERACTIVE_NORMAL,
		width: ACTION_ICON_SIZE * 0.6,
		height: ACTION_ICON_SIZE * 0.6,
	},
});

export default function PreviewButton({
	inputProps,
}: { inputProps: ChatInputProps }) {
	const [text, setText] = React.useState("");

	React.useEffect(() => {
		const des = before("handleTextChanged", inputProps, ([txt]) => setText(txt));
		return () => void des();
	}, []);

	const fade = Reanimated.useSharedValue(0);
	const shouldAppear = text.length > 0;

	React.useEffect(() => {
		fade.value = Reanimated.withTiming(shouldAppear ? 1 : 0, {
			duration: 100,
		});
	}, [shouldAppear]);

	return (
		<Reanimated.default.View
			style={[
				{
					flexDirection: "row",
					position: "absolute",
					left: 0,
					top: -ACTION_ICON_SIZE,
					zIndex: 3,
				},
				{ opacity: fade.value },
				{ opacity: fade },
			]}
		>
			<RN.Pressable
				android_ripple={styles.androidRipple}
				onPress={shouldAppear ? () => openPreview() : undefined}
				style={[
					styles.actionButton,
					{ pointerEvents: shouldAppear ? "auto" : "none" },
				]}
			>
				<RN.Image
					style={styles.actionIcon}
					source={getAssetIDByName("EyeIcon")}
				/>
			</RN.Pressable>
		</Reanimated.default.View>
	);
}
