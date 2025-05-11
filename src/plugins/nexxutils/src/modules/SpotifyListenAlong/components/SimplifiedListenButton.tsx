import { React, ReactNative as RN } from "@vendetta/metro/common";

import { IconButton } from "$/lib/redesign";

import UserPlayIcon from "../../../../assets/SpotifyListenAlong/UserPlayIcon.png";
import { doSync, type ListenButtonProps, useListenButton, useLoading } from "./core";

export default function SimplifiedListenButton({
	button,
	activity,
}: ListenButtonProps) {
	const { disabled, userId } = useListenButton(activity);
	const { loading: _loading, trigger } = useLoading();
	const loading = _loading && !disabled;

	return (
		<RN.View style={{ flexDirection: "row", flex: 1 }}>
			<IconButton
				size="md"
				variant="secondary"
				style={[{ paddingRight: 6 }, !!disabled && { opacity: 0.5 }]}
				loading={loading}
				icon={UserPlayIcon}
				onPress={() => (
					doSync(disabled, activity, userId), !disabled && trigger()
				)}
			/>
			<RN.View style={{ flexGrow: 1 }}>{button}</RN.View>
		</RN.View>
	);
}
