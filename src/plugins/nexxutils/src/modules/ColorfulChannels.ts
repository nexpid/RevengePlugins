import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { semanticColors } from "@vendetta/ui";
import { getAssetByID, getAssetIDByName } from "@vendetta/ui/assets";

import TextBadge from "$/components/TextBadge";

import { resolveSemanticColor } from "../../../../stuff/types";
import lockAnnouncements from "../../assets/ColorfulChannels/announcement/lock.png";
import warningAnnouncements from "../../assets/ColorfulChannels/announcement/warning.png";
import lockForum from "../../assets/ColorfulChannels/forum/lock.png";
import warningForum from "../../assets/ColorfulChannels/forum/warning.png";
import lockImage from "../../assets/ColorfulChannels/image/lock.png";
import warningImage from "../../assets/ColorfulChannels/image/warning.png";
import lock from "../../assets/ColorfulChannels/lock.png";
import lockBottom from "../../assets/ColorfulChannels/lockBottom.png";
import lockStage from "../../assets/ColorfulChannels/stage/lock.png";
import lockText from "../../assets/ColorfulChannels/text/lock.png";
import warningText from "../../assets/ColorfulChannels/text/warning.png";
import lockVoice from "../../assets/ColorfulChannels/voice/lock.png";
import warningVoice from "../../assets/ColorfulChannels/voice/warning.png";
import warning from "../../assets/ColorfulChannels/warning.png";
import warningBottom from "../../assets/ColorfulChannels/warningBottom.png";
import { Module, ModuleCategory } from "../stuff/Module";

const locks = [
	["Announcements", lockAnnouncements],
	["Text", lockText],
	["Voice", lockVoice],
	["Forum", lockForum],
	["Stage", lockStage, true],
	["Image", lockImage, true],
] as const;
const warnings = [
	["Announcements", warningAnnouncements],
	["Text", warningText],
	["Voice", warningVoice],
	["Forum", warningForum], // discord fix yo shit this is unused
	// stage channels don't have a nsfw icon?,
	["Image", warningImage, true],
] as const;

const ChannelInfo = findByName("ChannelInfo", false);

export default new Module({
	id: "colorful-channels",
	label: "Colorful Channels",
	sublabel: "Makes channel icons with symbols more colorful",
	category: ModuleCategory.Useful,
	icon: getAssetIDByName("LockIcon"),
	settings: {
		nsfwTag: {
			label: "NSFW tag",
			subLabel: "Adds a red NSFW tag next to channel names",
			type: "toggle",
			default: true,
		},
		colorIcons: {
			label: "Colored icon symbols",
			subLabel: "Turns locked channel symbols yellow, NSFW channel symbols red",
			type: "toggle",
			default: true,
		},
		colorIconsFallback: {
			label: "Fallback colors for colored icon symbols",
			subLabel: "Uses yellow and red colors regardless of theme",
			type: "toggle",
			default: false,
		},
	},
	handlers: {
		onStart() {
			if (this.storage.options.nsfwTag) {
				this.patches.add(
					after("default", ChannelInfo, ([{ channel }], ret) =>
						React.createElement(
							React.Fragment,
							{},
							channel.nsfw_
								&& React.createElement(
									TextBadge,
									{ variant: "danger" },
									"nsfw",
								),
							ret,
						)),
				);
			}

			this.patches.add(
				after("render", RN.Image, ([{ source, style }]) => {
					const name = typeof source?.original === "number"
						? getAssetByID(source.original)?.name
						: typeof source === "number"
						? getAssetByID(source)?.name
						: null;
					if (!name) return;

					const warninger = warnings.find(
						([x]) => name === `${x}WarningIcon`,
					);
					const locker = locks.find(([x]) => name === `${x}LockIcon`);

					const img = warninger
						? {
							base: warninger[1],
							overlay: warninger[2] ? warningBottom : warning,
							color: this.storage.options.colorIconsFallback
								? "#f23f43"
								: resolveSemanticColor(
									semanticColors.STATUS_DANGER,
								),
						}
						: locker
						? {
							base: locker[1],
							overlay: locker[2] ? lockBottom : lock,
							color: this.storage.options.colorIconsFallback
								? "#f0b232"
								: resolveSemanticColor(
									semanticColors.STATUS_WARNING,
								),
						}
						: null;

					if (img) {
						return React.createElement(
							RN.View,
							{},
							React.createElement(RN.Image, {
								style: RN.StyleSheet.flatten(style),
								source: img.base,
							}),
							React.createElement(
								RN.View,
								{
									style: {
										position: "absolute",
										right: 0,
										bottom: 0,
									},
								},
								React.createElement(RN.Image, {
									style: {
										...RN.StyleSheet.flatten(style),
										tintColor: img.color,
									},
									source: img.overlay,
								}),
							),
						);
					}
				}),
			);
		},
		onStop() {},
	},
});
