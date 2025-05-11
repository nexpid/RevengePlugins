import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";

import { vstorage } from "..";

const { FormRow } = Forms;

const styles = stylesheet.createThemedStyleSheet({
	destructiveIcon: {
		tintColor: semanticColors.TEXT_DANGER,
	},
});
const destructiveText: Parameters<typeof Text>[0] = {
	color: "TEXT_DANGER",
	variant: "text-md/semibold",
};

export default () => {
	useProxy(vstorage);

	return (
		<RN.ScrollView>
			<BetterTableRowGroup
				title="Settings"
				icon={getAssetIDByName("SettingsIcon")}
			>
				<FormRow
					label="Data size"
					subLabel={vstorage.pinned
						? `${
							Math.floor(
								(JSON.stringify(vstorage.pinned).length
									/ 1000)
									* 100,
							) / 100
						} kilobytes`
						: "N/A"}
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormRow
					label={<Text {...destructiveText}>Clear data</Text>}
					leading={
						<FormRow.Icon
							style={styles.destructiveIcon}
							source={getAssetIDByName("TrashIcon")}
						/>
					}
					trailing={<FormRow.Arrow />}
					onPress={() => {
						showConfirmationAlert({
							title: "Clear data",
							content: "Are you sure you want to clear all local pin data?",
							confirmText: "Clear",
							confirmColor: "red" as ButtonColors,
							onConfirm: () => {
								vstorage.pinned = {};
							},
							isDismissable: true,
						});
					}}
				/>
			</BetterTableRowGroup>
		</RN.ScrollView>
	);
};
