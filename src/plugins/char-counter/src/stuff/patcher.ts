import { find, findByName } from "@vendetta/metro";
import { after, instead } from "@vendetta/patcher";

import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { vstorage } from "..";
import CharCounter from "../components/CharCounter";
import SimpleCharCounter from "../components/SimpleCharCounter";

const JumpToPresentButton = findByName("JumpToPresentButton", false);
const ChatInputGuardWrapper = findByName("ChatInputGuardWrapper", false);
const ChatInputCharCounter =
	find(x => x?.default?.type?.displayName === "ChatInputCharCounter").default.type;

export interface ChatInputProps {
	handleTextChanged: (text: string) => void;
}

export default () => {
	const patches: (() => void)[] = [];

	patches.push(after("default", ChatInputGuardWrapper, (_, ret) => {
		const inputProps = findInReactTree(ret, x => x?.chatInputRef)?.chatInputRef;
		if (!inputProps) return;

		if (vstorage.position === "pill") {
			ret.props.children.unshift(
				React.createElement(CharCounter, { inputProps }),
			);
		} else {
			const native = findInReactTree(
				ret,
				x => x?.props?.children?.[0]?.type?.displayName === "ChatInputNativeComponent",
			);
			if (!native) return;

			native.props.style = [native.props.style, { marginBottom: 8 }];
			native.props.children.push(React.createElement(SimpleCharCounter, { inputProps }));
		}
	}));
	patches.push(instead("render", ChatInputCharCounter, (args, orig) => {
		if (vstorage.position === "inside") return null;
		else return orig(...args);
	}));

	patches.push(
		after("default", JumpToPresentButton, (_, ret) => {
			if (ret?.props?.style && vstorage.position === "pill") {
				const style = RN.StyleSheet.flatten(ret.props.style);
				ret.props.style = [
					style,
					{ bottom: (style.bottom || 0) + 24 + 8 },
				];
			}
		}),
	);

	return () => {
		for (const x of patches) x();
	};
};
