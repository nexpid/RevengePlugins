import { React, ReactNative as RN } from "@vendetta/metro/common";
import { Button } from "@vendetta/ui/components";

import UserPlayIcon from "../../../../assets/SpotifyListenAlong/UserPlayIcon.png";
import { doSync, type ListenButtonProps, useListenButton, useLoading } from "./core";

export default function ClassicListenButton({
	button,
	activity,
}: ListenButtonProps) {
	const { disabled, userId } = useListenButton(activity);
	const { loading: _loading, trigger } = useLoading();
	const loading = _loading && !disabled;

	return (
		<RN.View style={{ flexDirection: "row", flex: 1 }}>
			<RN.View style={{ paddingRight: 6 }}>
				<Button
					size="small"
					text=""
					style={[
						button.style,
						{ width: 32 },
						!!disabled && { opacity: 0.5 },
					]}
					renderIcon={() =>
						loading ? <RN.ActivityIndicator size="small" color="#fff" /> : (
							<RN.Image
								source={UserPlayIcon}
								style={{
									width: 20,
									height: 20,
									tintColor: "#fff",
								}}
							/>
						)}
					onPress={() =>
						!loading
						&& (doSync(disabled, activity, userId), !disabled && trigger())}
				/>
			</RN.View>
			<RN.View style={{ flexGrow: 1 }}>
				<Button {...button} />
			</RN.View>
		</RN.View>
	);
}
