import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { rawColors, semanticColors } from "@vendetta/ui";

import Text from "$/components/Text";
import { lerp, resolveCustomSemantic, resolveSemanticColor } from "$/types";

const AnimatedPressable = RN.Animated.createAnimatedComponent(RN.Pressable);

export default function TextButton({
	label,
	color,
	disabled,
	loading,
	onPress,
}: {
	label: string;
	color: "BRAND" | "DANGER" | "POSITIVE" | "NORMAL";
	disabled?: boolean;
	loading?: boolean;
	onPress?: () => void;
}) {
	const { raw: rawClr, txt: textClr } = {
		BRAND: {
			raw: rawColors.BRAND_500,
			txt: "TEXT_BRAND",
		},
		DANGER: {
			raw: rawColors.RED_500,
			txt: "TEXT_FEEDBACK_CRITICAL",
		},
		POSITIVE: {
			raw: rawColors.GREEN_500,
			txt: "TEXT_FEEDBACK_POSITIVE",
		},
		NORMAL: {
			raw: rawColors.PRIMARY_500,
			txt: "TEXT_DEFAULT",
		},
	}[color];
	const bleh = resolveCustomSemantic(
		lerp(rawClr, "#FFFFFF", 0.25),
		lerp(rawClr, "#000000", 0.15),
	);
	const styles = stylesheet.createThemedStyleSheet({
		container: {
			alignItems: "baseline",
			paddingHorizontal: 12,
			paddingVertical: 10,
			borderRadius: 2147483647,
		},
		inactive: {
			backgroundColor: `${bleh}00`,
		},
		active: {
			backgroundColor: `${bleh}14`,
		},
	});

	const enabled = !loading && !disabled;

	const [isPressing, setIsPressing] = React.useState(false);
	const pressVal = React.useRef(
		new RN.Animated.Value(isPressing ? 1 : 0),
	).current;

	React.useEffect(() => {
		RN.Animated.timing(pressVal, {
			toValue: isPressing ? 1 : 0,
			duration: 100,
			easing: RN.Easing.linear,
			useNativeDriver: true,
		}).start();
	}, [isPressing]);

	return (
		<AnimatedPressable
			style={[
				styles.container,
				enabled && {
					backgroundColor: pressVal.interpolate({
						inputRange: [0, 1],
						outputRange: [
							styles.inactive.backgroundColor,
							styles.active.backgroundColor,
						],
					}),
				},
			]}
			onPressIn={() => {
				setIsPressing(true);
			}}
			onPressOut={() => {
				setIsPressing(false);
			}}
			onPress={() => enabled && onPress?.()}
			accessibilityRole="button"
			accessibilityState={{
				disabled: !enabled,
			}}
			accessible={enabled}
			collapsable={false}
			disabled={!enabled}
			pointerEvents={enabled ? "box-only" : "none"}
		>
			{loading
				? (
					<RN.ActivityIndicator
						size="small"
						color={resolveSemanticColor(semanticColors[textClr])}
					/>
				)
				: (
					<Text
						variant="text-md/semibold"
						color={enabled ? textClr : "TEXT_MUTED"}
					>
						{label}
					</Text>
				)}
		</AnimatedPressable>
	);
}
