import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

import { vstorage } from "..";
import { useState } from "../stuff/active";
import type { Iconpack } from "../types";

const { FormRow } = Forms;

export default function IconpackRow({
	pack,
	onPress,
}: {
	pack: Iconpack;
	onPress: () => void;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		headerTrailing: {
			flexDirection: "row",
			gap: 15,
			alignItems: "center",
		},
		actions: {
			flexDirection: "row-reverse",
			alignItems: "center",
			gap: 5,
		},
	});
	useState();

	return (
		<FormRow
			label={pack.name}
			subLabel={pack.description}
			onPress={onPress}
			leading={
				<FormRow.Icon
					source={{
						uri: `${pack.load}images/native/main_tabs/Messages${pack.suffix}.png`,
					}}
				/>
			}
			trailing={
				<RN.View style={styles.headerTrailing}>
					<FormRow.Radio
						selected={vstorage.iconpack.pack === pack.id}
					/>
				</RN.View>
			}
		/>
	);
}
