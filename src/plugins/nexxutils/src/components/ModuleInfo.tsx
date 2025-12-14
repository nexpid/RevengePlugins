import Text from "$/components/Text";
import { Stack } from "$/lib/redesign";
import { NavigationNative, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { type AnyModule, getModuleExtras } from "../stuff/Module";
import { ModulePage } from "./pages/ModulePage";

const { FormRow } = Forms;

export function ModuleInfo({ module }: { module: AnyModule }) {
	const navigation = NavigationNative.useNavigation();
	module.useRefresh();

	const extras = getModuleExtras(module);
	const styles = stylesheet.createThemedStyleSheet({
		text: {
			paddingRight: 6,
		},
		icon: {
			width: 18,
			height: 18,
			tintColor: semanticColors.TEXT_DEFAULT,
		},
		themed: {
			color: extras[0]?.color ?? semanticColors.TEXT_DEFAULT,
			tintColor: extras[0]?.color ?? semanticColors.TEXT_DEFAULT,
		},
	});

	return (
		<FormRow
			label={
				<Stack direction="horizontal" align="center" spacing={6}>
					<Text variant="text-md/semibold" style={[styles.text, styles.themed]}>
						{module.label}
					</Text>
					{extras.map((extra) => (
						<RN.Image
							key={extra.id}
							source={getAssetIDByName(extra.icon)}
							style={[styles.icon, extra.color ? { tintColor: extra.color } : null]}
						/>
					))}
				</Stack>
			}
			subLabel={module.meta.sublabel}
			leading={<FormRow.Icon source={module.meta.icon} style={styles.themed} />}
			trailing={<FormRow.Arrow />}
			onPress={() =>
				navigation.push("VendettaCustomPage", {
					title: module.label,
					render: () => <ModulePage module={module} />,
				})}
		/>
	);
}
