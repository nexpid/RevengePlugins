import { React } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
import type { MutableRefObject } from "react";
import type { ChatInputProps } from "../../stuff/patcher";

export function useInput(inputProps: MutableRefObject<ChatInputProps | undefined>) {
	const [text, setText] = React.useState("");

	React.useEffect(() => {
		if (!inputProps.current) return;
		const unpatch = before("handleTextChanged", inputProps.current, ([text]) => setText(text));
		return () => void unpatch();
	}, []);

	return text;
}
