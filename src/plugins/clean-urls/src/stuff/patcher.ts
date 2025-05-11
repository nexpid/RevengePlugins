import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

import { RNChatModule } from "$/deps";

import { unsubRulesStore } from "../stores/RulesStore";
import { cleanUrl } from "./rules";

const Messages = findByProps("sendMessage", "editMessage");

const clean = (text: string) =>
	text.replace(HTTP_REGEX_MULTI, str => {
		let url: URL;
		try {
			url = new URL(str);
		} catch {
			return str;
		}

		return cleanUrl(url.toString());
	});

const handleMessage = (msg: any) => {
	if (msg?.content) msg.content = clean(msg.content);
};

interface Content {
	type?: "link";
	content: Content[] | string;
	target?: string;
}

const handleContent = (content: Content[]) => {
	for (const thing of content) {
		if (thing.type === "link" && typeof thing.target === "string") {
			thing.target = clean(thing.target);
		}

		if (typeof thing.content === "string") {
			thing.content = clean(thing.content);
		} else if (Array.isArray(thing.content)) {
			thing.content = handleContent(thing.content);
		}
	}
	return content;
};

export default function() {
	const patches = new Array<() => void>();

	patches.push(
		before("sendMessage", Messages, args => {
			handleMessage(args[1]);
		}),
	);
	patches.push(
		before("editMessage", Messages, args => {
			handleMessage(args[2]);
		}),
	);

	patches.push(
		before("updateRows", RNChatModule, args => {
			const rows = JSON.parse(args[1]);
			for (const row of rows) {
				if (row.message?.content) {
					row.message.content = handleContent(row.message.content);
				}
			}

			args[1] = JSON.stringify(rows);
		}),
	);

	patches.push(unsubRulesStore);

	return () => {
		for (const x of patches) {
			x();
		}
	};
}
