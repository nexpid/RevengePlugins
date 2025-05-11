import {
	clipboard,
	NavigationNative,
	React,
	ReactNative as RN,
} from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import SuperAwesomeIcon from "$/components/SuperAwesomeIcon";
import { managePage } from "$/lib/ui";

import { vstorage } from "..";
import {
	dispatchActivityIfPossible,
	isActivitySaved,
	makeEmptySettingsActivity,
	SettingsActivity,
} from "../stuff/activity";
import { proxyAssetCache } from "../stuff/api";
import { activitySavedPrompt } from "../stuff/prompts";
import { stringVariables } from "../stuff/variables";
import { openLiveRawActivityView } from "./pages/LiveRawActivityView";
import { showProfileList } from "./pages/ProfileList";
import RPCPreview from "./RPCPreview";

const { FormSwitchRow, FormIcon, FormRow } = Forms;

export const placeholders = {
	image: "https://discord.com/assets/cb1043c312ec65507573c06c37f6ee63.gif",
	appName: "Enter App Name...",
	details: "Enter Details...",
	state: "Enter State...",
	timestamp: "Enter Timestamp...",
	button1: "Edit Button 1...",
	button2: "Edit Button 2...",
};
export const activityTypePreview = {
	0: "Playing",
	2: "Listening to",
	3: "Watching",
	5: "Competing in",
};

