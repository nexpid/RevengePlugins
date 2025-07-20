import { logger, plugin, settings } from "@vendetta";
import { findByStoreName } from "@vendetta/metro";
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
import { Forms } from "@vendetta/ui/components";
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

const { FormRow, FormSwitchRow } = Forms;

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
				<FormSwitchRow
					label={lang.format("settings.config.auto_save.title", {})}
					subLabel={vstorage.realTrackingAnalyticsSentToChina
							.tooMuchData
						? (
							<Text color="TEXT_DANGER" variant="text-sm/bold">
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
					leading={
						<FormRow.Icon
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
				<FormSwitchRow
					label={lang.format(
						"settings.config.settings_pin.title",
						{},
					)}
					subLabel={lang.format(
						"settings.config.settings_pin.description",
						{},
					)}
					leading={<FormRow.Icon source={getAssetIDByName("PinIcon")} />}
					onValueChange={() => (vstorage.config.addToSettings = !vstorage.config
						.addToSettings)}
					value={vstorage.config.addToSettings}
				/>
				<FormRow
					label={lang.format("page.ignored_plugins.title", {
						count: vstorage.config.ignoredPlugins.length.toString(),
					})}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("ListBulletsIcon")}
						/>
					}
					trailing={<FormRow.Arrow />}
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
							<FormRow
								label={lang.format(
									"settings.auth.log_out.title",
									{},
								)}
								subLabel={lang.format(
									"settings.auth.log_out.description",
									{},
								)}
								leading={
									<FormRow.Icon
										source={getAssetIDByName("DoorExitIcon")}
									/>
								}
								destructive
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
							<FormRow
								label={lang.format(
									"settings.auth.delete_data.title",
									{},
								)}
								subLabel={lang.format(
									"settings.auth.delete_data.description",
									{},
								)}
								leading={isBusy.includes("delete_data")
									? <RN.ActivityIndicator size="small" />
									: (
										<FormRow.Icon
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
						<FormRow
							label={lang.format("settings.auth.authorize", {})}
							leading={
								<FormRow.Icon
									source={getAssetIDByName("LinkIcon")}
								/>
							}
							trailing={FormRow.Arrow}
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
							<FormRow
								label={lang.format(
									"settings.manage_data.save_data.title",
									{},
								)}
								subLabel={lang.format(
									"settings.manage_data.save_data.description",
									{},
								)}
								leading={isBusy.includes("save_api")
									? <RN.ActivityIndicator size="small" />
									: (
										<FormRow.Icon
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
							<FormRow
								label={lang.format("sheet.import_data.title", {})}
								subLabel={lang.format(
									"settings.manage_data.import_data.description",
									{},
								)}
								leading={isBusy.includes("import_api")
									? <RN.ActivityIndicator size="small" />
									: (
										<FormRow.Icon
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
							color="TEXT_NORMAL"
							align="center"
						>
							{lang.format("settings.label.auth_needed", {})}
						</Text>
					)
					: <RN.ActivityIndicator size="small" style={{ flex: 1 }} />}
			</BetterTableRowGroup>
			{isAuthorized() && hasData() && (
				<BetterTableRowGroup nearby>
					<FormRow
						label={lang.format(
							"settings.manage_data.download_compressed.title",
							{},
						)}
						subLabel={lang.format(
							"settings.manage_data.download_compressed.description",
							{},
						)}
						leading={isBusy.includes("download_compressed")
							? <RN.ActivityIndicator size="small" />
							: (
								<FormRow.Icon
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
					<FormRow
						label={lang.format(
							"settings.manage_data.import_compressed.title",
							{},
						)}
						subLabel={lang.format(
							"settings.manage_data.import_compressed.description",
							{},
						)}
						leading={isBusy.includes("import_compressed")
							? <RN.ActivityIndicator size="small" />
							: (
								<FormRow.Icon
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
