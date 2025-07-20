import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

import { patchRows } from "$/types";
import type { ContentRow } from "$/typings";
import { pluginMessageMap } from "./messages";
import { getCodedLink, runPluginStateCta } from "./plugins";
import { embedWhitelist } from "./whitelist";

function trail(x: string) {
	return x.replace(/(\/)?$/, "/");
}
function iterate(pluginLinks: string[], rows: ContentRow[]) {
	for (const row of rows) {
		if ("content" in row) {
			if (typeof row.content === "string") {
				if (row.content.startsWith(invisibleChar)) {
					row.content = row.content.slice(invisibleChar.length);
				}

				const links = row.content.match(HTTP_REGEX_MULTI)?.map(trail) ?? [];
				for (const url of links) {
					const host = new URL(url).hostname.toLowerCase();
					if (
						embedWhitelist.hosts.some(x => x.toLowerCase() === host)
						|| embedWhitelist.domains.some(x => host.endsWith(`.${x.toLowerCase()}`))
					) {
						pluginLinks.push(url);
					}
				}
			} else if (Array.isArray(row.content)) {
				iterate(pluginLinks, row.content);
			}
		} else if ("items" in row && Array.isArray(row.items)) {
			iterate(pluginLinks, row.items);
		}
	}
}

interface CodedLinkMeta {
	index: number;
	plugin: string;
}

export const invisibleChar = "\x00";

const { MessagesHandlers } = findByProps("MessagesHandlers");

const patchedSymbol = Symbol.for("nexpid.plugin-embeds.patched");
const codedLinks = new Map<string, CodedLinkMeta[]>();

export default () => {
	const patches: (() => void)[] = [];

	patches.push(
		patchRows((rows) => {
			for (const row of rows) {
				const pluginLinks: string[] = [];

				if (row.message) {
					if (row.message.content) iterate(pluginLinks, row.message.content);

					const cache: CodedLinkMeta[] = [];

					row.message.embeds ??= [];
					row.message.codedLinks ??= [];
					for (const plugin of pluginLinks) {
						const link = getCodedLink(plugin);
						if (!link) continue;

						const embedIndex = row.message.embeds.findIndex((embed) =>
							embed.url && trail(embed.url) === plugin
						);
						if (embedIndex !== -1) {
							row.message.embeds.splice(
								embedIndex,
								1,
							);
						}
						cache.push({
							index: row.message.codedLinks.push(
								link,
							) - 1,
							plugin,
						});
					}

					const id = row.message.id;
					if (pluginLinks[0]) {
						pluginMessageMap.set(id, {
							channelId: row.message.channelId,
							plugins: pluginLinks,
						});
					} else pluginMessageMap.delete(id);
					codedLinks.set(id, cache);
				}
			}
		}),
	);

	const patchHandlers = (handlers: any) => {
		if (handlers[patchedSymbol]) return;
		handlers[patchedSymbol] = true;

		patches.push(
			instead("handleTapInviteEmbed", handlers, (args, orig) => {
				const event = args[0]?.nativeEvent;
				if (!event) return orig.apply(this, args);
				const { index, messageId } = event as {
					index: number;
					messageId: string;
				};

				const link = codedLinks.get(messageId)?.find((meta) => meta.index === index);
				if (!link) return orig.apply(this, args);

				runPluginStateCta(link.plugin);
			}),
		);

		patches.push(() => delete handlers[patchedSymbol]);
	};

	const originalParams = Object.getOwnPropertyDescriptor(
		MessagesHandlers.prototype,
		"params",
	)!;
	const originalGetter = originalParams.get!;

	Object.defineProperty(MessagesHandlers.prototype, "params", {
		...originalParams,
		get() {
			if (this) patchHandlers(this);
			return originalGetter.call(this);
		},
	});

	patches.push(
		() => Object.defineProperty(MessagesHandlers.prototype, "params", originalParams),
	);

	return () => {
		for (const x of patches) {
			x();
		}
	};
};
