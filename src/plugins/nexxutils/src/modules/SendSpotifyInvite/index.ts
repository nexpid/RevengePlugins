import { findByTypeName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { Module, ModuleCategory } from "../../stuff/Module";
import InviteButton from "./components/InviteButton";

const MediaKeyboardListHeader = findByTypeName("MediaKeyboardListHeader");

export default new Module({
	id: "send-spotify-invite",
	label: "Send Spotify invite",
	sublabel: "Adds an option to send a Spotify Listen Along invite in chat",
	category: ModuleCategory.Useful,
	icon: getAssetIDByName("img_account_sync_spotify_white"),
	handlers: {
		onStart() {
			this.patches.add(
				after("type", MediaKeyboardListHeader, (_, ret) => {
					return {
						...ret,
						props: {
							...ret.props,
							children: [
								...ret.props.children,
								React.createElement(InviteButton, {}),
							],
						},
					};
				}),
			);
		},
		onStop() {},
	},
	disabled: true,
});