export let forceUpdateSettings: () => void;
export default () => {
	const navigation = NavigationNative.useNavigation();
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);
	forceUpdateSettings = forceUpdate;

	useProxy(vstorage);

	React.useEffect(() => {
		vstorage.settings.display && dispatchActivityIfPossible();
	}, [JSON.stringify(vstorage.activity.editing), vstorage.settings.display]);

	managePage({
		headerRight: () => (
			<SuperAwesomeIcon
				style="header"
				icon={getAssetIDByName("SparklesIcon")}
				onPress={() => {
					showConfirmationAlert({
						title: "String Variables",
						content:
							`String variables can be used in any text component\nHere's the entire list:\n\n${
								stringVariables
									.map(x => `**\`${x.match}\`**\n — ${x.description}`)
									.join("\n")
							}`,
						confirmText: "Dismiss",
						confirmColor: "brand" as ButtonColors,
						onConfirm: () => undefined,
					});
				}}
			/>
		),
	});

	let dbgCounter = 0,
		dbgCounterTimeout: any;

	return (
		<>
			<RN.ScrollView
				style={{
					zIndex: 1,
				}}
			>
				<BetterTableRowGroup
					title="Preview"
					onTitlePress={() => {
						if (vstorage.settings.debug.enabled) {
							vstorage.settings.debug.visible = !vstorage.settings.debug.visible;
							showToast(
								`Debug tab ${
									vstorage.settings.debug.visible
										? "visible"
										: "hidden"
								}`,
							);
						} else {
							if (dbgCounterTimeout) {
								clearTimeout(dbgCounterTimeout);
							}
							dbgCounterTimeout = setTimeout(() => {
								dbgCounter = 0;
							}, 500);
							dbgCounter++;

							if (dbgCounter < 2) return;

							if (dbgCounter < 7) {
								const more = 7 - dbgCounter;
								showToast(`${more} more taps`);
								return;
							}
							showToast("Behold! You can now debug!");
							vstorage.settings.debug.visible = true;
							vstorage.settings.debug.enabled = true;
							forceUpdate();
						}
					}}
					icon={getAssetIDByName("EyeIcon")}
					padding={vstorage.settings.edit}
				>
					<RPCPreview
						edit={vstorage.settings.edit}
						act={vstorage.activity.editing}
					/>
				</BetterTableRowGroup>
				<BetterTableRowGroup
					title="Settings"
					icon={getAssetIDByName("SettingsIcon")}
				>
					<FormSwitchRow
						label="Edit Mode"
						subLabel="Be able to edit your activity"
						leading={
							<FormIcon
								source={getAssetIDByName("StaffBadgeIcon")}
							/>
						}
						onValueChange={() => (vstorage.settings.edit = !vstorage.settings.edit)}
						value={vstorage.settings.edit}
					/>
					<FormSwitchRow
						label="Display Activity"
						subLabel="Show off your super awesome poggers activity to the world"
						leading={<FormIcon source={getAssetIDByName("EyeIcon")} />}
						onValueChange={() => (vstorage.settings.display = !vstorage.settings.display)}
						value={vstorage.settings.display}
					/>
				</BetterTableRowGroup>
				<BetterTableRowGroup
					title="Data"
					icon={getAssetIDByName("FolderIcon")}
				>
					<FormRow
						label="Copy as JSON"
						leading={<FormRow.Icon source={getAssetIDByName("copy")} />}
						onPress={() => {
							clipboard.setString(
								JSON.stringify(
									vstorage.activity.editing,
									undefined,
									3,
								),
							);
							showToast(
								"Copied",
								getAssetIDByName("toast_copy_link"),
							);
						}}
					/>
					<FormRow
						label="Load from Clipboard"
						leading={
							<FormRow.Icon
								source={getAssetIDByName("DownloadIcon")}
							/>
						}
						onPress={() => {
							activitySavedPrompt({
								role: "overwrite the activity data",
								button: "Overwrite",
								run: async () => {
									let rawData: SettingsActivity;
									try {
										rawData = JSON.parse(
											await clipboard.getString(),
										);
									} catch {
										showToast(
											"Failed to parse JSON",
											getAssetIDByName(
												"CircleXIcon-primary",
											),
										);
										return;
									}

									const data = SettingsActivity.validate(rawData);
									if (!data.error) {
										showToast(
											"Invalid activity data",
											getAssetIDByName(
												"CircleXIcon-primary",
											),
										);
										return;
									}

									vstorage.activity.editing = data.value as SettingsActivity;
									vstorage.activity.profile = undefined;
									forceUpdate();
									showToast(
										"Loaded",
										getAssetIDByName(
											"CircleCheckIcon-primary",
										),
									);
								},
							});
						}}
					/>
				</BetterTableRowGroup>
				<BetterTableRowGroup nearby>
					{vstorage.activity.profile && (
						<>
							<FormRow
								label={`Save Profile${!isActivitySaved() ? " 🔴" : ""}`}
								leading={
									<FormRow.Icon
										source={getAssetIDByName("PencilIcon")}
									/>
								}
								onPress={() => {
									if (!vstorage.activity.profile) return;

									vstorage.profiles[
										vstorage.activity.profile
									] = JSON.parse(
										JSON.stringify(
											vstorage.activity.editing,
										),
									);
									showToast(
										"Saved",
										getAssetIDByName(
											"CircleCheckIcon-primary",
										),
									);
									forceUpdate();
								}}
							/>
							<FormRow
								label="Revert Profile"
								leading={
									<FormRow.Icon
										source={getAssetIDByName("PencilIcon")}
									/>
								}
								onPress={() => {
									activitySavedPrompt({
										role: "revert",
										button: "Revert",
										run: () => {
											if (!vstorage.activity.profile) {
												return;
											}

											vstorage.activity.editing = JSON.parse(
												JSON.stringify(
													vstorage.profiles[
														vstorage.activity
															.profile
													],
												),
											);
											showToast(
												"Reverted",
												getAssetIDByName(
													"CircleCheckIcon-primary",
												),
											);
											forceUpdate();
										},
									});
								}}
							/>
							<FormRow
								label="Close Profile"
								leading={
									<FormRow.Icon
										source={getAssetIDByName("PencilIcon")}
									/>
								}
								onPress={() => {
									activitySavedPrompt({
										role: "discard your changes",
										button: "Discard",
										run: () => {
											vstorage.activity.editing = makeEmptySettingsActivity();
											vstorage.activity.profile = undefined;
											showToast(
												"Closed",
												getAssetIDByName(
													"CircleCheckIcon-primary",
												),
											);
											forceUpdate();
										},
										secondaryButton: "Save profile",
										secondaryRun: () => {
											if (!vstorage.activity.profile) {
												return;
											}

											vstorage.profiles[
												vstorage.activity.profile
											] = JSON.parse(
												JSON.stringify(
													vstorage.activity.editing,
												),
											);
										},
									});
								}}
							/>
						</>
					)}
					<FormRow
						label="Browse Profiles"
						leading={
							<FormRow.Icon
								source={getAssetIDByName("PencilIcon")}
							/>
						}
						trailing={<FormRow.Arrow />}
						onPress={() => {
							showProfileList(navigation);
						}}
					/>
				</BetterTableRowGroup>
				{vstorage.settings.debug.visible && (
					<BetterTableRowGroup
						title="Debug"
						icon={getAssetIDByName("WrenchIcon")}
					>
						<FormRow
							label="Live RawActivity View"
							trailing={<FormRow.Arrow />}
							leading={
								<FormRow.Icon
									source={getAssetIDByName("StaffBadgeIcon")}
								/>
							}
							onPress={() => {
								openLiveRawActivityView(navigation);
							}}
						/>
						<FormRow
							label="Flush MP Cache"
							leading={
								<FormRow.Icon
									source={getAssetIDByName("StaffBadgeIcon")}
								/>
							}
							onPress={() => {
								let changes = 0;
								for (const x of Object.keys(proxyAssetCache)) {
									changes++;
									delete proxyAssetCache[x];
								}

								const faces = ":P,:3,:D,:-D,:>,x3,xD,:x,:^),:v".split(",");
								showToast(
									`Flushed MP cache ${
										faces[
											Math.floor(
												Math.random() * faces.length,
											)
										]
									}`,
								);
								if (changes > 0) dispatchActivityIfPossible();
							}}
						/>
					</BetterTableRowGroup>
				)}
				<RN.View style={{ marginBottom: 20 }} />
			</RN.ScrollView>
		</>
	);
};
