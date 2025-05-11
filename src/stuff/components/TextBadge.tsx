import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import type { ViewStyle } from "react-native";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";

export default function TextBadge({
	style,
	variant,
	children,
	shiny,
}: React.PropsWithChildren<{
	style?: ViewStyle;
	variant: "primary" | "danger";
	shiny?: boolean;
}>) {
	const [width, setWidth] = React.useState(0);

	const styles = stylesheet.createThemedStyleSheet({
		main: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 2147483647,
			paddingHorizontal: 6,
			paddingVertical: 3,
			backgroundColor: semanticColors[
				`REDESIGN_BUTTON_${variant.toUpperCase()}_BACKGROUND`
			],
			color: semanticColors[
				`REDESIGN_BUTTON_${variant.toUpperCase()}_TEXT`
			],
			marginTop: 3,
			overflow: "hidden",
		},
		shiner: {
			position: "absolute",
			width: 7,
			height: 80,
			backgroundColor: "#fff4",
		},
	});

	const shinyTranslate = Reanimated.useSharedValue(0);
	const randomness = React.useRef(
		1500 + Math.floor(Math.random() * 696),
	).current;

	React.useEffect(() => {
		if (width !== 0 && shiny) {
			shinyTranslate.value = Reanimated.withRepeat(
				Reanimated.withSequence(
					Reanimated.withTiming(-width, { duration: 0 }),
					Reanimated.withDelay(
						randomness,
						Reanimated.withTiming(width, {
							duration: 800,
							easing: Reanimated.Easing.inOut(
								Reanimated.Easing.cubic,
							),
						}),
					),
				),
				0,
			);
		} else shinyTranslate.value = 500;
	}, [shiny, width]);

	return (
		<RN.View
			style={[styles.main, style]}
			onLayout={layout => {
				setWidth(layout.nativeEvent.layout.width * 0.5 + 4);
			}}
		>
			{shiny && width !== 0 && (
				<Reanimated.default.View
					style={[
						styles.shiner,
						{
							transform: [
								{
									rotate: "-22deg",
								},
								{ translateX: shinyTranslate },
							],
						},
					]}
				/>
			)}
			<Text
				variant="text-xxs/bold"
				color="STATUS_DANGER_TEXT"
				align="center"
				style={{
					textTransform: "uppercase",
				}}
			>
				{children}
			</Text>
		</RN.View>
	);
}
