import { ReactNative as RN, url } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import ScaleRowButton from "$/components/ScaleRowButton";

import { vstorage } from "..";

const { FormSwitchRow, FormRow } = Forms;

export default () => {
	useProxy(vstorage);

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			<BetterTableRowGroup
				title="Settings"
				icon={getAssetIDByName("SettingsIcon")}
			>
				<FormSwitchRow
					label="Remove link wrapping"
					subLabel={vstorage.config.redirect
						? "https://example.com/"
						: "https://www.google.com/url?q=https://example.com/"}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("MagnifyingGlassIcon")}
						/>
					}
					onValueChange={() => (vstorage.config.redirect = !vstorage.config.redirect)}
					value={vstorage.config.redirect}
				/>
				<FormSwitchRow
					label="Remove referral parameters"
					subLabel={`https://amazon.com/product${
						vstorage.config.referrals ? "/" : "?tag=nexpid-50"
					}`}
					leading={<FormRow.Icon source={getAssetIDByName("QuestsIcon")} />}
					onValueChange={() => (vstorage.config.referrals = !vstorage.config.referrals)}
					value={vstorage.config.referrals}
				/>
			</BetterTableRowGroup>
			<RN.View style={{ marginHorizontal: 16, marginTop: 12 }}>
				<ScaleRowButton
					label={"Visit source"}
					onPress={() => url.openURL("https://gitlab.com/ClearURLs/Rules")}
				/>
			</RN.View>
		</RN.ScrollView>
	);
};
