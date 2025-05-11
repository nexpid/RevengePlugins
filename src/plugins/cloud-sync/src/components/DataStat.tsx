import { ReactNative as RN } from "@vendetta/metro/common";

import Text from "$/components/Text";

import { lang } from "..";

export default function({
	subtitle,
	count,
}: {
	subtitle: keyof NonNullable<typeof lang.Values>;
	count: string | number;
}) {
	return (
		<RN.View
			style={{
				alignItems: "center",
				justifyContent: "center",
				marginHorizontal: 16,
			}}
		>
			<Text variant="text-lg/bold" color="TEXT_NORMAL" align="center">
				{count}
			</Text>
			<Text variant="text-md/medium" color="TEXT_MUTED" align="center">
				{lang.format(subtitle, {})}
			</Text>
		</RN.View>
	);
}
