import { findByName, findByStoreName } from "@vendetta/metro";
import {
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
} from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { Button } from "@vendetta/ui/components";

import { ActionSheet } from "$/components/ActionSheet";
import Text from "$/components/Text";

import {
	ActivityType,
	type SettingsActivity,
	settingsActivityToRaw,
} from "../stuff/activity";
import {
	ActivityTypeActionSheet,
	ApplicationActionSheet,
	ButtonActionSheet,
	ImageActionSheet,
	simpleInput,
	TimestampActionSheet,
} from "../stuff/prompts";
import { displayImage, parseTimestamp, stringifyTimeDiff } from "../stuff/util";
import { activityTypePreview, forceUpdateSettings, placeholders } from "./Settings";

const UserStore = findByStoreName("UserStore");

const UserActivityContainer = findByName("UserActivityContainer");

const styles = stylesheet.createThemedStyleSheet({
	actTypeCont: {
		flexDirection: "row",
		marginBottom: 12,
		justifyContent: "space-between",
	},
	card: {
		borderWidth: 1,
		borderRadius: 8,
		borderColor: semanticColors.BACKGROUND_MODIFIER_ACCENT,
	},
	card2: { alignItems: "flex-start", flexDirection: "row" },
	images: { position: "relative", marginRight: 10 },
	smallImageBg: {
		borderColor: semanticColors.BACKGROUND_PRIMARY,
		backgroundColor: semanticColors.BACKGROUND_PRIMARY,
		borderWidth: 1,
		borderRadius: 18,
		position: "absolute",
		right: -4,
		bottom: -4,
	},
});

export let forceUpdateRPCPreview: () => void;

export default ({ edit, act }: { edit: boolean; act: SettingsActivity }) => {
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);
	forceUpdateRPCPreview = forceUpdate;

	const navigation = NavigationNative.useNavigation();
	const update = () => {
		forceUpdate();
		forceUpdateSettings();
	};

	if (edit) {
		return (
			<>
				<RN.View style={styles.actTypeCont}>
					<Text
						variant="eyebrow"
						color="TEXT_NORMAL"
						onPress={() => {
							ActionSheet.open(ActivityTypeActionSheet, {
								type: act.type ?? ActivityType.Playing,
								update: x => {
									act.type = x;
									update();
								},
							});
						}}
					>
						{activityTypePreview[act.type ?? ActivityType.Playing]} ...
					</Text>
				</RN.View>
				<RN.View style={styles.card}>
					<RN.View style={{ padding: 16 }}>
						<RN.View style={styles.card2}>
							<RN.View style={styles.images}>
								<RN.Pressable
									onPress={() => {
										ActionSheet.open(ImageActionSheet, {
											appId: act.app.id,
											role: "Large",
											image: act.assets.largeImg,
											navigation,
											update: x => {
												act.assets.largeImg = x;
												update();
											},
										});
									}}
								>
									<RN.Image
										source={{
											uri: displayImage(
												act.assets.largeImg ?? ".",
												act.app.id,
											) ?? placeholders.image,
										}}
										style={{
											borderRadius: 3,
											width: 56,
											height: 56,
										}}
									/>
								</RN.Pressable>
								<RN.View style={styles.smallImageBg}>
									<RN.Pressable
										onPress={() => {
											ActionSheet.open(ImageActionSheet, {
												appId: act.app.id,
												role: "Small",
												image: act.assets.smallImg,
												navigation,
												update: x => {
													act.assets.smallImg = x;
													update();
												},
											});
										}}
									>
										<RN.Image
											source={{
												uri: displayImage(
													act.assets.smallImg
														?? ".",
													act.app.id,
												) ?? placeholders.image,
											}}
											style={{
												borderRadius: 14,
												width: 28,
												height: 28,
											}}
										/>
									</RN.Pressable>
								</RN.View>
							</RN.View>
							<RN.View style={{ flex: 1 }}>
								<Text
									variant="text-md/semibold"
									color="TEXT_NORMAL"
									onPress={() => {
										ActionSheet.open(
											ApplicationActionSheet,
											{
												appId: act.app.id,
												appName: act.app.name,
												navigation,
												update: x => {
													if (x?.id !== act.app.id) {
														if (
															!Number.isNaN(
																Number(
																	act.assets
																		.smallImg,
																),
															)
														) {
															act.assets.smallImg = undefined;
														}
														if (
															!Number.isNaN(
																Number(
																	act.assets
																		.largeImg,
																),
															)
														) {
															act.assets.largeImg = undefined;
														}
													}

													act.app.id = x?.id;
													act.app.name = x?.name;
													update();
												},
											},
										);
									}}
								>
									{act.app.name ?? placeholders.appName}
								</Text>
								<Text
									variant="text-sm/normal"
									color="TEXT_NORMAL"
									onPress={() => {
										simpleInput({
											role: "Details",
											current: act.details,
											update: x => {
												act.details = x;
												update();
											},
										});
									}}
								>
									{act.details ?? placeholders.details}
								</Text>
								<Text
									variant="text-sm/normal"
									color="TEXT_NORMAL"
									onPress={() => {
										simpleInput({
											role: "State",
											current: act.state,
											update: x => {
												act.state = x;
												update();
											},
										});
									}}
								>
									{act.state ?? placeholders.state}
								</Text>
								<Text
									variant="text-sm/normal"
									color="TEXT_NORMAL"
									onPress={() => {
										ActionSheet.open(TimestampActionSheet, {
											start: act.timestamps.start,
											end: act.timestamps.end,
											update: x => {
												act.timestamps.start = x.start;
												act.timestamps.end = x.end;
												update();
											},
										});
									}}
									liveUpdate={true}
									getChildren={() =>
										typeof act.timestamps.end === "string"
											? `{${act.timestamps.end}}`
											: typeof act.timestamps.end
													=== "number"
											? `${
												stringifyTimeDiff(
													parseTimestamp(
														act.timestamps.end,
													) - Date.now(),
												)
											} left`
											: typeof act.timestamps.start
													=== "string"
											? `{${act.timestamps.start}}`
											: typeof act.timestamps
													.start === "number"
											? `${
												stringifyTimeDiff(
													Date.now()
														- parseTimestamp(
															act.timestamps
																.start,
														),
												)
											} elapsed`
											: placeholders.timestamp}
								/>
							</RN.View>
						</RN.View>
						<RN.View style={{ marginTop: 16 }}>
							<Button
								text={act.buttons[0]?.text ?? placeholders.button1}
								style={{ backgroundColor: "grey" }}
								size={"small"}
								onPress={() => {
									ActionSheet.open(ButtonActionSheet, {
										role: "1",
										text: act.buttons[0]?.text,
										url: act.buttons[0]?.url,
										update: data => {
											if (!data) act.buttons.splice(0, 1);
											else act.buttons[0] = data;

											update();
										},
									});
								}}
							/>
						</RN.View>
						<RN.View style={{ marginTop: 10 }}>
							<Button
								text={act.buttons[1]?.text ?? placeholders.button2}
								style={{ backgroundColor: "grey" }}
								size={"small"}
								onPress={() => {
									ActionSheet.open(ButtonActionSheet, {
										role: "2",
										text: act.buttons[1]?.text,
										url: act.buttons[1]?.url,
										update: data => {
											if (!data) act.buttons.splice(1, 1);
											else act.buttons[1] = data;

											update();
										},
									});
								}}
							/>
						</RN.View>
					</RN.View>
				</RN.View>
			</>
		);
	}

	return (
		<UserActivityContainer
			user={UserStore.getCurrentUser()}
			activity={settingsActivityToRaw(act).activity}
		/>
	);
};
