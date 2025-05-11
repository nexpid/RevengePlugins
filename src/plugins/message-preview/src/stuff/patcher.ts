import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

import intlProxy from "$/lib/intlProxy";

import { vstorage } from "..";
import PreviewButton from "../components/PreviewButton";
import openPreview from "./openPreview";

const ChatInputGuardWrapper = findByName("ChatInputGuardWrapper", false);

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

			if (vstorage.buttonType === "pill") {
				const children = findInReactTree(
					ret.props.children,
					x =>
						x.type?.displayName === "View"
						&& Array.isArray(x.props?.children),
				)?.props?.children as any[];
				if (!children) return;

				children.unshift(
					React.createElement(PreviewButton, { inputProps }),
				);
			}
		}),
	);

	// thank you rosie
	patches.push(
		// @ts-expect-error not in RN typings
		before("render", RN.Pressable.type, ([a]) => {
			if (
				a?.accessibilityLabel === intlProxy.SEND
				&& a?.onPress?.name === "handlePressSend"
			) {
				a.onLongPress = () => vstorage.buttonType === "send" && openPreview();
			}
		}),
	);

	return () => {
		for (const x of patches) x();
	};
};
