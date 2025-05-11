import { React, stylesheet } from "@vendetta/metro/common";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";

import { before } from "@vendetta/patcher";
import { vstorage } from "..";
import getMessageLength, { display, hasSLM } from "../stuff/getMessageLength";
import type { ChatInputProps } from "../stuff/patcher";

const styles = stylesheet.createThemedStyleSheet({
	container: {
		position: "absolute",
		right: 0,
		bottom: -8,
	},
});

export default function SimpleCharCounter({
	inputProps,
}: { inputProps: ChatInputProps }) {
	const [text, setText] = React.useState("");

	React.useEffect(() => {
		const des = before("handleTextChanged", inputProps, ([txt]) => setText(txt));
		return () => void des();
	}, []);

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
				color={actualLength <= maxLength ? "TEXT_MUTED" : "TEXT_DANGER"}
			>
				{display(actualLength)}
			</Text>
		</Reanimated.default.View>
	);
}
