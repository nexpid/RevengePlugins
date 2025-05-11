import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

import { ActionSheet } from "$/components/ActionSheet";
import Text from "$/components/Text";

import { clearPins, vstorage } from "../..";
import useLocalPinned from "../../hooks/useLocalPinned";
import { pinsCallback } from "../../stuff/patcher";
import FiltersActionSheet from "../sheets/FiltersActionSheet";

const ChannelPinsConnected = findByName("ChannelPinsConnected", false);

export default function ChannelPinsModal({ channelId }: { channelId: string }) {
	useProxy(vstorage);
	const { data, status, clear } = useLocalPinned(channelId);

	pinsCallback.filters = () => {
		ActionSheet.open(FiltersActionSheet, {
			defFilters: vstorage.preferFilters,
			set: fil => (vstorage.preferFilters = fil),
		});
	};
	pinsCallback.clear = () => {
		data
			&& showConfirmationAlert({
				title: "Clear local pins",
				content: `Are you sure you want to clear **${data.length}** pin${
					data.length !== 1 ? "s" : ""
				} in this channel?`,
				confirmText: "Clear",
				confirmColor: "red" as ButtonColors,
				onConfirm: () => {
					clearPins(channelId);
					clear();
				},
				isDismissable: true,
			});
	};
	pinsCallback.overrides[channelId] = ({ messages }) => [
		...(vstorage.preferFilters.includes("local") && data
			? data.map(x => x.message)
			: []),
		...(vstorage.preferFilters.includes("server") ? messages : []),
	];

	return Array.isArray(data)
		? <ChannelPinsConnected.default channelId={channelId} />
		: (
			<RN.View
				style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
			>
				<RN.ActivityIndicator size="large" style={{ marginBottom: 10 }} />
				<Text variant="text-lg/semibold" color="TEXT_NORMAL" align="center">
					{Math.floor(status * 100)}%
				</Text>
			</RN.View>
		);
}
