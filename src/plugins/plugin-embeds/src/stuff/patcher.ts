import { constants } from "@vendetta";
import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { before, instead } from "@vendetta/patcher";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { RNChatModule } from "$/deps";

import type { Iterable } from "..";
import { pluginMessageCache, updateMessages } from "./messages";
import { getCodedLink } from "./plugins";

const codedLinksCache = {} as Record<string, Record<number, string>>;
const { MessagesHandlers } = findByProps("MessagesHandlers");

export default () => {
	const patches = new Array<() => void>();

	patches.push(
		before("updateRows", RNChatModule, args => {
			const rows = JSON.parse(args[1]);
			for (const row of rows) {
				const plugins = new Array<string>();

				const iterate = (thing: Iterable | Iterable[]) => {
					for (const x of Array.isArray(thing) ? thing : [thing]) {
						if (typeof x.content === "string") {
							for (
								const url of x.content.match(
									HTTP_REGEX_MULTI,
								) ?? []
							) {
								if (
									[
										constants.PROXY_PREFIX,
										"https://vendetta.nexpid.xyz/", // :3
										/^https?:\/\/\w+\.github\.io\//i,
									].some(x =>
										x instanceof RegExp
											? x.test(url.toLowerCase())
											: url
												.toLowerCase()
												.startsWith(x.toLowerCase())
									)
								) {
									plugins.push(
										!url.endsWith("/") ? `${url}/` : url,
									);
								}
							}
						} else if (
							typeof x.content === "object"
							&& x.content !== null
						) {
							iterate(x.content);
							return;
						}
					}
				};

				if (row.message) {
					if (row.message.content) iterate(row.message.content);

					for (
						const [plug, ids] of Object.entries(
							pluginMessageCache,
						)
					) {
						if (
							ids.find(x => x[0] === row.message.id)
							&& !plugins.includes(plug)
						) {
							ids.length === 1
								? delete pluginMessageCache[plug]
								: (pluginMessageCache[plug] = ids.filter(
									x => x[0] !== row.message.id,
								));
						}
					}

					if (plugins[0]) codedLinksCache[row.message.id] = {};
					for (const plugin of plugins) {
						pluginMessageCache[plugin] ??= [];
						if (
							!pluginMessageCache[plugin].find(
								x => x[0] === row.message.id,
							)
						) {
							pluginMessageCache[plugin].push([
								row.message.id,
								row.message.channelId,
							]);
						}

						row.message.codedLinks ??= [];
						codedLinksCache[row.message.id][
							row.message.codedLinks.push(getCodedLink(plugin))
							- 1
						] = plugin;
					}
				}
			}

			args[1] = JSON.stringify(rows);
		}),
	);

	const patchHandlers = (handlers: any) => {
		if (handlers.__ple_patched) return;
		handlers.__ple_patched = true;

		if (
			Object.prototype.hasOwnProperty.call(
				handlers,
				"handleTapInviteEmbed",
			)
		) {
			patches.push(
				instead("handleTapInviteEmbed", handlers, (args, orig) => {
					const [
						{
							nativeEvent: { index, messageId },
						},
					] = args;
					const plugin = codedLinksCache[messageId][index];
					if (!plugin) return orig.call(this, ...args);

					const has = !!plugins[plugin];
					if (has) {
						try {
							removePlugin(plugin);
						} catch (e) {
							console.log(e);
							showToast(
								"Failed to uninstall plugin!",
								getAssetIDByName("CircleXIcon-primary"),
							);
						}
						updateMessages(plugin, false);
					} else {
						updateMessages(plugin, true);
						installPlugin(plugin)
							.then(() => {
								showToast(
									`Successfully installed ${plugins[plugin].manifest.name}.`,
									getAssetIDByName("CircleCheckIcon-primary"),
								);
							})
							.catch(e => {
								console.log(e);
								showToast(
									"Failed to install plugin!",
									getAssetIDByName("CircleXIcon-primary"),
								);
							})
							.finally(() => {
								updateMessages(plugin, false);
							});
					}
				}),
			);
		}

		patches.push(() => (handlers.__ple_patched = false));
	};

	const origGetParams = Object.getOwnPropertyDescriptor(
		MessagesHandlers.prototype,
		"params",
	)?.get;

	origGetParams
		&& Object.defineProperty(MessagesHandlers.prototype, "params", {
			configurable: true,
			get() {
				if (this) patchHandlers(this);
				return origGetParams.call(this);
			},
		});

	patches.push(
		() =>
			origGetParams
			&& Object.defineProperty(MessagesHandlers.prototype, "params", {
				configurable: true,
				get: origGetParams,
			}),
	);

	return () => {
		for (const x of patches) {
			x();
		}
	};
};
