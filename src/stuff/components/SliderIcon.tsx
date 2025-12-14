import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

export default function SliderIcon({
	side,
	onPress,
}: {
	side: "start" | "end";
	onPress: () => void;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
		},
		iconSecondary: {
			width: 24,
			height: 24,
			tintColor: "transparent",
		},
		icon: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_ICON_DEFAULT,
			position: "absolute",
			top: 0,
		},
	});

	const icon = side === "start" ? "CircleMinusIcon" : "CirclePlusIcon";

	return (
		<RN.Pressable
			android_ripple={styles.androidRipple}
			accessible={false}
			onPress={onPress}
		>
			<RN.View>
				<RN.Image
					style={styles.iconSecondary}
					source={getAssetIDByName(`${icon}-secondary`)}
				/>
				<RN.Image
					style={styles.icon}
					source={getAssetIDByName(`${icon}-primary`)}
				/>
			</RN.View>
		</RN.Pressable>
	);
}
