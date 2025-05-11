import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";

import { vstorage } from "..";

const { FormRow, FormRadioRow } = Forms;

export default function() {
	useProxy(vstorage);

	return (
		<RN.ScrollView>
			<BetterTableRowGroup
				title="Settings"
				icon={getAssetIDByName("SettingsIcon")}
			>
				<FormRow
					label="Button type"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormRadioRow
					label="Floating Pill"
					onPress={() => (vstorage.buttonType = "pill")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.buttonType === "pill"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Send button"
					subLabel="Holding the send button"
					onPress={() => (vstorage.buttonType = "send")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.buttonType === "send"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRow
					label="Preview type"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormRadioRow
					label="Popup"
					onPress={() => (vstorage.previewType = "popup")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.previewType === "popup"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Ephemeral message"
					onPress={() => (vstorage.previewType = "clyde")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.previewType === "clyde"}
					style={{ marginHorizontal: 12 }}
				/>
			</BetterTableRowGroup>
		</RN.ScrollView>
	);
}
