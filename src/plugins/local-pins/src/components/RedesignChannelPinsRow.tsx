import { findByProps } from "@vendetta/metro";
import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import Text from "$/components/Text";
import { openModal } from "$/types";

import { hasAnyPin } from "..";
import LocalPinnedModal from "./modals/LocalPinnedModal";

const { useChannelListLayout } = findByProps("useChannelListLayout");

export default function RedesignChannelPinsRow({ ret }: { ret: any }) {
	const layout = useChannelListLayout();
	if (!hasAnyPin()) return ret;

	const styles = stylesheet.createThemedStyleSheet({
		main: {
			marginHorizontal: 4,
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
		},
		container: {
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
			position: "relative",
			minHeight: layout === "cozy" ? 64 : 48,
			paddingVertical: layout === "cozy" ? 8 : 4,
			paddingLeft: 20,
			paddingRight: 12,
			borderRadius: layout === "cozy" ? 16 : 12,
		},
		icon: {
			position: "relative",
			borderRadius: 2147483647,
			justifyContent: "center",
			alignItems: "center",
			flexShrink: 0,
			flexGrow: 0,
			width: layout === "cozy" ? 48 : 32,
			height: layout === "cozy" ? 48 : 32,
			marginRight: layout === "cozy" ? 12 : 8,
			backgroundColor: semanticColors.BG_MOD_STRONG,
		},
		iconImg: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
		androidRipple: {
			color: semanticColors.STATUS_WARNING_TEXT,
			cornerRadius: layout === "cozy" ? 16 : 12,
		} as any,
	});

	return (
		<>
			{ret}
			<RN.Pressable
				style={styles.main}
				android_ripple={styles.androidRipple}
				onPress={() => {
					openModal("local-pinned", LocalPinnedModal);
				}}
			>
				<RN.View style={styles.container}>
					<RN.View style={styles.icon}>
						<RN.Image
							source={getAssetIDByName("PinIcon")}
							style={styles.iconImg}
							resizeMode="cover"
						/>
					</RN.View>
					<Text
						variant="redesign/channel-title/semibold"
						color="REDESIGN_CHANNEL_NAME_MUTED_TEXT"
					>
						Local Pinned
					</Text>
				</RN.View>
			</RN.Pressable>
		</>
	);
}
