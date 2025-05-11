// credits to @fres621, most codedLinks stuff was stolen from them :3

import { findByStoreName } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";

const MessageStore = findByStoreName("MessageStore");

export const pluginInstallingCache = {} as Record<string, boolean>;
export const pluginMessageCache = {} as Record<string, [string, string][]>;

export const updateMessages = (plugin: string, installing?: boolean) => {
	if (installing !== undefined) pluginInstallingCache[plugin] = installing;

	if (pluginMessageCache[plugin]) {
		for (const [id, channel] of pluginMessageCache[plugin]) {
			const message = MessageStore.getMessage(channel, id);
			if (message) {
				FluxDispatcher.dispatch({
					type: "MESSAGE_UPDATE",
					message: {
						...message,
						content: message.content.endsWith(" ")
							? message.content.slice(0, -1)
							: `${message.content} `,
					},
					log_edit: false,
				});
			}
		}
	}
};
