import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import Text from "$/components/Text";
import { openModal } from "$/types";

import { hasAnyPin } from "..";
import LocalPinnedModal from "./modals/LocalPinnedModal";

export default function ChannelPinsRow() {
	if (!hasAnyPin()) return null;

	const styles = stylesheet.createThemedStyleSheet({
		container: {
			marginHorizontal: 8,
			paddingHorizontal: 8,
			alignItems: "center",
			flexDirection: "row",
			borderRadius: 4,
			height: 48,
		},
		icon: {
			width: 32,
			height: 32,
			borderRadius: 16,
			position: "relative",
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: semanticColors.BG_MOD_STRONG,
		},
		iconImg: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
		text: {
			marginLeft: 16,
			flex: 1,
		},
		androidRipple: {
			color: semanticColors.STATUS_WARNING_TEXT,
			cornerRadius: 4,
		} as any,
	});

	return (
		<RN.Pressable
			style={styles.container}
			android_ripple={styles.androidRipple}
			onPress={() => {
				openModal("local-pinned", LocalPinnedModal);
			}}
		>
			<RN.View style={styles.icon}>
				<RN.Image
					source={getAssetIDByName("PinIcon")}
					style={styles.iconImg}
					resizeMode="cover"
				/>
			</RN.View>
			<Text
				variant="text-md/medium"
				color="CHANNELS_DEFAULT"
				style={styles.text}
			>
				Local Pinned
			</Text>
		</RN.Pressable>
	);
}
