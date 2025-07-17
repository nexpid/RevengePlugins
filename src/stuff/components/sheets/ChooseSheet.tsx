import { React, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import type { ImageSourcePropType } from "react-native";

import { ActionSheet } from "../ActionSheet";

const { FormRow } = Forms;

export default function ChooseSheet({
	title,
	value: _value,
	options,
	callback,
}: {
	title: string;
	value: string | number | boolean | null;
	options: {
		name: string;
		description?: string;
		value: typeof _value;
		icon?: ImageSourcePropType;
		iconColor?: any;
		iconComponent?: React.ReactNode;
	}[];
	callback: (v: typeof _value) => void;
}) {
	const [value, setValue] = React.useState(_value);

	return (
		<ActionSheet title={title}>
			{options.map((x) => (
				<FormRow
					key={x.value}
					label={x.name}
					subLabel={x.description}
					trailing={x.iconComponent
						? x.iconComponent
						: x.icon && (
							<RN.Image
								source={x.icon}
								resizeMode="cover"
								style={{
									width: 24,
									height: 24,
									tintColor: x.iconColor,
								}}
							/>
						)}
					leading={<FormRow.Radio selected={x.value === value} />}
					onPress={() => {
						setValue(x.value);
						callback(x.value);
					}}
				/>
			))}
		</ActionSheet>
	);
}
