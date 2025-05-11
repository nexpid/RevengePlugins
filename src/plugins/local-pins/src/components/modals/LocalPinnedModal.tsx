import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { ReactNative as RN, stylesheet, url } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { hideActionSheet, showSimpleActionSheet } from "$/components/ActionSheet";
import Modal from "$/components/Modal";
import Text from "$/components/Text";
import intlProxy from "$/lib/intlProxy";
import { popModal } from "$/types";

import { hasAnyPin, removePin } from "../..";
import useLocalPinned from "../../hooks/useLocalPinned";

const { default: ChatItemWrapper } = findByProps(
	"DCDAutoModerationSystemMessageView",
	"default",
);
const MessageRecord = findByName("MessageRecord");
const RowManager = findByName("RowManager");

const ThemeStore = findByStoreName("ThemeStore");

const Message = ({
	message,
	channelId,
	channel,
	remove,
}: {
	message: any;
	channelId: string;
	channel?: any;
	remove: () => void;
}) => {
	const styles = stylesheet.createThemedStyleSheet({
		message: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			padding: 8,
			borderRadius: 8,
			flexDirection: "column",
			gap: 4,
		},
		icon: {
			width: 16,
			height: 16,
			tintColor: semanticColors.TEXT_NORMAL,
		},
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 8,
			foreground: true,
		} as any,
	});

	return (
		<RN.Pressable
			style={styles.message}
			android_ripple={styles.androidRipple}
			onPress={() => {
				popModal();
				url.openDeeplink(
					`https://discord.com/channels/${
						channel?.guild_id ?? "@me"
					}/${channelId}/${message.id}`,
				);
			}}
			onLongPress={() => {
				showSimpleActionSheet({
					key: "CardOverflow",
					header: {
						title: "Pinned Message",
						onClose: hideActionSheet,
					},
					options: [
						{
							label: "Unpin",
							icon: getAssetIDByName("PinIcon"),
							onPress: () => {
								removePin(channelId, message.id);
								remove();
							},
						},
					],
				});
			}}
			pointerEvents="box-only"
		>
			<RN.View
				style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
			>
				<RN.Image
					style={styles.icon}
					source={getAssetIDByName("ChatIcon")}
					resizeMode="cover"
				/>
				<Text variant="text-md/medium" color="TEXT_NORMAL">
					{channel?.name ?? "unknown"}
				</Text>
			</RN.View>
			<ChatItemWrapper
				rowGenerator={new RowManager()}
				message={new MessageRecord(message)}
			/>
		</RN.Pressable>
	);
};

export default function LocalPinnedModal() {
	const styles = stylesheet.createThemedStyleSheet({
		main: {
			flexDirection: "column",
			gap: 16,
			paddingHorizontal: 8,
			paddingTop: 8,
			paddingBottom: 36,
		},
		bowomp: {
			flex: 1,
			gap: 4,
			alignItems: "center",
			justifyContent: "center",
			flexDirection: "column",
		},
	});

	const { data, status, remove } = useLocalPinned(undefined);
	if (!hasAnyPin()) {
		return (
			<Modal mkey="local-pinned" title="Local Pinned">
				<RN.View style={styles.bowomp}>
					<RN.Image
						source={{
							dark: getAssetIDByName("img_pins_empty_dark"),
							light: getAssetIDByName("img_pins_empty_light"),
						}[ThemeStore.theme]
							?? getAssetIDByName("img_pins_empty_darker")}
						resizeMode="contain"
						style={{ marginLeft: 35 }}
					/>
					<Text
						variant="text-md/medium"
						color="TEXT_MUTED"
						align="center"
					>
						{intlProxy.NO_PINS_IN_CHANNEL}
					</Text>
				</RN.View>
			</Modal>
		);
	}

	return (
		<Modal mkey="local-pinned" title="Local Pinned">
			{!data
				? (
					<RN.View
						style={{
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
						}}
					>
						<RN.ActivityIndicator
							size="large"
							style={{ marginBottom: 10 }}
						/>
						<Text
							variant="text-lg/semibold"
							color="TEXT_NORMAL"
							align="center"
						>
							{Math.floor(status * 100)}%
						</Text>
					</RN.View>
				)
				: (
					<RN.ScrollView style={{ flex: 1 }}>
						<RN.View style={styles.main}>
							{data.map(x => (
								<Message
									{...x}
									remove={() => {
										remove(x.message.id);
									}}
									key={x.message.id}
								/>
							))}
						</RN.View>
					</RN.ScrollView>
				)}
		</Modal>
	);
}
