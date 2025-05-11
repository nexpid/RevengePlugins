import { findByName, findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";

import { LazyActionSheet } from "$/components/ActionSheet";
import SuperAwesomeIcon from "$/components/SuperAwesomeIcon";
import intlProxy from "$/lib/intlProxy";
import type { SearchContext } from "$/types";

import ChannelPinsRow from "../components/ChannelPinsRow";
import PinMessageLocallyAction from "../components/MessageActionSheetButton";
import ChannelPinsModal from "../components/modals/ChannelPinsModal";
import RedesignChannelPinsRow from "../components/RedesignChannelPinsRow";
import PinsScreen from "../components/screens/PinsScreen";

const ChannelSettingsModal = findByName("ChannelSettingsModal", false);
const ChannelPinsConnected = findByName("ChannelPinsConnected", false);
const screens = findByProps("MessagesScreen", "MessageContentScreen");
const { useOnPressSearchItem } = findByProps("useOnPressSearchItem");
const { FlashList } = findByProps("FlashList");

const PrivateChannels = findByName("ConnectedPrivateChannels", false);

export const pinsCallback: {
	filters?: () => void;
	clear?: () => void;
	overrides: Record<
		string,
		(data: {
			messages: any[];
			searchContext?: SearchContext;
			press?: (channelId: string, messageId: string) => void;
		}) => any[]
	>;
} = {
	overrides: {},
};

export default function() {
	const patches = new Array<() => void>();

	patches.push(
		after("default", ChannelPinsConnected, (_, pins) => {
			const { channelId, loaded, messages } = pins.props;
			return {
				...pins,
				props: {
					...pins.props,
					messages: loaded && messages
						? (pinsCallback.overrides[channelId]({
							messages,
						}) ?? messages)
						: messages,
				},
			};
		}),
	);

	if (screens.MessagesScreen && useOnPressSearchItem) {
		patches.push(
			after(
				"MessagesScreen",
				screens,
				([{ searchContext, tab }], ret) => {
					if (tab === "pins") {
						const { channelId } = searchContext;
						React.useEffect(
							() => () => {
								unpatch();
							},
							[],
						);

						const press = useOnPressSearchItem(searchContext);
						const unpatch = before("type", ret, ([x]) => {
							if (x?.data) {
								x.data = pinsCallback.overrides[channelId]({
									messages: x.data,
									searchContext,
									press,
								}) ?? x.data;
							}
						});

						return React.createElement(PinsScreen, {
							channelId: searchContext.channelId,
							ret,
						});
					}
				},
			),
		);
	}
	patches.push(
		after("default", ChannelSettingsModal, (_, navigator) => {
			const { screens } = navigator.props;

			screens.PINNED_MESSAGES.headerRight = () =>
				React.createElement(
					RN.View,
					{
						style: { flexDirection: "row-reverse" },
					},
					React.createElement(SuperAwesomeIcon, {
						icon: getAssetIDByName("FiltersHorizontalIcon"),
						style: "header",
						onPress: () => pinsCallback.filters?.(),
					}),
					React.createElement(SuperAwesomeIcon, {
						icon: getAssetIDByName("TrashIcon"),
						style: "header",
						destructive: true,
						onPress: () => pinsCallback.clear?.(),
					}),
				);

			patches.push(
				after(
					"render",
					screens.PINNED_MESSAGES,
					(_, ret) =>
						React.createElement(ChannelPinsModal, {
							channelId: ret.props.channelId,
						}),
				),
			);
		}),
	);

	patches.push(
		before("openLazy", LazyActionSheet, ([component, key, msg]) => {
			const message = msg?.message;
			if (key !== "MessageLongPressActionSheet" || !message) return;

			component.then(i => {
				const unp = after("default", i, (_, comp) => {
					React.useEffect(
						() => () => {
							unp();
						},
						[],
					);

					const buttons = findInReactTree(
						comp,
						x => x[0]?.type?.name === "ButtonRow",
					);
					if (!buttons) return comp;

					const at = Math.max(
						buttons.findIndex(
							x => x.props.message === intlProxy.MARK_UNREAD,
						),
						0,
					);
					buttons.splice(
						at,
						0,
						React.createElement(PinMessageLocallyAction, message),
					);
				});
			});
		}),
	);

	if (FlashList) {
		patches.push(
			after(
				"render",
				FlashList,
				([d], ret) =>
					d.accessibilityLabel === intlProxy.HAPPENING_NOW
						? React.createElement(RedesignChannelPinsRow, { ret })
						: ret,
			),
		);
	}

	// patches.push(
	//   after("default", FastList, ([d], ret) =>
	//     d.accessibilityLabel === intlProxy.DIRECT_MESSAGES
	//       ? React.createElement(MessagesPinsRow, { ret })
	//       : ret,
	//   ),
	// );

	let privatePatched = false;
	patches.push(
		after("default", PrivateChannels, (_, res) => {
			if (privatePatched) return;
			privatePatched = true;

			patches.push(
				after("render", res.type.prototype, (_, list) => {
					const children = findInReactTree(
						list,
						x => x.find((y: any) => y.type?.name === "FastList"),
					);
					if (!children) return;

					children.splice(
						1,
						0,
						React.createElement(ChannelPinsRow, {}),
					);
				}),
			);
		}),
	);

	return () => {
		for (const x of patches) {
			x();
		}
	};
}
