import { findByProps } from "@vendetta/metro";
import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { Forms } from "@vendetta/ui/components";

const { FormRow } = Forms;
const { TableRow } = findByProps("TableRow");

export const { useInMainTabsExperiment } = findByProps(
	"useInMainTabsExperiment",
	"isInMainTabsExperiment",
);

export default function AutoRow({
	label,
	icon,
	onPress,
}: {
	label: string;
	icon: number;
	onPress?: () => void;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		icon: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_ICON_DEFAULT,
			opacity: 0.6,
		},
	});
	const tabbed = useInMainTabsExperiment();

	if (tabbed) {
		return (
			<TableRow
				label={label}
				icon={<RN.Image style={styles.icon} source={icon} />}
				onPress={onPress}
			/>
		);
	}

	return (
		<FormRow
			label={label}
			leading={<FormRow.Icon source={icon} />}
			onPress={onPress}
		/>
	);
}
