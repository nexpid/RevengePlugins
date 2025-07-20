import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import type { TextProps } from "react-native";

import { resolveSemanticColor, TextStyleSheet, type TextStyleSheetVariant } from "../types";

export function TrailingText({ children }: React.PropsWithChildren<object>) {
	return (
		<Text variant="text-md/medium" color="TEXT_MUTED">
			{children}
		</Text>
	);
}

const { useThemeContext } = findByProps("useThemeContext");

export default function Text({
	variant,
	lineClamp,
	color,
	align,
	style,
	onPress,
	getChildren,
	children,
	liveUpdate,
	ellipsis,
}: React.PropsWithChildren<{
	variant?: TextStyleSheetVariant;
	color?: string;
	getChildren?: () => React.ReactNode | undefined;
	liveUpdate?: boolean;

	lineClamp?: TextProps["numberOfLines"];
	align?: "left" | "right" | "center";
	style?: TextProps["style"];
	onPress?: TextProps["onPress"];
	ellipsis?: TextProps["ellipsizeMode"];
}>) {
	const themeContext = useThemeContext();
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);

	React.useEffect(() => {
		if (!liveUpdate) return;
		const nextSecond = () => Date.now() - new Date().setMilliseconds(1000);

		let timeout = setTimeout(function update() {
			forceUpdate();
			timeout = setTimeout(update, nextSecond());
		}, nextSecond());

		return () => clearTimeout(timeout);
	}, []);

	return (
		<RN.Text
			style={[
				variant && TextStyleSheet[variant],
				color
					? {
						color: resolveSemanticColor(
							semanticColors[color],
							themeContext?.theme,
						),
					}
					: {},
				align && { textAlign: align },
				style ?? {},
			]}
			numberOfLines={lineClamp}
			onPress={onPress}
			ellipsizeMode={ellipsis}
		>
			{getChildren?.() ?? children}
		</RN.Text>
	);
}
