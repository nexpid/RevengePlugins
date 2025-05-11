import { findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { Reanimated } from "$/deps";
import { getUserAvatar } from "$/types";

const UserStore = findByStoreName("UserStore");

export default function() {
	const spinAnim = Reanimated.useSharedValue("0deg");
	const scaleAnim = Reanimated.useSharedValue(1);

	const rot = React.useRef(0);

	const comboTimer = React.useRef<[any, number]>([0, 0]);

	return (
		<RN.Pressable
			onPressIn={() => {
				rot.current += 540;
				spinAnim.value = Reanimated.withSpring(`${rot.current}deg`, {
					mass: 3,
					stiffness: 250,
					reduceMotion: Reanimated.ReduceMotion.Never,
				});

				clearTimeout(comboTimer.current[0]);
				comboTimer.current[0] = setTimeout(() => {
					comboTimer.current[1] = 0;
				}, 1_000);

				comboTimer.current[1] += 1;
				if (comboTimer.current[1] >= 5) {
					showToast(
						`COMBO: ${comboTimer.current[1].toString().padStart(3, "0")}`,
					);
					scaleAnim.value = 1 + comboTimer.current[1] / 50;
					scaleAnim.value = Reanimated.withTiming(1, {
						duration: 500,
					});
				}
			}}
			style={{ marginRight: 12 }}
		>
			<Reanimated.default.Image
				style={[
					{
						height: 85,
						width: 85,
						borderRadius: 18,
					},
					{ transform: [{ rotate: spinAnim }, { scale: scaleAnim }] },
				]}
				source={UserStore.getCurrentUser()?.id
					? {
						uri: getUserAvatar(
							UserStore.getCurrentUser(),
							true,
						),
					}
					: getAssetIDByName(
						`icon${Math.floor(Math.random() * 8)}`,
					)}
			/>
		</RN.Pressable>
	);
}
