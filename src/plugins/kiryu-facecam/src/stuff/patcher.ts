import { findByProps, findByTypeName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";

import { lang } from "..";
import Kiryu, { openSet } from "../components/Kiryu";
import { sendAction } from "./frames";

const ChatView = findByTypeName("ChatView");
const messaging = findByProps("sendMessage", "receiveMessage");

export interface ChatInputProps {
	handleTextChanged: (text: string) => void;
}

export default function() {
	const patches: (() => void)[] = [];

	patches.push(after("type", ChatView, ([{ chatInputRef }], ret) => {
		return React.createElement(
			React.Fragment,
			{},
			ret,
			React.createElement(Kiryu, { inputProps: chatInputRef }),
		);
	}));

	const kbHide = RN.Keyboard.addListener("keyboardDidHide", () => openSet?.(false));
	const kbShow = RN.Keyboard.addListener("keyboardDidShow", () => openSet?.(true));
	patches.push(() => {
		kbHide.remove();
		kbShow.remove();
	});

	patches.push(lang.unload);

	const nod = () => {
		sendAction("nod", 1000 / 10);
	};
	patches.push(before("sendMessage", messaging, nod));
	patches.push(before("editMessage", messaging, nod));

	return () => {
		for (const x of patches) {
			x();
		}
	};
}
