import { findByProps, findByStoreName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { IconButton } from "$/lib/redesign";
import { fluxSubscribe } from "$/types";

const SpotifyStore = findByStoreName("SpotifyStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");

const { sendMessage } = findByProps("sendMessage", "revealMessage");
// const { getDraft } = findByProps('getDraft')
// const { clearDraft } = findByProps('clearDraft')

const sendInvite = () => {
	const activity = SpotifyStore.getActivity();
	if (!activity?.party?.id) return;

	const channel = SelectedChannelStore.getChannelId();
	sendMessage(
		channel,
		{
			content: "",
			// content: getDraft(channel, 0),
			tts: false,
			invalidEmojis: [],
			validNonShortcutEmojis: [],
		},
		true,
		{
			activityAction: {
				activity,
				type: 3,
			},
		},
	);

	// clearDraft(channel, 0)
};

export default function InviteButton() {
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);
	React.useEffect(() => fluxSubscribe("SPOTIFY_PLAYER_STATE", forceUpdate));

	return (
		<IconButton
			variant="secondary"
			size="md"
			icon={getAssetIDByName("ic_spotify_white_16px")}
			disabled={!SpotifyStore.getActivity()?.party?.id}
			onPress={sendInvite}
		/>
	);
}
