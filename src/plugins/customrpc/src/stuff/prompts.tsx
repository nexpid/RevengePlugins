import { constants, logger } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert, showInputAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet, hideActionSheet, openLazy } from "$/components/ActionSheet";
import { RichText } from "$/components/RichText";
import Text from "$/components/Text";

import { vstorage } from "..";
import { showApplicationList } from "../components/pages/ApplicationList";
import { showRichAssetList } from "../components/pages/RichAssetList";
import { activityTypePreview } from "../components/Settings";
import { ActivityType, isActivitySaved } from "./activity";
import { getExternalAsset } from "./api";
import { unparseTimestamp } from "./util";
import { imageVariables, timestampVariables } from "./variables";

const { FormRow, FormRadioRow } = Forms;

const DatePicker = findByProps("DatePickerModes");

const SheetFooter = () => <RN.View style={{ marginBottom: 16 }} />;

const styles = stylesheet.createThemedStyleSheet({
	destructiveIcon: {
		tintColor: semanticColors.TEXT_DANGER,
	},
});
const destructiveText: Parameters<typeof Text>[0] = {
	color: "TEXT_DANGER",
	variant: "text-md/semibold",
};

export function ImageVariableActionSheet({
	role,
	update,
}: {
	role: string;
	update: (v: string) => void;
}) {
	return (
		<ActionSheet title={`${role} Image Variable`}>
			{imageVariables.map(x => (
				<FormRow
					label={x.title}
					subLabel={x.description}
					trailing={<FormRow.Arrow />}
					onPress={() => {
						update(x.format);
						hideActionSheet();
					}}
				/>
			))}
		</ActionSheet>
	);
}

export let richAssetListCallback: ((prop: string) => void) | undefined = undefined;
export let richAssetListAppId: string;
export function ImageActionSheet({
	appId,
	role,
	image,
	navigation,
	update,
}: {
	appId?: string;
	role: string;
	image: string | undefined;
	navigation: any;
	update: (img: string | undefined) => void;
}) {
	return (
		<ActionSheet title={`Edit ${role} Image`}>
			<FormRow
				label="Set Image Variable"
				leading={<FormRow.Icon source={getAssetIDByName("SparklesIcon")} />}
				trailing={<FormRow.Arrow />}
				onPress={() => {
					ActionSheet.open(ImageVariableActionSheet, {
						role,
						update: v => {
							update(v);
						},
					});
				}}
			/>
			<FormRow
				label="Use Custom Image"
				subLabel="Make sure your image is in a square aspect ratio"
				leading={<FormRow.Icon source={getAssetIDByName("LinkIcon")} />}
				onPress={() => {
					showInputAlert({
						title: "Enter the link to your image link",
						placeholder: "can be a discord attachment CDN link",
						confirmText: "Proxy",
						confirmColor: "brand" as ButtonColors,
						onConfirm: async d => {
							const url = d.match(constants.HTTP_REGEX_MULTI)?.[0];
							if (!url) {
								showToast(
									"Invalid URL",
									getAssetIDByName("CircleXIcon-primary"),
								);
								return;
							}
							showToast(
								"Proxying image...",
								getAssetIDByName("ClockIcon"),
							);
							try {
								update(`mp:${await getExternalAsset(url)}`);
								showToast(
									"Proxied image",
									getAssetIDByName("CircleCheckIcon-primary"),
								);
							} catch (e) {
								const err = e instanceof Error
									? e
									: new Error(String(e));

								logger.error(
									`ImageActionSheet->customImg proxy error!\n${err.stack}`,
								);
								showToast(
									"Failed to proxy image",
									getAssetIDByName("CircleXIcon-primary"),
								);
							}
						},
						cancelText: "Cancel",
					});
				}}
			/>
			<FormRow
				label="Select RPC Asset"
				leading={<FormRow.Icon source={getAssetIDByName("ImageIcon")} />}
				trailing={<FormRow.Arrow />}
				onPress={() => {
					if (!appId) {
						showConfirmationAlert({
							title: "No App Set",
							content: "An app must be selected in order to use RPC assets",
							confirmText: "Dismiss",
							confirmColor: "grey" as ButtonColors,
							onConfirm: () => {},
						});
						return;
					}

					richAssetListAppId = appId;
					richAssetListCallback = x => {
						richAssetListCallback = undefined;
						update(x);
					};
					showRichAssetList(navigation);
					hideActionSheet();
				}}
			/>
			{image && (
				<FormRow
					label={<Text {...destructiveText}>Remove Image</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update(undefined);
						hideActionSheet();
					}}
				/>
			)}
		</ActionSheet>
	);
}

