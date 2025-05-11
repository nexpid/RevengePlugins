import { ReactNative as RN } from "@vendetta/metro/common";

import Text from "./Text";

export namespace RichText {
	export function Bold({
		children,
		onPress,
	}: React.PropsWithChildren<{
		onPress?: () => void;
	}>) {
		return (
			<Text variant={"text-md/bold"} onPress={onPress}>
				{children}
			</Text>
		);
	}

	export function Underline({
		children,
		onPress,
	}: React.PropsWithChildren<{
		onPress?: () => void;
	}>) {
		return (
			<RN.Text
				style={{ textDecorationLine: "underline" }}
				onPress={onPress}
			>
				{children}
			</RN.Text>
		);
	}
}
