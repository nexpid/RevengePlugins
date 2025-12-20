import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { React, stylesheet } from "@vendetta/metro/common";
import type { MutableRefObject } from "react";
import { vstorage } from "..";
import getMessageLength, { display, hasSLM } from "../stuff/getMessageLength";
import type { ChatInputProps } from "../stuff/patcher";
import { useInput } from "./hooks/useInput";

const styles = stylesheet.createThemedStyleSheet({
	container: {
		position: "absolute",
		right: 0,
		bottom: -8,
	},
});

export default ({ inputProps }: { inputProps: MutableRefObject<ChatInputProps | undefined> }) => {
	const text = useInput(inputProps);

	const fade = Reanimated.useSharedValue(vstorage.minChars === 0 ? 1 : 0);

	const curLength = text.length,
		maxLength = getMessageLength();
	const extraMessages = hasSLM() ? Math.floor(curLength / maxLength) : 0;

	const actualLength = curLength - extraMessages * maxLength;
	const shouldAppear = curLength >= vstorage.minChars;

	React.useEffect(() => {
		fade.value = Reanimated.withTiming(shouldAppear ? 1 : 0, {
			duration: 100,
		});
	}, [shouldAppear]);

	return (
		<Reanimated.default.View
			style={[
				styles.container,
				{ opacity: fade.value },
				{ opacity: fade },
			]}
		>
			<Text
				variant="text-xs/semibold"
				color={actualLength <= maxLength ? "TEXT_MUTED" : "TEXT_FEEDBACK_CRITICAL"}
			>
				{display(actualLength)}
			</Text>
		</Reanimated.default.View>
	);
};