export function ButtonActionSheet({
	role,
	text,
	url,
	update,
}: {
	role: string;
	text: string | undefined;
	url: string | undefined;
	update: (
		props: {
			text: string;
			url: string | undefined;
		} | null,
	) => void;
}) {
	return (
		<ActionSheet title={`Edit Button ${role}`}>
			<FormRow
				label="Button Text"
				leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				onPress={() => {
					simpleInput({
						role: `Button ${role} Text`,
						current: text,
						update: x => {
							update({ text: x, url });
						},
					});
				}}
			/>
			<FormRow
				label="Button URL"
				leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				onPress={() => {
					simpleInput({
						role: `Button ${role} URL`,
						current: url,
						update: x => {
							update({ text: text ?? "", url: x });
						},
					});
				}}
			/>
			{url && (
				<FormRow
					label={<Text {...destructiveText}>Remove Button URL</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update({ text: text ?? "", url: undefined });
						hideActionSheet();
					}}
				/>
			)}
			{text && (
				<FormRow
					label={<Text {...destructiveText}>Remove Button</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update(null);
						hideActionSheet();
					}}
				/>
			)}
		</ActionSheet>
	);
}

export let applicationListCallback:
	| ((props: { id?: string; name?: string }) => void)
	| undefined;
export function ApplicationActionSheet({
	appId,
	appName,
	navigation,
	update,
}: {
	appId: string | undefined;
	appName: string | undefined;
	navigation: any;
	update: (
		props: { id: string | undefined; name: string | undefined } | undefined,
	) => void;
}) {
	return (
		<ActionSheet title={"Edit Application"}>
			<FormRow
				label="Application Name"
				leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				onPress={() => {
					simpleInput({
						role: "Application Name",
						current: appName,
						update: txt => {
							update({ id: appId, name: txt });
						},
					});
				}}
			/>
			<FormRow
				label="Select Application"
				leading={<FormRow.Icon source={getAssetIDByName("RobotIcon")} />}
				trailing={<FormRow.Arrow />}
				onPress={() => {
					applicationListCallback = props => {
						applicationListCallback = undefined;
						update({
							id: props.id ?? appId,
							name: props.name ?? appName,
						});
					};
					showApplicationList(navigation);
					hideActionSheet();
				}}
			/>
			{appId && (
				<FormRow
					label={<Text {...destructiveText}>Remove Application</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update(undefined);
						hideActionSheet();
					}}
				/>
			)}
		</ActionSheet>
	);
}

export function ActivityTypeActionSheet({
	type,
	update,
}: {
	type: ActivityType;
	update: (type: ActivityType) => void;
}) {
	const [val, setVal] = React.useState(type);
	return (
		<ActionSheet title="Edit Activity Type">
			{...Object.values(ActivityType)
				.filter(x => typeof x === "number")
				.map((x: any) => (
					<FormRadioRow
						label={activityTypePreview[x]}
						trailing={<FormRow.Arrow />}
						selected={x === val}
						onPress={() => {
							update(x);
							setVal(x);
						}}
					/>
				))}
		</ActionSheet>
	);
}

