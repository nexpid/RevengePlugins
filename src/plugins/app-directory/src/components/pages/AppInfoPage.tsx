import { findByProps } from "@vendetta/metro";
import {
	clipboard,
	React,
	ReactNative as RN,
	stylesheet,
	url,
} from "@vendetta/metro/common";
import { rawColors, semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import Text from "$/components/Text";
import usePromise from "$/hooks/usePromise";
import intlProxy from "$/lib/intlProxy";
import { Button } from "$/lib/redesign";
import { managePage } from "$/lib/ui";

import {
	type APICollectionApplication,
	getAppDirectoryApplication,
} from "../../stuff/api";
import { parse } from "../../stuff/markdown";
import { openOauth2Modal } from "../../stuff/oauth2";
import { inServers, parseDesc } from "../../stuff/util";

const { TableRowGroup, TableRow, TableRowIcon, TableRowGroupTitle } = findByProps(
	"TableRowGroup",
	"TableRow",
);
const { TableRowDivider } = findByProps("TableRowDivider");

export default function AppInfoPage({
	app,
	guildId,
}: {
	app: APICollectionApplication;
	guildId?: string;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		carouselEmpty: {
			backgroundColor: rawColors.BRAND_500,
			width: "100%",
			aspectRatio: 6 / 2,
			borderRadius: 8,
		},

		carousel: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			width: "100%",
			aspectRatio: 5 / 3,
			borderRadius: 8,
		},
		carouselDots: {
			position: "absolute",
			bottom: 8,
			justifyContent: "center",
			flexDirection: "row",
			width: "100%",
			height: 6,
			gap: 9,
		},
		carouselDot: {
			height: "100%",
			aspectRatio: 1,
			borderRadius: 2147483647,
		},
		carouselDotActive: {
			backgroundColor: "#fff",
		},
		carouselDotInactive: {
			backgroundColor: "#fff4",
		},

		appIcon: {
			borderRadius: 2147483647,
			backgroundColor: semanticColors.BG_BASE_SECONDARY,
			width: 80,
			height: 80,
			marginTop: -40,
			marginLeft: 8,
			marginBottom: 8,
		},

		group: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			padding: 16,
			borderRadius: 16,
			marginBottom: 24,
		},
		sillyGroup: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			paddingTop: 16,
			borderRadius: 16,
			marginBottom: 24,
		},

		baseAppActions: { flexDirection: "row", gap: 12 },
		baseAppActionIcon: {
			marginRight: 4,
			height: 20,
			width: 20,
			tintColor: semanticColors.TEXT_NORMAL,
		},

		popularCommand: {
			flexDirection: "row",
			gap: 8,
			alignItems: "center",
		},
		popularCommandCmd: {
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			padding: 6,
			borderWidth: 1,
			borderColor: semanticColors.BG_MOD_STRONG,
			borderRadius: 8,
		},
	});

	managePage({
		title: app.name,
	});

	const carouselProgress = React.useRef(new RN.Animated.Value(0)).current;
	const carouselWidth = RN.Dimensions.get("window").width - 32;
	const carouselIndexContent = app.directory_entry.carousel_items?.map((_, i) => i) ?? [];

	const detailedInfoPromise = usePromise(
		() => getAppDirectoryApplication(app.id),
		[],
	);

	const detailedInfo = detailedInfoPromise.fulfilled
		&& detailedInfoPromise.success
		&& detailedInfoPromise.response;
	if (!detailedInfo) {
		return <RN.ActivityIndicator size="large" style={{ flex: 1 }} />;
	}

	return (
		<RN.ScrollView
			style={{
				flex: 1,
				paddingHorizontal: 16,
				paddingTop: 16,
			}}
		>
			{carouselIndexContent.length
				? (
					<RN.View style={styles.carousel}>
						<RN.FlatList
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							decelerationRate="normal"
							data={app.directory_entry.carousel_items?.filter(
								x => x.type === 1,
							)}
							style={{
								width: "100%",
								height: "100%",
								position: "relative",
							}}
							scrollEventThrottle={16}
							onScroll={({ nativeEvent }) => {
								RN.Animated.timing(carouselProgress, {
									toValue: Math.max(
										Math.min(
											nativeEvent.contentOffset.x
												/ nativeEvent.layoutMeasurement.width,
											carouselIndexContent.length,
										),
										0,
									),
									duration: 100,
									easing: RN.Easing.linear,
									useNativeDriver: true,
								}).start();
							}}
							renderItem={({ item: img }) => (
								<RN.Image
									style={{
										height: "100%",
										width: carouselWidth,
										borderRadius: 8,
									}}
									source={{
										uri: `${img.proxy_url}?width=${
											Math.floor(
												carouselWidth,
											)
										}&height=${
											Math.floor(
												carouselWidth
													/ styles.carousel.aspectRatio,
											)
										}`,
									}}
									resizeMode="contain"
								/>
							)}
						/>
						<RN.View style={styles.carouselDots}>
							{carouselIndexContent.map(i => (
								<RN.Animated.View
									style={[
										styles.carouselDot,
										{
											backgroundColor: carouselIndexContent.length === 1
												? styles.carouselDotActive
													.backgroundColor
												: carouselProgress.interpolate({
													inputRange: carouselIndexContent,
													outputRange: carouselIndexContent.map(
														j =>
															i === j
																? styles
																	.carouselDotActive
																	.backgroundColor
																: styles
																	.carouselDotInactive
																	.backgroundColor,
													),
												}),
										},
									]}
								/>
							))}
						</RN.View>
					</RN.View>
				)
				: <RN.View style={styles.carouselEmpty} />}
			<RN.Image
				style={styles.appIcon}
				source={{
					uri: `https://cdn.discordapp.com/app-icons/${app.id}/${app.icon}.webp?size=80`,
				}}
			/>
			<RN.View style={styles.group}>
				<Text variant="text-lg/semibold" color="TEXT_NORMAL">
					{app.name}
				</Text>
				<Text
					variant="text-md/normal"
					color="TEXT_MUTED"
					style={{ paddingBottom: 8 }}
					lineClamp={1}
				>
					{inServers(app.directory_entry.guild_count)}
				</Text>
				{app.categories.length > 0 && (
					<Text
						variant="text-md/normal"
						color="TEXT_MUTED"
						style={{ paddingBottom: 8 }}
						lineClamp={1}
					>
						{app.categories.map(x => x.name).join(", ")}
					</Text>
				)}
				<RN.View style={{ marginBottom: 12 }}>
					<TableRowDivider />
				</RN.View>
				<RN.View style={styles.baseAppActions}>
					<Button
						style={{ flex: 1 / 2 }}
						text={intlProxy.APP_DIRECTORY_PROFILE_SHARE_BUTTON}
						variant="secondary"
						size="md"
						icon={getAssetIDByName("copy")}
						onPress={() => {
							clipboard.setString(
								`https://discord.com/application-directory/${app.id}`,
							);
							showToast(
								intlProxy.COPIED_LINK,
								getAssetIDByName("toast_copy_link"),
							);
						}}
					/>
					<Button
						style={{ flex: 1 / 2 }}
						text={intlProxy.APP_DIRECTORY_PROFILE_ADD_BUTTON}
						variant="primary"
						size="md"
						icon={getAssetIDByName("DownloadIcon")}
						onPress={() =>
							app.custom_install_url
								? url.openURL(app.custom_install_url)
								: openOauth2Modal(
									app.id,
									Object.assign(
										app.install_params ?? {},
										guildId && {
											guild_id: guildId,
											disable_guild_select: true,
										},
									),
								)}
					/>
				</RN.View>
			</RN.View>
			<RN.View style={styles.group}>
				{parseDesc(
					app.directory_entry.detailed_description,
					app.directory_entry.short_description,
				).map(({ title, content }, i, a) => (
					<>
						<TableRowGroupTitle title={title} />
						<Text
							variant="text-md/normal"
							color="TEXT_NORMAL"
							style={{
								marginBottom: i !== a.length - 1 ? 24 : 0,
							}}
						>
							{parse(content.join("\n"))}
						</Text>
					</>
				))}
			</RN.View>
			{detailedInfo.directory_entry.popular_application_commands && (
				<RN.View style={styles.group}>
					<TableRowGroupTitle
						title={intlProxy.APP_DIRECTORY_PROFILE_COMMANDS_HEADING}
					/>
					{detailedInfo.directory_entry.popular_application_commands.map(
						(x, i, a) => (
							<RN.View
								style={[
									styles.popularCommand,
									{
										marginBottom: i !== a.length - 1 ? 8 : 0,
									},
								]}
							>
								<Text
									variant="text-md/semibold"
									color="TEXT_NORMAL"
									style={styles.popularCommandCmd}
								>
									/{x.name}
								</Text>
								<Text
									variant="text-md/normal"
									color="HEADER_SECONDARY"
									lineClamp={1}
								>
									{x.description}
								</Text>
							</RN.View>
						),
					)}
				</RN.View>
			)}
			<RN.View style={styles.sillyGroup}>
				<RN.View style={{ paddingHorizontal: 16 }}>
					<TableRowGroupTitle
						title={intlProxy.APP_DIRECTORY_PROFILE_LINKS_HEADING}
					/>
				</RN.View>
				<TableRowGroup>
					{...(app.directory_entry.external_urls.map(x => (
						<TableRow
							label={x.name}
							icon={
								<TableRowIcon
									source={getAssetIDByName("LinkIcon")}
								/>
							}
							onPress={() => url.openURL(x.url)}
						/>
					)) ?? [])}
					{app.terms_of_service_url && (
						<TableRow
							label={intlProxy.APP_DIRECTORY_PROFILE_TERMS_LINK}
							icon={
								<TableRowIcon
									source={getAssetIDByName("LinkIcon")}
								/>
							}
							onPress={() => url.openURL(app.terms_of_service_url)}
						/>
					)}
					{app.privacy_policy_url && (
						<TableRow
							label={intlProxy.APP_DIRECTORY_PROFILE_PRIVACY_LINK}
							icon={
								<TableRowIcon
									source={getAssetIDByName("LockIcon")}
								/>
							}
							onPress={() => url.openURL(app.privacy_policy_url)}
						/>
					)}
				</TableRowGroup>
			</RN.View>
			<RN.View style={{ height: 16 }} />
		</RN.ScrollView>
	);
}

export function getAppInfoPageRender(
	app: APICollectionApplication,
	guildId?: string,
) {
	return () => <AppInfoPage app={app} guildId={guildId} />;
}
