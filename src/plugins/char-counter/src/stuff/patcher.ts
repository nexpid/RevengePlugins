import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

import { vstorage } from "..";
import CharCounter from "../components/CharCounter";
import SimpleCharCounter from "../components/SimpleCharCounter";

const ChatInputGuardWrapper = findByName("ChatInputGuardWrapper", false);
const JumpToPresentButton = findByName("JumpToPresentButton", false);

export interface ChatInputProps {
	handleTextChanged: (text: string) => void;
}

export default () => {
	const patches: (() => void)[] = [];

	patches.push(
		after("default", ChatInputGuardWrapper, (_, ret) => {
			const inputProps = findInReactTree(
				ret.props.children,
				x => x?.props?.chatInputRef?.current,
			)?.props?.chatInputRef?.current as ChatInputProps;
			if (!inputProps?.handleTextChanged) return;

			if (vstorage.position === "pill") {
				const children = findInReactTree(
					ret.props.children,
					x =>
						x.type?.displayName === "View"
						&& Array.isArray(x.props?.children),
				)?.props?.children as any[];
				if (!children) return;

				children.unshift(
					React.createElement(CharCounter, { inputProps }),
				);
			} else {
				const chatCont = findInReactTree(
					ret.props.children,
					x =>
						x?.children?.[0].type?.displayName
							=== "ChatInputNativeComponent",
				) as { children: any[]; style: any[] };
				if (!chatCont) return;

				chatCont.style = [...chatCont.style, { marginBottom: 8 }];
				chatCont.children.push(
					React.createElement(SimpleCharCounter, { inputProps }),
				);
			}
		}),
	);

	patches.push(
		after("default", JumpToPresentButton, (_, ret) => {
			if (ret?.props?.style && vstorage.position === "pill") {
				ret.props.style = [
					...ret.props.style,
					{ bottom: ret.props.style[1].bottom + 32 + 8 },
				];
			}
		}),
	);

	return () => {
		for (const x of patches) x();
	};
};
