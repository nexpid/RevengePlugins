import { findByProps } from "@vendetta/metro";
import { ReactNative as RN, url } from "@vendetta/metro/common";
import { before, instead } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { LazyActionSheet } from "$/components/ActionSheet";
import intlProxy from "$/lib/intlProxy";

import { Module, ModuleCategory } from "../stuff/Module";

const MediaManager = findByProps("downloadMediaAsset");

const showContextMenu = findByProps("showContextMenu");
const handleClick = findByProps("handleClick", "isLinkTrusted");

const parseURL = (url: string) => {
	const path = url.split("/");
	const tenorIndex = path.findIndex(x => x.endsWith(".tenor.com"));
	if (tenorIndex === -1) return url;

	const [host, id, file] = path.slice(tenorIndex, tenorIndex + 3);
	if (!host || !id || !file) return url;

	return `https://${host}/${id.slice(0, -2)}AC/${file.split(".")[0]}.gif`;
};

export default new Module({
	id: "tenor-gif-fix",
	label: "Tenor GIF Fix",
	sublabel: "Downloads Tenor links as GIFs instead of videos",
	category: ModuleCategory.Fixes,
	icon: getAssetIDByName("GifIcon"),
	handlers: {
		onStart() {
			// STUB[epic=plugin] older versions
			this.patches.add(
				before("downloadMediaAsset", MediaManager, args => {
					const url = args[0];
					if (!url || typeof url !== "string") return;

					const parsed = parseURL(url);
					if (parsed) {
						args[0] = parsed;
						args[1] = 1;
					}
				}),
			);

			this.patches.add(
				before("openLazy", LazyActionSheet, ctx => {
					const [_, action, args] = ctx;

					if (action !== "MediaShareActionSheet") return;

					const data = args?.syncer?.sources?.[0];
					if (!data || typeof data.uri !== "string") return;

					const parsed = parseURL(data.uri);
					if (parsed) {
						data.uri = parsed;
						data.sourceURI = parsed;
						data.videoURI = undefined;
						data.isGIFV = undefined;
					}

					args.syncer.sources[0] = data;
				}),
			);

			// newer versions
			this.patches.add(
				before("showContextMenu", showContextMenu, args => {
					const [{ items }] = args as [
						{
							items: {
								iconSource: number;
								label: string;
								action: () => void;
								_action?: () => void;
							}[];
						},
					];
					if (
						!["OPEN_IN_BROWSER", "SHARE", "JUMP_TO_MESSAGE"].every(
							x => items.find(y => y.label === intlProxy[x]),
						)
						|| items.length !== 3
					) {
						return;
					}

					let link: string;
					for (const item of items) {
						if (!item._action) item._action = item.action;

						if (item.label === intlProxy.OPEN_IN_BROWSER) {
							// fake press to get the link
							const unpatch = instead(
								"handleClick",
								handleClick,
								args => {
									link = parseURL(args[0].href);
									unpatch();
								},
							);
							item._action();

							item.action = () => {
								if (!link) {
									item._action?.();
									return;
								}
								handleClick.handleClick({
									href: link,
									onConfirm: () => url.openURL(link),
								});
							};
						} else if (item.label === intlProxy.SHARE) {
							item.action = () => {
								if (!link) {
									item._action?.();
									return;
								}
								RN.Share.share({ message: link });
							};
						}
					}

					items.unshift({
						iconSource: getAssetIDByName("DownloadIcon"),
						label: intlProxy.SAVE,
						action: () =>
							link
								? MediaManager.downloadMediaAsset(link, 1)
								: showToast(
									"Failed to download gif using NexxUtils",
									getAssetIDByName("CircleXIcon-primary"),
								),
					});
				}),
			);
		},
		onStop() {},
	},
});
