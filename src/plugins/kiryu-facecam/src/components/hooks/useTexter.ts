import { React } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
import type { MutableRefObject } from "react";
import { sendAction } from "../../stuff/frames";
import type { ChatInputProps } from "../../stuff/patcher";

export function useTexter(inputProps: MutableRefObject<ChatInputProps>) {
	React.useEffect(() => {
		if (!inputProps.current) return;
		const unpatch = before(
			"handleTextChanged",
			inputProps.current,
			([text]) => text && sendAction(Math.random() < 0.5 ? "left" : "right"),
		);
		return () => void unpatch();
	}, []);
}
