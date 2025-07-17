import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";

import { lang } from "..";
import Kiryu, { openSet } from "../components/Kiryu";
import { sendAction } from "./frames";

const _ChatInput = findByProps("ChatInput")?.ChatInput;
const messaging = findByProps("sendMessage", "receiveMessage");

export default function() {
	const patches: (() => void)[] = [];

	patches.push(
		after("render", RN.View, ([{ children, style }], ret) => {
			if (style && Array.isArray(children)) {
				const oldUI = Object.keys(style).length === 1
					&& style.flex === 1
					&& children.find((y: any) => y?.type?.name === "ChannelRoutes");

				if (
					oldUI
					|| (Object.keys(style).length === 2
						&& style.flex === 1
						&& style.overflow === "hidden"
						&& children.find(
							(y: any) => y?.type?.name === "ChatViewConnected",
						))
				) {
					return React.createElement(
						React.Fragment,
						{},
						ret,
						React.createElement(Kiryu, { oldUI }),
					);
				}
			}
		}),
	);

	const kbHide = RN.Keyboard.addListener("keyboardDidHide", () => {
		openSet(false);
	});
	const kbShow = RN.Keyboard.addListener("keyboardDidShow", () => {
		openSet(true);
	});
	patches.push(() => {
		kbHide.remove();
		kbShow.remove();
	});

	// patches.push(
	// 	after("render", ChatInput.prototype, (_, ret) => {
	// 		const input = findInReactTree(
	// 			ret.props.children,
	// 			x => x.type?.name === "ChatInput",
	// 		);
	// 		const props = input?.props;
	// 		if (!props?.onChangeText) return;

	// 		patches.push(
	// 			after(
	// 				"onChangeText",
	// 				props,
	// 				([txt]) =>
	// 					txt !== ""
	// 					&& sendAction(Math.random() < 0.5 ? "left" : "right"),
	// 			),
	// 		);
	// 	}),
	// );

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
