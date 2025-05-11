import { React, ReactNative as RN } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";

import { lang } from "..";
import CustomTwemoji from "../components/CustomTwemoji";
import { getSrc, parse } from "./twemoji";

export default function() {
	const patches = new Array<() => void>();

	patches.push(
		before("render", RN.Image, args => {
			const cloned = [...args];
			const [x] = cloned;
			if (x.vanilla) return cloned;

			const { source } = x;

			if (source?.uri?.startsWith("asset:/emoji-")) {
				source.uri = getSrc(source.uri.split("-")[1].split(".")[0]);
			}

			return cloned;
		}),
	);

	patches.push(
		before("render", RN.Text, ([x]) => {
			let children = new Array<any>();

			const style = RN.StyleSheet.flatten(x.style) ?? {};
			const twemoji = (src: string) =>
				React.createElement(CustomTwemoji, {
					emoji: src,
					size: style.fontSize,
				});

			if (Array.isArray(x.children)) {
				for (const c of x.children) {
					children.push(
						...(typeof c === "string" ? parse(c, twemoji) : [c]),
					);
				}
			} else {
				children = typeof x.children === "string"
					? parse(x.children, twemoji)
					: [x.children];
			}

			x.children = children;
		}),
	);

	patches.push(lang.unload);

	return () => {
		for (const x of patches) {
			x();
		}
	};
}
