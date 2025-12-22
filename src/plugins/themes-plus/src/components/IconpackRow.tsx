import { Forms } from "@vendetta/ui/components";

import { useState } from "../stuff/active";
import type { Iconpack } from "../types";

const { FormRow } = Forms;

export function previewIcon(name: string, load: string, suffix: string) {
	return `${load}design/components/Icon/native/redesign/generated/images/${name}${suffix}.png`;
}

export default function IconpackRow({
	pack,
	selected,
	onPress,
}: {
	pack: Iconpack;
	selected: boolean;
	onPress: () => void;
}) {
	useState();

	return (
		<FormRow
			label={pack.name}
			subLabel={pack.description}
			onPress={onPress}
			leading={
				<FormRow.Icon
					source={{
						uri: previewIcon("ChatIcon", pack.load, pack.suffix),
					}}
				/>
			}
			trailing={<FormRow.Radio selected={selected} />}
		/>
	);
}
