// =============================================================================
// CloudSync plugin — Settings.tsx — migrated for Discord 325+ / Kettu / Bunny
// =============================================================================
//
// What changed vs the original:
//   • Forms.FormRow         → TableRow
//   • Forms.FormSwitchRow   → TableSwitchRow
//   • leading={<FormRow.Icon source={X} />} → icon={<TableRow.Icon source={X} />}
//   • leading={<ActivityIndicator />}        → icon={<ActivityIndicator />}
//   • trailing={<FormRow.Arrow />}           → arrow (boolean prop)
//   • trailing={FormRow.Arrow}               → arrow (boolean prop) [also fixes
//                                              a latent bug where the original
//                                              passed the component reference
//                                              instead of a JSX element]
//   • destructive                            → variant="danger"
//
// The components are pulled via findByProps from the redesign module that
// Discord ships in 325+. Verified against Kettu's own internal pages
// (src/core/ui/settings/pages/General/Version.tsx and Developer/index.tsx)
// which use the exact same pattern.
//
// NOTE: This is only the Settings.tsx file. Other files in the cloud-sync
// plugin folder (NerdConfig.tsx, IgnoredPluginsPage.tsx, the action sheets
// in ./sheets/, and ./pages/IgnoredPluginsPage.tsx) almost certainly contain
// the same Forms.* imports and need the same treatment before the plugin
// will fully load. The crash you posted will go away after this file is
// fixed, but you may hit a new one from a sibling file until those are
// migrated too.
// =============================================================================

import { logger, plugin, settings } from "@vendetta";
import { findByProps, findByStoreName } from "@vendetta/metro";
import {
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
	url,
} from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet } from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { Lang } from "$/lang";

import { getLocale } from "$/lib/intlProxy";
import { initState, lang, vstorage } from "..";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { useCacheStore } from "../stores/CacheStore";
import {
	decompressRawData,
	deleteData,
	getData,
	getRawData,
	type RawData,
	rawDataURL,
	saveData,
} from "../stuff/api";
import { canSaveFileNatively, pickFile, saveFile } from "../stuff/files";
import { openOauth2Modal } from "../stuff/oauth2";
import { grabEverything, setImportCallback } from "../stuff/syncStuff";
import type { UserData } from "../types";
import DataStat from "./DataStat";
import NerdConfig from "./NerdConfig";
import IgnoredPluginsPage from "./pages/IgnoredPluginsPage";
import ImportActionSheet from "./sheets/ImportActionSheet";
import TooMuchDataSheet from "./sheets/TooMuchDataSheet";
import WwyltdSheet from "./sheets/WwyltdSheet";

const UserStore = findByStoreName("UserStore");

// New redesign components (replaces the old Forms.FormRow / Forms.FormSwitchRow).
// All redesign components are aggregated into one module in modern Discord
// builds, so a single findByProps call gets us both.
const { TableRow, TableSwitchRow } = findByProps("TableRow", "TableSwitchRow");

