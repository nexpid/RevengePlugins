import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";

import { vstorage } from "..";

const { FormSwitchRow, FormRadioRow, FormRow, FormInput } = Forms;

export default () => {
	useProxy(vstorage);

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			<BetterTableRowGroup
				title="Settings"
				icon={getAssetIDByName("SettingsIcon")}
			>
				<FormRow
					label="Position"
					subLabel="Choose where Char Counter will appear"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormRadioRow
					label="Floating Pill"
					onPress={() => (vstorage.position = "pill")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.position === "pill"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Inside Textbox"
					onPress={() => (vstorage.position = "inside")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.position === "inside"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRow
					label="Display Type"
					subLabel="Choose how the char counter text appears"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormRadioRow
					label="Full"
					subLabel="100/300"
					onPress={() => (vstorage.display = "full")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.display === "full"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Length"
					subLabel="100"
					onPress={() => (vstorage.display = "length")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.display === "length"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Remaining"
					subLabel="-200"
					onPress={() => (vstorage.display = "remaining")}
					trailing={<FormRow.Arrow />}
					selected={vstorage.display === "remaining"}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRow
					label="Minimum Characters"
					subLabel="The minimum amount of characters for Char Counter to show up"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
				/>
				<FormInput
					title=""
					keyboardType="numeric"
					placeholder="1"
					value={vstorage.minChars.toString()}
					onChange={(x: string) => (vstorage.minChars = Math.max(
						Number.isNaN(Number(x)) ? 1 : Number(x),
						0,
					))}
					style={{ marginTop: -25, marginHorizontal: 12 }}
				/>
				<FormSwitchRow
					label="Add Thousand Seperators"
					subLabel="Adds thousand seperators (1,234,567) to numbers"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					onValueChange={() => (vstorage.commas = !vstorage.commas)}
					value={vstorage.commas}
				/>
				<FormSwitchRow
					label="Support SplitLargeMessages"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					onValueChange={() => (vstorage.supportSLM = !vstorage.supportSLM)}
					value={vstorage.supportSLM}
				/>
			</BetterTableRowGroup>
		</RN.ScrollView>
	);
};
