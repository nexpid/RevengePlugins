import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import Text from "$/components/Text";

import { vstorage } from "../..";
import useLocalPinned from "../../hooks/useLocalPinned";
import { pinsCallback } from "../../stuff/patcher";

const { useSearchResultsQuery } = findByProps("useSearchResultsQuery");

export default function PinsScreen({
	channelId,
	ret,
}: {
	channelId: string;
	ret: any;
}) {
	useProxy(vstorage);
	const { status, data } = useLocalPinned(channelId);

	pinsCallback.overrides[channelId] = ({
		messages,
		searchContext,
		press,
	}) => {
		const query = useSearchResultsQuery(searchContext);
		return [
			...(data
				? data
					.filter(x =>
						x.message.content.match(
							new RegExp(
								`\\B${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\B`,
								"u",
							),
						)
					)
					.map(({ message, channelId }) => ({
						type: "message",
						props: {
							searchContext,
							message,
							onPress: () => press?.(channelId, message.id),
							highlighter: (something: any) => something,
							lineClamp: 10,
						},
					}))
				: []),
			...messages,
		];
	};

	return data ? ret : (
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