export default function() {
	useProxy(storage);
	const [, forceUpdate] = React.useReducer(x => ~x, 0);

	const [showDev, setShowDev] = React.useState(false);
	const [isBusy, setIsBusy] = React.useState<string[]>([]);
	const { data, at, hasData } = useCacheStore();
	const { isAuthorized } = useAuthorizationStore();

	const userId = UserStore.getCurrentUser()?.id ?? null;
	if (initState.didInit !== userId) {
		initState.didInit = userId;
		isAuthorized() && getData();
	}

	const navigation = NavigationNative.useNavigation();

	const setBusy = (x: string) => !isBusy.includes(x) && setIsBusy([...isBusy, x]);
	const unBusy = (x: string) => {
		setIsBusy(isBusy.filter(y => x !== y));
	};
	let lastTap = 0;

	const bumpyScaleX = Reanimated.useSharedValue(1);
	const bumpyScaleY = Reanimated.useSharedValue(1);

	const bumpyPressScale = Reanimated.useSharedValue(1);
	const bumpyPressRot = Reanimated.useSharedValue("0deg");

	const doBumpiness = () => {
		if (
			!settings.developerSettings
			|| vstorage.realTrackingAnalyticsSentToChina.pressedSettings
		) {
			return;
		}

		bumpyPressScale.value = 1.09;
		bumpyPressScale.value = Reanimated.withTiming(1, { duration: 300 });

		const actRot = Math.random() * 10 + 3;
		bumpyPressRot.value = `${Math.random() < 0.5 ? -actRot : actRot}deg`;
		bumpyPressRot.value = Reanimated.withTiming("0deg", { duration: 300 });
	};

	React.useEffect(() => {
		if (
			!settings.developerSettings
			|| vstorage.realTrackingAnalyticsSentToChina.pressedSettings
		) {
			bumpyScaleX.value = Reanimated.withTiming(1, { duration: 150 });
			bumpyScaleY.value = Reanimated.withTiming(1, { duration: 150 });
			return;
		}

		const mult = 1.08;

		bumpyScaleX.value = 1 / mult;
		bumpyScaleY.value = mult;

		bumpyScaleX.value = Reanimated.withRepeat(
			Reanimated.withTiming(mult, {
				easing: Reanimated.Easing.inOut(Reanimated.Easing.quad),
				duration: 500,
			}),
			-1,
			true,
		);
		bumpyScaleY.value = Reanimated.withRepeat(
			Reanimated.withTiming(1 / mult, {
				easing: Reanimated.Easing.inOut(Reanimated.Easing.quad),
				duration: 500,
			}),
			-1,
			true,
		);
	}, [
		settings.developerSettings,
		vstorage.realTrackingAnalyticsSentToChina.pressedSettings,
	]);

	const styles = stylesheet.createThemedStyleSheet({
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			// @ts-expect-error cornerRadius does not exist :nerd_face:
			cornerRadius: 4,
		},
		titleIcon: {
			width: 16,
			height: 16,
			marginTop: 1.5,
			tintColor: semanticColors.TEXT_MUTED,
		},
	});

	return (
		<RN.ScrollView>
			<BetterTableRowGroup
				title={lang.format("settings.your_data.title", {})}
				icon={getAssetIDByName(plugin.manifest.vendetta?.icon ?? "")}
				padding={true}
			>
				<RN.View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						marginVertical: 8,
					}}
				>
					<DataStat
						count={data ? Object.keys(data.plugins).length : "-"}
						subtitle={"settings.your_data.plugins"}
					/>
					<DataStat
						count={data ? Object.keys(data.themes).length : "-"}
						subtitle={"settings.your_data.themes"}
					/>
					<DataStat
						count={data
							? Object.keys(data.fonts.installed).length
								+ data.fonts.custom.length
							: "-"}
						subtitle={"settings.your_data.fonts"}
					/>
				</RN.View>
				{at && (
					<Text
						variant="text-sm/medium"
						color="TEXT_MUTED"
						align="center"
					>
						{Lang.basicFormat(
							lang.format("settings.your_data.last_synced", {
								date: new Date(at).toLocaleString(getLocale(), {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "numeric",
									minute: "numeric",
									second: "numeric",
								}),
							}),
						)}
					</Text>
				)}
			</BetterTableRowGroup>
			<BetterTableRowGroup
				title={
					<RN.Pressable
						android_ripple={styles.androidRipple}
						disabled={false}
						accessibilityRole={"button"}
						onPress={settings.developerSettings
							? () => {
								if (
									!vstorage
										.realTrackingAnalyticsSentToChina
										.pressedSettings
								) {
									doBumpiness();
								}

								if (lastTap >= Date.now()) {
									vstorage.realTrackingAnalyticsSentToChina.pressedSettings = true;
									setShowDev(!showDev);
									lastTap = 0;
								} else lastTap = Date.now() + 500;
							}
							: undefined}
						style={{ width: "100%", marginBottom: 8 }}
					>
						<Reanimated.default.View
							style={[
								{
									gap: 4,
									flexDirection: "row",
									alignItems: "center",
									alignSelf: "flex-start",
								},
								{
									transform: [
										{ scaleX: bumpyScaleX },
										{ scaleY: bumpyScaleY },
										{ scale: bumpyPressScale },
										{ rotate: bumpyPressRot },
									],
								},
							]}
						>
							<RN.Image
								style={styles.titleIcon}
								source={getAssetIDByName("SettingsIcon")}
								resizeMode="cover"
							/>
							<Text variant="text-sm/semibold" color="TEXT_MUTED">
								{lang.format("settings.config.title", {})}
							</Text>
						</Reanimated.default.View>
					</RN.Pressable>
				}
				icon={getAssetIDByName("SettingsIcon")}
			>
				<TableSwitchRow
					label={lang.format("settings.config.auto_save.title", {})}
					subLabel={vstorage.realTrackingAnalyticsSentToChina
							.tooMuchData
						? (
							<Text color="TEXT_FEEDBACK_CRITICAL" variant="text-sm/bold">
								{lang.format(
									"settings.config.auto_save.description.error",
									{},
								)}
							</Text>
						)
						: (
							lang.format(
								"settings.config.auto_save.description",
								{},
							)
						)}
					icon={
						<TableRow.Icon
							source={getAssetIDByName("RefreshIcon")}
						/>
					}
					onValueChange={() => {
						vstorage.realTrackingAnalyticsSentToChina.tooMuchData = false;
						vstorage.config.autoSync = !vstorage.config.autoSync;
						// TODO don't use forceUpdate here
						forceUpdate();
					}}
					value={vstorage.config.autoSync}
				/>
				<TableSwitchRow
					label={lang.format(
						"settings.config.settings_pin.title",
						{},
					)}
					subLabel={lang.format(
						"settings.config.settings_pin.description",
						{},
					)}
					icon={<TableRow.Icon source={getAssetIDByName("PinIcon")} />}
					onValueChange={() => (vstorage.config.addToSettings = !vstorage.config
						.addToSettings)}
					value={vstorage.config.addToSettings}
				/>
				<TableRow
					label={lang.format("page.ignored_plugins.title", {
						count: vstorage.config.ignoredPlugins.length.toString(),
					})}
					icon={
						<TableRow.Icon
							source={getAssetIDByName("ListBulletsIcon")}
						/>
					}
					arrow
					onPress={() =>
						navigation.push("VendettaCustomPage", {
							render: IgnoredPluginsPage,
						})}
				/>
			</BetterTableRowGroup>
			{showDev && <NerdConfig />}
			<BetterTableRowGroup
				title={lang.format("settings.auth.title", {})}
				icon={getAssetIDByName("LockIcon")}
			>
				{isAuthorized()
					? (
						<>
							<TableRow
								label={lang.format(
									"settings.auth.log_out.title",
									{},
								)}
								subLabel={lang.format(
									"settings.auth.log_out.description",
									{},
								)}
								icon={
									<TableRow.Icon
										source={getAssetIDByName("DoorExitIcon")}
									/>
								}
								variant="danger"
								onPress={() =>
									!isBusy.length
									&& showConfirmationAlert({
										title: lang.format(
											"alert.log_out.title",
											{},
										),
										content: lang.format(
											"alert.log_out.body",
											{},
										),
										onConfirm: () => {
											useCacheStore.getState().updateData();
											useAuthorizationStore
												.getState()
												.setToken(undefined);
											vstorage.realTrackingAnalyticsSentToChina.tooMuchData = false;

											showToast(
												lang.format("toast.logout", {}),
												getAssetIDByName("DoorExitIcon"),
											);
										},
									})}
							/>
							<TableRow
								label={lang.format(
									"settings.auth.delete_data.title",
									{},
								)}
								subLabel={lang.format(
									"settings.auth.delete_data.description",
									{},
								)}
								icon={isBusy.includes("delete_data")
									? <RN.ActivityIndicator size="small" />
									: (
										<TableRow.Icon
											source={getAssetIDByName("TrashIcon")}
										/>
									)}
								onPress={() =>
									!isBusy.length
									&& showConfirmationAlert({
										title: lang.format(
											"alert.delete_data.title",
											{},
										),
										content: lang.format(
											"alert.delete_data.body",
											{},
										),
										confirmText: lang.format(
											"alert.delete_data.confirm",
											{},
										),
										confirmColor: "red" as ButtonColors,
										onConfirm: async () => {
											setBusy("delete_data");
											await deleteData();
											useAuthorizationStore
												.getState()
												.setToken(undefined);

											unBusy("delete_data");
											showToast(
												lang.format(
													"toast.deleted_data",
													{},
												),
												getAssetIDByName("TrashIcon"),
											);
										},
									})}
							/>
						</>
					)
					: (
						<TableRow
							label={lang.format("settings.auth.authorize", {})}
							icon={
								<TableRow.Icon
									source={getAssetIDByName("LinkIcon")}
								/>
							}
							arrow
							onPress={openOauth2Modal}
						/>
					)}
			</BetterTableRowGroup>
			<BetterTableRowGroup
				title={lang.format("settings.manage_data.title", {})}
				icon={getAssetIDByName("UserIcon")}
				padding={!isAuthorized() || !hasData()}
			>
				{isAuthorized() && hasData()
					? (
						<>
							<TableRow
								label={lang.format(
									"settings.manage_data.save_data.title",
									{},
								)}
								subLabel={lang.format(
									"settings.manage_data.save_data.description",
									{},
								)}
								icon={isBusy.includes("save_api")
									? <RN.ActivityIndicator size="small" />
									: (
										<TableRow.Icon
											source={getAssetIDByName("UploadIcon")}
										/>
									)}
								onPress={() => {
									if (isBusy.length) return;

									if (
										vstorage.realTrackingAnalyticsSentToChina
											.tooMuchData
									) {
										return ActionSheet.open(TooMuchDataSheet, {
											navigation,
										});
									}

									showConfirmationAlert({
										title: lang.format(
											"alert.save_data.title",
											{},
										),
										content: lang.format(
											"alert.save_data.body",
											{},
										),
										confirmText: lang.format(
											"alert.save_data.confirm",
											{},
										),
										onConfirm: async () => {
											setBusy("save_api");
											try {
												const everything = await grabEverything();
												await saveData(everything);

												showToast(
													lang.format(
														"toast.saved_data",
														{},
													),
													getAssetIDByName(
														"CircleCheckIcon-primary",
													),
												);
											} catch (e: any) {
												if (
													e?.message
														?.toLowerCase()
														.includes(
															"request entity too large",
														)
												) {
													ActionSheet.open(
														TooMuchDataSheet,
														{
															navigation,
														},
													);
												}
											}

											unBusy("save_api");
										},
									});
								}}
							/>
							<TableRow
								label={lang.format("sheet.import_data.title", {})}
								subLabel={lang.format(
									"settings.manage_data.import_data.description",
									{},
								)}
								icon={isBusy.includes("import_api")
									? <RN.ActivityIndicator size="small" />
									: (
										<TableRow.Icon
											source={getAssetIDByName(
												"DownloadIcon",
											)}
										/>
									)}
								onPress={() => {
									if (isBusy.length) return;

									ActionSheet.open(ImportActionSheet, {
										navigation,
									});
									setImportCallback(x =>
										x
											? setBusy("import_api")
											: unBusy("import_api")
									);
								}}
							/>
						</>
					)
					: !isAuthorized()
					? (
						<Text
							variant="text-md/semibold"
							color="TEXT_DEFAULT"
							align="center"
						>
							{lang.format("settings.label.auth_needed", {})}
						</Text>
					)
					: <RN.ActivityIndicator size="small" style={{ flex: 1 }} />}
			</BetterTableRowGroup>
			{isAuthorized() && hasData() && (
				<BetterTableRowGroup nearby>
					<TableRow
						label={lang.format(
							"settings.manage_data.download_compressed.title",
							{},
						)}
						subLabel={lang.format(
							"settings.manage_data.download_compressed.description",
							{},
						)}
						icon={isBusy.includes("download_compressed")
							? <RN.ActivityIndicator size="small" />
							: (
								<TableRow.Icon
									source={getAssetIDByName("DownloadIcon")}
								/>
							)}
						onPress={async () => {
							if (isBusy.length) return;

							if (!canSaveFileNatively()) return url.openURL(rawDataURL());

							setBusy("download_compressed");
							let data: RawData;
							try {
								data = await getRawData();
							} catch {
								unBusy("download_compressed");
								return;
							}

							const saved = await saveFile(data.file, data.data).catch(console.error);
							unBusy("download_compressed");
							if (!saved || saved.error) {
								return (showToast(
									lang.format("toast.backup_not_saved", {}),
									getAssetIDByName("CircleXIcon-primary"),
								),
									// biome-ignore lint/complexity/useOptionalChain: it needs to be here tbf
									logger.error("backup not saved", saved && saved.error));
							}

							showToast(
								lang.format("toast.backup_saved", {
									file: saved.name ?? "",
								}),
								getAssetIDByName("FileIcon"),
							);
						}}
					/>
					<TableRow
						label={lang.format(
							"settings.manage_data.import_compressed.title",
							{},
						)}
						subLabel={lang.format(
							"settings.manage_data.import_compressed.description",
							{},
						)}
						icon={isBusy.includes("import_compressed")
							? <RN.ActivityIndicator size="small" />
							: (
								<TableRow.Icon
									source={getAssetIDByName("UploadIcon")}
								/>
							)}
						onPress={async () => {
							if (isBusy.length) return;
							setBusy("import_compressed");

							const text = await pickFile().catch(e => new Error(e));
							if (!text || text instanceof Error) {
								return (unBusy("import_compressed"),
									showToast(
										lang.format("toast.failed_file_open", {}),
										getAssetIDByName("CircleXIcon-primary"),
									),
									logger.error(text));
							}

							let backup: UserData;
							try {
								backup = await decompressRawData(text);
							} catch {
								unBusy("import_compressed");
								return;
							}

							ActionSheet.open(WwyltdSheet, {
								backup,
								navigation,
							});
							unBusy("import_compressed");
							setImportCallback(val =>
								val
									? setBusy("import_compressed")
									: unBusy("import_compressed")
							);
						}}
					/>
				</BetterTableRowGroup>
			)}
			<RN.View style={{ height: 12 }} />
		</RN.ScrollView>
	);
}
