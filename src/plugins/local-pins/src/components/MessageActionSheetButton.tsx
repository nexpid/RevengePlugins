import { RedesignRow } from "@nexpid/vdp-shared";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { hideActionSheet } from "$/components/ActionSheet";

import { addPin, hasPin, removePin } from "..";

export default function(message: {
	channel_id: string;
	id: string;
	author: { globalName?: string; username: string };
	nick?: string;
}) {
	const isPinned = hasPin(message.channel_id, message.id);

	return (
		<RedesignRow
			label={isPinned ? "Unpin Message Locally" : "Pin Message Locally"}
			icon={getAssetIDByName("PinIcon")}
			onPress={() => {
				if (isPinned) {
					removePin(message.channel_id, message.id);
					showToast(
						`Unpinned ${
							message.nick
								?? message.author.globalName
								?? message.author.username
						}'s message locally`,
						getAssetIDByName("PinIcon"),
					);
				} else {
					addPin(message.channel_id, message.id);
					showToast(
						`Pinned ${
							message.nick
								?? message.author.globalName
								?? message.author.username
						}'s message locally`,
						getAssetIDByName("PinIcon"),
					);
				}
				hideActionSheet();
			}}
		/>
	);
}
