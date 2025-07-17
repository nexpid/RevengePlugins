import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { before, instead } from "@vendetta/patcher";

import { RNChatModule } from "$/deps";

import type { Iterable } from "..";
import { pluginMessageMap } from "./messages";
import { getCodedLink, runPluginStateCta } from "./plugins";
import { embedWhitelist } from "./whitelist";

function trail(x: string) {
	return x.replace(/(\/)?$/, "/");
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
	const patches = new Array<() => void>();

	patches.push(
		before("updateRows", RNChatModule, args => {
			const rows = JSON.parse(args[1]);
			for (const row of rows) {
				const pluginLinks = new Array<string>();

				function iterate(thing: Iterable | Iterable[]) {
					const stuff = Array.isArray(thing) ? thing : [thing];
					for (const obj of stuff) {
						if (typeof obj.content === "string") {
							if (obj.content.startsWith(invisibleChar)) obj.content = obj.content.slice(invisibleChar.length);

							const links = obj.content.match(HTTP_REGEX_MULTI)?.map(trail) ?? [];
							for (const url of links) {
								const host = new URL(url).hostname.toLowerCase();
								if (
									embedWhitelist.hosts.some(x => x.toLowerCase() === host)
									|| embedWhitelist.domains.some(x =>
										host.endsWith(`.${x.toLowerCase()}`)
									)
								) {
									pluginLinks.push(url);
								}
							}
						} else if (
							typeof obj.content === "object"
							&& obj.content !== null
						) {
							iterate(obj.content);
						}
					}
				}

				if (row.message) {
					if (row.message.content) iterate(row.message.content);

					const cache: CodedLinkMeta[] = [];

					row.message.embeds ??= [];
					row.message.codedLinks ??= [];
					for (const plugin of pluginLinks) {
						const link = getCodedLink(plugin);
						if (!link) continue;

						const embedIndex = row.message.embeds.findIndex((embed: any) =>
							embed?.url && trail(embed.url) === plugin
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

			args[1] = JSON.stringify(rows);
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
