import { React, ReactNative as RN, stylesheet, url } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet, hideActionSheet } from "$/components/ActionSheet";
import Text from "$/components/Text";
import usePromise from "$/hooks/usePromise";
import { Button } from "$/lib/redesign";

import { newGameSuggestionURL, vstorage } from "../..";
import { purgeFiles } from "../../stuff/files";
import { getManifest } from "../../stuff/store";

const { FormRow, FormRadioRow } = Forms;

const styles = stylesheet.createThemedStyleSheet({
	wompwomp: {
		flexDirection: "column",
		gap: 8,
	},
	destructiveIcon: {
		tintColor: semanticColors.TEXT_DANGER,
	},
});

const destructiveText: Parameters<typeof Text>[0] = {
	color: "TEXT_DANGER",
	variant: "text-md/semibold",
};

export default function SettingsActionSheet({
	kaboom,
}: {
	kaboom: () => void;
}) {
	const [changes, setChanges] = React.useState(vstorage.settings);

	// my vstorage thingy can't really compare like this so i have to do this workaround
	const hasChanges = React.useMemo(
		() => ["game"].some(x => changes[x] !== vstorage.settings[x]),
		[changes],
	);

	const manifestP = usePromise(signal => getManifest(signal));
	if (!manifestP.fulfilled) {
		return <RN.ActivityIndicator size={"large"} style={{ flex: 1 }} />;
	}

	const manifest = manifestP.success && manifestP.response;
	if (!manifest) {
		return (
			<ActionSheet title={"Settings"}>
				<Text
					variant="text-lg/semibold"
					color="TEXT_DANGER"
					style={styles.wompwomp}
				>
					Manifest failed to load.
				</Text>
			</ActionSheet>
		);
	}

	return (
		<ActionSheet title={"Settings"}>
			<FormRow
				label="Game"
				subLabel="What game the DOOM plugin loads"
				leading={<FormRow.Icon source={getAssetIDByName("HubIcon")} />}
			/>
			{manifest.games.map(({ title, id }) => (
				<FormRadioRow
					label={title}
					onPress={() => {
						setChanges({
							...changes,
							game: id,
						});
					}}
					selected={changes.game === id}
					style={{ marginHorizontal: 12 }}
				/>
			))}
			<FormRow
				label="Suggest new game"
				leading={<FormRow.Icon source={getAssetIDByName("PlusLargeIcon")} />}
				style={{ marginHorizontal: 12 }}
				onPress={() => url.openURL(newGameSuggestionURL())}
			/>
			<FormRow
				label={<Text {...destructiveText}>Delete Files</Text>}
				leading={
					<FormRow.Icon
						style={styles.destructiveIcon}
						source={getAssetIDByName("TrashIcon")}
					/>
				}
				onPress={() => {
					showConfirmationAlert({
						title: "Delete DOOM files?",
						content: "Are you sure you want to delete DOOM files?",
						confirmText: "Delete",
						confirmColor: "RED" as ButtonColors,
						cancelText: "Cancel",
						onConfirm: async () => {
							hideActionSheet();
							kaboom();
							await purgeFiles();
							showToast(
								"Deleted files",
								getAssetIDByName("CircleCheckIcon-primary"),
							);
						},
					});
				}}
			/>
			<Button
				variant="primary"
				size="md"
				text="Apply Changes"
				disabled={!hasChanges}
				onPress={() => {
					vstorage.settings = changes;
					hideActionSheet();
				}}
				style={{ paddingHorizontal: 16, paddingVertical: 8 }}
			/>
		</ActionSheet>
	);
}
