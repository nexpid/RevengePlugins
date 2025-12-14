import { find } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";

import Text from "./Text";

const { FormCheckbox } = find(x => x?.FormCheckbox && !x?.FormCardSection);

export default function InlineCheckbox({
	label,
	initialValue,
	update,
}: {
	label: string;
	initialValue: boolean;
	update: (val: boolean) => void;
}) {
	const [value, setValue] = React.useState(initialValue);
	update(value);

	return (
		<RN.Pressable
			accessibilityLabel={label}
			accessibilityRole="checkbox"
			accessibilityState={{
				selected: value,
			}}
			onPress={() => {
				setValue(!value);
			}}
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: 8,
				marginTop: 12,
			}}
		>
			<FormCheckbox checked={value} />
			<Text variant="text-md/normal" color="TEXT_DEFAULT">
				{label}
			</Text>
		</RN.Pressable>
	);
}
