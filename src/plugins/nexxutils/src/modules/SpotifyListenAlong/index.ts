import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { Module, ModuleCategory } from "../../stuff/Module";
import ClassicListenButton from "./components/ClassicListenButton";
import SimplifiedListenButton from "./components/SimplifiedListenButton";

const { SpotifyPlayButton } = findByProps("SpotifyPlayButton");
const PlayOnSpotifyButton = findByProps("PlayOnSpotifyButton");

export default new Module({
	id: "spotify-listen-along",
	label: "Add Listen Along",
	sublabel: "Adds a Listen Along button to Spotify activites",
	category: ModuleCategory.Useful,
	icon: getAssetIDByName("MusicIcon"),
	extra: {
		credits: ["1001086404203389018"],
	},
	handlers: {
		onStart() {
			this.patches.add(
				after(
					"render",
					SpotifyPlayButton.prototype,
					(
						_,
						{
							props: button,
							_owner: {
								stateNode: {
									props: { activity },
								},
							},
						},
					) =>
						React.createElement(ClassicListenButton, {
							button,
							activity,
						}),
				),
			);
			this.patches.add(
				after(
					"PlayOnSpotifyButton",
					PlayOnSpotifyButton,
					([{ activity }], button) =>
						React.createElement(SimplifiedListenButton, {
							button,
							activity,
						}),
				),
			);
		},
		onStop() {},
	},
});
