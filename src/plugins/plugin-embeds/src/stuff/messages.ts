// credits to @fres621, most codedLinks stuff was stolen from them :3

import { findByStoreName } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";
import { invisibleChar } from "./patcher";

const MessageStore = findByStoreName("MessageStore");

export const pluginMessageMap = new Map<string, {
	channelId: string;
	plugins: string[];
}>();

export const updateMessages = (plugin: string) => {
	for (const [id, { channelId, plugins }] of pluginMessageMap.entries()) {
		if (!plugins.includes(plugin)) continue;

		const message = MessageStore.getMessage(channelId, id);
		if (message) {
			const content: string = message.content;

			// a bit jank, but it works
			FluxDispatcher.dispatch({
				type: "MESSAGE_UPDATE",
				message: {
					...message,
					content: content.startsWith(invisibleChar)
						? content.slice(invisibleChar.length)
						: invisibleChar + content,
				},
				log_edit: false,
			});
		}
	}
};
