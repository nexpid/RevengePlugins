import { BetterTableRowGroup } from "$/components/BetterTableRow";
import { settings } from "@vendetta";
import { ReactNative } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { lang, vstorage } from "..";

const { ScrollView } = ReactNative;
const { FormRow, FormSwitchRow } = Forms;

export function Settings() {
	useProxy(vstorage);

	return (
		<ScrollView style={{ flex: 1 }}>
			<BetterTableRowGroup title="Settings" icon={getAssetIDByName("CogIcon")}>
				<FormSwitchRow
					label={lang.format("settings.danger_zone.title", {})}
					subLabel={lang.format("settings.danger_zone.description", {})}
					leading={<FormRow.Icon source={getAssetIDByName("WarningIcon")} />}
					onValueChange={() => {
						if (!vstorage.settings.dangerZone && !settings.developerSettings) {
							return showConfirmationAlert({
								title: lang.format("alert.danger_zone.title", {}),
								content: lang.format("alert.danger_zone.body", {}),
								confirmText: lang.format("alert.danger_zone.enable", {}),
								onConfirm() {
									vstorage.settings.dangerZone = true;
								},
								cancelText: lang.format("alert.danger_zone.cancel", {}),
							});
						}
						vstorage.settings.dangerZone = !vstorage.settings.dangerZone;
					}}
					value={vstorage.settings.dangerZone}
				/>
			</BetterTableRowGroup>
		</ScrollView>
	);
}