export function TimestampVariableActionSheet({
	role,
	update,
}: {
	role: string;
	update: (v: string) => void;
}) {
	return (
		<ActionSheet title={`Set ${role} Time Variable`}>
			{timestampVariables.map(x => (
				<FormRow
					label={x.title}
					subLabel={x.description}
					trailing={<FormRow.Arrow />}
					onPress={() => {
						update(x.format);
						hideActionSheet();
					}}
				/>
			))}
			<SheetFooter />
		</ActionSheet>
	);
}
export function TimestampActionSheet({
	start,
	end,
	update,
}: {
	start: string | number | undefined;
	end: string | number | undefined;
	update: (props: {
		start: string | number | undefined;
		end: string | number | undefined;
	}) => void;
}) {
	const prompt = ({
		role,
		onSubmit,
	}: {
		role: string;
		onSubmit: (time: number) => void;
	}) => {
		const sOD = new Date().setHours(0, 0, 0, 0);
		const eOD = new Date().setHours(23, 59, 59, 999);

		openLazy(Promise.resolve(DatePicker), "DatePicker", {
			onSubmit: (x: any) => {
				onSubmit(unparseTimestamp(x._d.getTime()));
			},
			title: `Timestamp ${role} Time`,
			startDate: new Date(),
			minimumDate: new Date(sOD),
			maximumDate: new Date(eOD),
			requireDateChanged: false,
			mode: "time",
		});
	};

	return (
		<ActionSheet title="Edit Timestamp">
			<FormRow
				label="Set Start Time Variable"
				leading={<FormRow.Icon source={getAssetIDByName("SparklesIcon")} />}
				trailing={<FormRow.Arrow />}
				onPress={() => {
					ActionSheet.open(TimestampVariableActionSheet, {
						role: "Start",
						update: v => {
							update({ start: v, end });
						},
					});
				}}
			/>
			{typeof start !== "string" && (
				<FormRow
					label="Edit Start Time"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					trailing={<FormRow.Arrow />}
					onPress={() => {
						prompt({
							role: "Start",
							onSubmit: v => {
								update({ start: v, end });
							},
						});
					}}
				/>
			)}
			{start !== undefined && (
				<FormRow
					label={<Text {...destructiveText}>Remove Start Time</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update({ start: undefined, end });
						hideActionSheet();
					}}
				/>
			)}
			<FormRow
				label="Set End Time Variable"
				leading={<FormRow.Icon source={getAssetIDByName("SparklesIcon")} />}
				trailing={<FormRow.Arrow />}
				onPress={() => {
					ActionSheet.open(TimestampVariableActionSheet, {
						role: "End",
						update: v => {
							update({ start, end: v });
						},
					});
				}}
			/>
			{typeof end !== "string" && (
				<FormRow
					label="Edit End Time"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					onPress={() => {
						prompt({
							role: "End",
							onSubmit: v => {
								update({ start, end: v });
							},
						});
					}}
				/>
			)}
			{end !== undefined && (
				<FormRow
					label={<Text {...destructiveText}>Remove End Time</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("trash")}
						/>
					}
					onPress={() => {
						update({ start, end: undefined });
						hideActionSheet();
					}}
				/>
			)}
		</ActionSheet>
	);
}

export const activitySavedPrompt = ({
	role,
	button,
	secondaryButton,
	run,
	secondaryRun,
}: {
	role: string;
	button: string;
	secondaryButton?: string;
	run: () => void;
	secondaryRun?: () => void;
}) => {
	if (isActivitySaved()) {
		run();
		return;
	}
	showConfirmationAlert({
		title: "Unsaved Changes",
		content: [
			"You have unsaved changes in ",
			<RichText.Bold>{vstorage.activity.profile}</RichText.Bold>,
			`. Are you sure you want to ${role}?`,
		],
		confirmText: button,
		confirmColor: "red" as ButtonColors,
		onConfirm: run,
		secondaryConfirmText: secondaryButton,
		onConfirmSecondary: () => {
			secondaryRun?.();
			run();
		},
		cancelText: "Cancel",
	});
};

export const simpleInput = ({
	role,
	current,
	update,
}: {
	role: string;
	current: string | undefined;
	update: (txt: string) => void;
}) => {
	showInputAlert({
		title: `Enter New ${role}`,
		initialValue: current,
		placeholder: `really cool ${role.toLowerCase()}`,
		confirmText: "Change",
		confirmColor: "brand" as ButtonColors,
		onConfirm: update,
		cancelText: "Cancel",
	});
};
