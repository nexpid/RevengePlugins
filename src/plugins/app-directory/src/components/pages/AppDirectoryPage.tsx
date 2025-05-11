import {
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
} from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Search } from "@vendetta/ui/components";

import Text from "$/components/Text";
import usePromise from "$/hooks/usePromise";
import { managePage } from "$/lib/ui";

import { getLocale } from "$/lib/intlProxy";
import {
	type APIAppDirectorySearch,
	type APICollectionApplication,
	type APICollectionItem,
	APICollectionType,
	getAppDirectoryCategories,
	getAppDirectoryCollections,
	searchAppDirectory,
} from "../../stuff/api";
import { inServers } from "../../stuff/util";
import { getAppInfoPageRender } from "./AppInfoPage";

export default function AppDirectoryPage({
	guildId,
	pushScreen,
}: {
	guildId?: string;
	pushScreen?: any;
}) {
	const locale = getLocale();

	const [search, setSearch] = React.useState("");
	const [selCategory, setSelCategory] = React.useState<number | undefined>(
		undefined,
	);

	const categoriesPromise = usePromise(
		() => getAppDirectoryCategories(),
		[locale],
	);
	const collectionsPromise = usePromise(
		() => getAppDirectoryCollections(),
		[locale],
	);

	const [searchPage, setSearchPage] = React.useState(0);
	const searchResultsPromise = usePromise<APIAppDirectorySearch | null>(
		() =>
			search || selCategory !== undefined
				? searchAppDirectory(
					search,
					searchPage + 1,
					selCategory ?? 0,
					guildId,
				)
				: (() => new Promise(res => res(null)))(),
		[search, searchPage, selCategory, locale],
	);

	const categories = categoriesPromise.fulfilled
		&& categoriesPromise.success
		&& categoriesPromise.response;
	const collections = collectionsPromise.fulfilled
		&& collectionsPromise.success
		&& collectionsPromise.response.sort((a, b) => a.position - b.position);
	const searchResults = searchResultsPromise.fulfilled
		&& searchResultsPromise.success
		&& searchResultsPromise.response;

	React.useEffect(() => {
		if (!search) setSelCategory(undefined);
		else if (search && !selCategory) setSelCategory(0);
	}, [search]);

	React.useEffect(() => {
		if (!searchResults) setSearchPage(0);
	}, [searchResults]);

	const jwidth = RN.Dimensions.get("screen").width - 32;

	const styles = stylesheet.createThemedStyleSheet({
		category: {
			backgroundColor: semanticColors.BG_SURFACE_OVERLAY,
			flexDirection: "row",
			justifyContent: "center",
			gap: 8,
			padding: 8,
			borderRadius: 8,
		},
		selCategory: {
			backgroundColor: semanticColors.BG_SURFACE_RAISED,
		},
		categoryIcon: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
		bottomNav: {
			flexDirection: "row",
			marginTop: 16,
			gap: 8,
			justifyContent: "center",
		},
		bottomNavItem: {
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			borderRadius: 6969,
			paddingVertical: 6,
			paddingHorizontal: 11,
		},
		bottomNavItemOff: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 6969,
			paddingVertical: 6,
			paddingHorizontal: 11,
		},
		bottomNavItemSelected: {
			backgroundColor: semanticColors.BUTTON_OUTLINE_BRAND_BACKGROUND_HOVER,
			borderRadius: 6969,
			paddingVertical: 6,
			paddingHorizontal: 11,
		},

		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 8,
			foreground: true,
		} as any,
	});
	const collectionStyles = stylesheet.createThemedStyleSheet({
		card: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			borderRadius: 8,
			width: jwidth,
		},
		cardImage: {
			backgroundColor: semanticColors.CARD_SECONDARY_BG,
			borderTopLeftRadius: 8,
			borderTopRightRadius: 8,
			width: "100%",
			aspectRatio: 2.5 / 1,
		},
		cardContent: {
			paddingHorizontal: 16,
			paddingVertical: 16,
			flexDirection: "column",
			gap: 4,
		},

		smallProfile: {
			flexDirection: "row",
			gap: 16,
		},
		smallAvatar: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			width: 48,
			height: 48,
			borderRadius: 2147483647,
		},
		smallProfileThing: {
			flexDirection: "column",
			justifyContent: "center",
			gap: 4,
		},
	});

	const navigation = NavigationNative.useNavigation();
	managePage({
		title: "App Directory",
	});

	const onAppPress = (app: APICollectionItem | APICollectionApplication) => () =>
		pushScreen
			? pushScreen("APP_INFO", {
				app: "application" in app ? app.application : app,
				guildId,
			})
			: navigation.push("VendettaCustomPage", {
				title: "application" in app
					? app.application.name
					: app.name,
				render: getAppInfoPageRender(
					"application" in app ? app.application : app,
					guildId,
				),
			});

	const pushPageI = searchResults
		? Math.max(Math.min(searchPage - 3, searchResults.num_pages - 7), 0)
		: 0;
	const pushPages = searchResults
		? new Array(searchResults.num_pages)
			.fill(0)
			.map((_, i) => ({ num: i + 1, selected: i === searchPage }))
			.slice(pushPageI, pushPageI + 7)
		: [];

	const pageFirst = pushPages[0]?.num === 1;
	const pageLast = searchResults
		&& pushPages[pushPages.length - 1]?.num === searchResults.num_pages;
	const renderPushPages = pushPages.slice(
		pageFirst ? 0 : 2,
		pageLast ? pushPages.length : pushPages.length - 2,
	);

	const isFirst = searchPage === 0;
	const isLast = searchResults && searchPage === searchResults.num_pages - 1;

	return (
		<RN.ScrollView
			style={{
				flex: 1,
				paddingHorizontal: 16,
				paddingTop: 12,
			}}
		>
			<Search placeholder="Search..." onChangeText={setSearch} />
			<RN.View style={{ height: 12 }} />
			{categories
				? (
					<RN.FlatList
						horizontal
						data={[{ id: 0, name: "All" }, ...categories].sort(
							(a, b) =>
								selCategory
									? a.id === selCategory
										? -1
										: b.id === selCategory
										? 1
										: 0
									: 0,
						)}
						keyExtractor={d => d.id.toString()}
						renderItem={({ item }) => (
							<RN.Pressable
								style={[
									styles.category,
									selCategory === item.id && styles.selCategory,
								]}
								android_ripple={styles.androidRipple}
								onPress={() => {
									if (selCategory === item.id && !search) {
										setSelCategory(undefined);
									} else setSelCategory(item.id);
									RN.LayoutAnimation.configureNext(
										RN.LayoutAnimation.Presets.easeInEaseOut,
									);
								}}
							>
								<RN.Image
									style={styles.categoryIcon}
									source={getAssetIDByName(
										{
											0: "GlobeEarthIcon",
											4: "ic_monitor_24px",
											6: "GameControllerIcon",
											8: "PencilSparkleIcon",
											9: "FriendsIcon",
											10: "WrenchIcon",
										}[item.id] ?? "",
									)}
								/>
								<Text
									variant="text-md/semibold"
									color="TEXT_NORMAL"
								>
									{item.name}
								</Text>
							</RN.Pressable>
						)}
						ItemSeparatorComponent={() => <RN.View style={{ width: 8 }} />}
						style={{ paddingBottom: 16 }}
					/>
				)
				: (
					<RN.ActivityIndicator
						size="small"
						style={{ flex: 1, paddingBottom: 16 }}
					/>
				)}
			{collections && searchResults !== undefined
				? (
					searchResults
						? (
							<>
								<RN.FlatList
									data={searchResults.results}
									ItemSeparatorComponent={() => <RN.View style={{ height: 8 }} />}
									renderItem={({ item: { data: app } }) => (
										<RN.Pressable
											style={collectionStyles.card}
											android_ripple={styles.androidRipple}
											onPress={onAppPress(app)}
										>
											<RN.View
												style={collectionStyles.cardContent}
											>
												<RN.View
													style={collectionStyles.smallProfile}
												>
													<RN.Image
														style={collectionStyles.smallAvatar}
														source={{
															uri:
																`https://cdn.discordapp.com/app-icons/${app.id}/${app.icon}.webp?size=60`,
														}}
													/>
													<RN.View
														style={collectionStyles.smallProfileThing}
													>
														<Text
															variant="text-md/semibold"
															color="TEXT_NORMAL"
														>
															{app.name}
														</Text>
														{app.categories[0] && (
															<Text
																variant="text-md/medium"
																color="TEXT_MUTED"
															>
																{app.categories[0].name}
															</Text>
														)}
													</RN.View>
												</RN.View>
												<Text
													variant="text-md/medium"
													color="TEXT_MUTED"
													style={{ paddingBottom: 8 }}
												>
													{inServers(
														app.directory_entry.guild_count,
													)}
												</Text>
												<Text
													variant="text-md/semibold"
													color="TEXT_NORMAL"
													lineClamp={2}
												>
													{app.directory_entry
														.short_description}
												</Text>
											</RN.View>
										</RN.Pressable>
									)}
								/>
								<RN.View style={styles.bottomNav}>
									<RN.Pressable
										style={isFirst
											? styles.bottomNavItemOff
											: styles.bottomNavItem}
										onPress={() => {
											setSearchPage(
												Math.max(
													Math.min(
														searchPage - 1,
														searchResults.num_pages - 1,
													),
													0,
												),
											);
										}}
										disabled={isFirst}
										key={"page-back"}
									>
										<Text
											variant="text-sm/bold"
											color={isFirst ? "TEXT_MUTED" : "TEXT_NORMAL"}
										>
											&lt;
										</Text>
									</RN.Pressable>
									{!pageFirst && (
										<>
											<RN.Pressable
												style={styles.bottomNavItem}
												onPress={() => {
													setSearchPage(0);
												}}
												key={"page-1"}
											>
												<Text
													variant="text-sm/semibold"
													color="TEXT_NORMAL"
												>
													1
												</Text>
											</RN.Pressable>
											<Text
												variant="text-md/semibold"
												color="TEXT_MUTED"
												key={"page-sep-left"}
											>
												...
											</Text>
										</>
									)}
									{renderPushPages.map(x => (
										<RN.Pressable
											style={x.selected
												? styles.bottomNavItemSelected
												: styles.bottomNavItem}
											onPress={() => {
												setSearchPage(x.num - 1);
											}}
											key={`page-${x.num}`}
										>
											<Text
												variant="text-sm/semibold"
												color="TEXT_NORMAL"
											>
												{x.num}
											</Text>
										</RN.Pressable>
									))}
									{!pageLast && (
										<>
											<Text
												variant="text-md/semibold"
												color="TEXT_MUTED"
												key={"page-sep-right"}
											>
												...
											</Text>
											<RN.Pressable
												style={styles.bottomNavItem}
												onPress={() => {
													setSearchPage(
														searchResults.num_pages - 1,
													);
												}}
												key={`page-${searchResults.num_pages}`}
											>
												<Text
													variant="text-sm/semibold"
													color="TEXT_NORMAL"
												>
													{searchResults.num_pages}
												</Text>
											</RN.Pressable>
										</>
									)}
									<RN.Pressable
										style={isLast
											? styles.bottomNavItemOff
											: styles.bottomNavItem}
										onPress={() => {
											setSearchPage(
												Math.max(
													Math.min(
														searchPage + 1,
														searchResults.num_pages - 1,
													),
													0,
												),
											);
										}}
										disabled={isLast}
										key={"page-next"}
									>
										<Text
											variant="text-sm/bold"
											color={isLast ? "TEXT_MUTED" : "TEXT_NORMAL"}
										>
											&gt;
										</Text>
									</RN.Pressable>
								</RN.View>
							</>
						)
						: (
							<>
								{collections.map((x, i) => (
									<>
										<Text
											variant="text-lg/bold"
											color="TEXT_NORMAL"
											style={{
												paddingBottom: 24,
												paddingTop: i !== 0 ? 30 : 0,
											}}
										>
											{x.title}
										</Text>
										<RN.FlatList
											horizontal
											data={x.application_directory_collection_items.sort(
												(a, b) => a.position - b.position,
											)}
											ItemSeparatorComponent={() => <RN.View style={{ width: 8 }} />}
											renderItem={({ item: app }) =>
												x.type === APICollectionType.Big
													? (
														<RN.Pressable
															style={[collectionStyles.card]}
															android_ripple={styles.androidRipple}
															onPress={onAppPress(app)}
														>
															{app.image_hash && (
																<RN.Image
																	style={collectionStyles.cardImage}
																	source={{
																		uri:
																			`https://cdn.discordapp.com/app-assets/application-directory/collection-items/${app.id}/${app.image_hash}.webp?size=512`,
																	}}
																	resizeMode="cover"
																/>
															)}
															<RN.View
																style={collectionStyles.cardContent}
															>
																<Text
																	variant="text-lg/semibold"
																	color="TEXT_NORMAL"
																	style={{
																		paddingBottom: 4,
																	}}
																>
																	{app.application.name}
																</Text>
																<Text
																	variant="text-md/semibold"
																	color="TEXT_NORMAL"
																	lineClamp={2}
																>
																	{app.application
																		.directory_entry
																		.short_description}
																</Text>
															</RN.View>
														</RN.Pressable>
													)
													: x.type
															=== APICollectionType.Medium
													? (
														<RN.Pressable
															style={[
																collectionStyles.card,
																{ width: jwidth / 1.5 },
															]}
															android_ripple={styles.androidRipple}
															onPress={onAppPress(app)}
														>
															{app.image_hash && (
																<RN.Image
																	style={collectionStyles.cardImage}
																	source={{
																		uri:
																			`https://cdn.discordapp.com/app-assets/application-directory/collection-items/${app.id}/${app.image_hash}.webp?size=256`,
																	}}
																	resizeMode="cover"
																/>
															)}
															<RN.View
																style={collectionStyles.cardContent}
															>
																<Text
																	variant="text-md/semibold"
																	color="TEXT_NORMAL"
																>
																	{app.application.name}
																</Text>
																<Text
																	variant="text-md/medium"
																	color="TEXT_MUTED"
																	style={{
																		paddingBottom: 8,
																	}}
																>
																	{app.application
																		.categories[0] && (
																		<>
																			{app
																				.application
																				.categories[0]
																				.name}
																			<Text
																				variant="text-md/bold"
																				color="TEXT_MUTED"
																				style={{
																					opacity: 0.5,
																				}}
																			>
																				{"  "}·
																				{"  "}
																			</Text>
																		</>
																	)}
																	{inServers(
																		app.application
																			.directory_entry
																			.guild_count,
																	)}
																</Text>
																<Text
																	variant="text-md/semibold"
																	color="TEXT_NORMAL"
																	lineClamp={2}
																>
																	{app.application
																		.directory_entry
																		.short_description}
																</Text>
															</RN.View>
														</RN.Pressable>
													)
													: (
														<RN.Pressable
															style={[
																collectionStyles.card,
																{ width: jwidth / 1.55 },
															]}
															android_ripple={styles.androidRipple}
															onPress={onAppPress(app)}
														>
															<RN.View
																style={collectionStyles.cardContent}
															>
																<RN.View
																	style={collectionStyles.smallProfile}
																>
																	<RN.Image
																		style={collectionStyles.smallAvatar}
																		source={{
																			uri:
																				`https://cdn.discordapp.com/app-icons/${app.application.id}/${app.application.icon}.webp?size=60`,
																		}}
																	/>
																	<RN.View
																		style={collectionStyles.smallProfileThing}
																	>
																		<Text
																			variant="text-md/semibold"
																			color="TEXT_NORMAL"
																		>
																			{app
																				.application
																				.name}
																		</Text>
																		{app.application
																			.categories[0] && (
																			<Text
																				variant="text-md/medium"
																				color="TEXT_MUTED"
																			>
																				{app
																					.application
																					.categories[0]
																					.name}
																			</Text>
																		)}
																	</RN.View>
																</RN.View>
																<Text
																	variant="text-md/medium"
																	color="TEXT_MUTED"
																	style={{
																		paddingBottom: 8,
																	}}
																>
																	{inServers(
																		app.application
																			.directory_entry
																			.guild_count,
																	)}
																</Text>
																<Text
																	variant="text-md/semibold"
																	color="TEXT_NORMAL"
																	lineClamp={2}
																>
																	{app.application
																		.directory_entry
																		.short_description}
																</Text>
															</RN.View>
														</RN.Pressable>
													)}
										/>
									</>
								))}
							</>
						)
				)
				: (
					<RN.ActivityIndicator
						size="small"
						style={{ flex: 1, marginTop: 50 }}
					/>
				)}
			<RN.View style={{ height: 48 }} />
		</RN.ScrollView>
	);
}
