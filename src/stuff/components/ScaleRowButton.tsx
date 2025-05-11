import { PressableScale, RowButton } from "$/lib/redesign";
import type { RowButton as RowButtonType } from "$/lib/redesign/types";

export default function ScaleRowButton({
	onPress,
	onPressIn,
	onPressOut,
	...props
}: Parameters<RowButtonType>[0]) {
	return (
		<PressableScale
			onPress={onPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}
			pointerEvents="box-only"
		>
			<RowButton {...props} />
		</PressableScale>
	);
}
