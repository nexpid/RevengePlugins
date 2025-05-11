import { type React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import type { ImageSourcePropType } from "react-native";

import {
	ActionSheet,
	hideActionSheet,
	showSimpleActionSheet,
} from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { PressableScale } from "$/lib/redesign";
import { getDiscordTheme } from "$/types";

import { vstorage } from "../..";
import wallpapers, {
	type Collection,
	type CollectionEntry,
} from "../../stuff/wallpapers";
import AddBackgroundSheet from "../sheets/AddBackgroundSheet";

function Wallpaper({
	label,
	image,
	centerImage,
	selected,
	onPress,
	onLongPress,
}: React.PropsWithChildren<{
	label: string;
	image: ImageSourcePropType;
	centerImage?: boolean;
	selected: boolean;
	onPress: () => void;
	onLongPress?: () => void;
}>) {
	const dims = RN.Dimensions.get("window");
	const styles = stylesheet.createThemedStyleSheet({
		android_ripple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 8,
		} as any,
		thing: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
			width: dims.width / 4,
			height: dims.width / 2,
			marginRight: 8,
		},
		centerThing: {
			alignItems: "center",
			justifyContent: "center",
		},
		selectedThing: {
			borderWidth: 2,
			borderColor: semanticColors.TEXT_BRAND,
		},
		centerImage: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
	});

	return (
		<RN.View>
			<PressableScale
				onPress={onPress}
				onLongPress={onLongPress}
				style={[
					styles.thing,
					centerImage && styles.centerThing,
					selected && styles.selectedThing,
				]}
				android_ripple={styles.android_ripple}
			>
				<RN.Image
					source={image}
					style={centerImage
						? styles.centerImage
						: { width: "100%", height: "100%", borderRadius: 8 }}
					resizeMode="cover"
				/>
			</PressableScale>
			<Text
				variant="text-sm/semibold"
				color="TEXT_NORMAL"
				align="center"
				style={{ marginTop: 8 }}
			>
				{label}
			</Text>
		</RN.View>
	);
}

function WallpaperCollection({
	collection,
	configurable,
}: {
	collection: Collection;
	configurable?: {
		add: (title: string, location: string) => void;
		remove: (entry: CollectionEntry) => void;
	};
}) {
	return (
		<RN.View>
			<Text
				variant="text-md/medium"
				color="TEXT_NORMAL"
				style={{ marginBottom: 8 }}
			>
				{collection.label}
			</Text>
			<RN.ScrollView horizontal>
				{configurable && (
					<Wallpaper
						label="Add"
						image={getAssetIDByName("ImagePlusIcon")}
						centerImage
						selected={false}
						onPress={() => {
							ActionSheet.open(AddBackgroundSheet, {
								add: configurable.add,
							});
						}}
					/>
				)}
				{collection.content.map(x => (
					<Wallpaper
						label={x.title}
						image={{ uri: x.url }}
						selected={vstorage.config.wallpaper === x.url}
						onPress={() => {
							if (vstorage.config.wallpaper === x.url) {
								showToast(
									"Removed background",
									getAssetIDByName("TrashIcon"),
								);
								vstorage.config.wallpaper = "none";
							} else {
								showToast(
									`Set background to ${x.title}`,
									getAssetIDByName("ImagePlusIcon"),
								);
								vstorage.config.wallpaper = x.url;
							}
						}}
						onLongPress={configurable
							&& (() => {
								showSimpleActionSheet({
									key: "CardOverflow",
									header: {
										title: x.title,
										onClose: () => {
											hideActionSheet();
										},
									},
									options: [
										{
											label: "Remove",
											icon: getAssetIDByName("TrashIcon"),
											isDestructive: true,
											onPress: () => {
												showToast(
													`Removed ${x.title}`,
													getAssetIDByName(
														"TrashIcon",
													),
												);
												configurable.remove(x);
											},
										},
									],
								});
							})}
					/>
				))}
			</RN.ScrollView>
		</RN.View>
	);
}

export const ConfigurePage = () => {
	useProxy(vstorage);

	const bestVariant = getDiscordTheme() !== "light" ? "dark" : "light";
	const collections = wallpapers.filter(
		x => x.variant === bestVariant || x.variant === "any",
	);

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			<BetterTableRowGroup
				title="Backgrounds"
				icon={getAssetIDByName("ImageIcon")}
				padding
			>
				{collections.map(x => (
					<>
						<WallpaperCollection collection={x} />
						<RN.View style={{ height: 8 }} />
					</>
				))}
				<WallpaperCollection
					configurable={{
						add: (title, location) => {
							vstorage.config.custom = [
								...vstorage.config.custom,
								{
									title,
									url: location,
								},
							];
						},
						remove: entry => {
							vstorage.config.custom = vstorage.config.custom.filter(
								x => x.url !== entry.url,
							);
						},
					}}
					collection={{
						label: "Custom",
						variant: "any",
						content: vstorage.config.custom,
					}}
				/>
			</BetterTableRowGroup>
			<RN.View style={{ marginBottom: 12 }} />
		</RN.ScrollView>
	);
};

export function openConfigurePage(navigation: any) {
	navigation.push("VendettaCustomPage", {
		title: "Theme configuration",
		render: ConfigurePage,
	});
}
