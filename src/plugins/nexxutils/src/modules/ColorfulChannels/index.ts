import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { semanticColors } from "@vendetta/ui";
import { getAssetByID, getAssetIDByName } from "@vendetta/ui/assets";

import TextBadge from "$/components/TextBadge";

import { resolveSemanticColor } from "$/types";
import announcementLock from "../../../assets/ColorfulChannels/announcement/lock.png";
import announcementWarning from "../../../assets/ColorfulChannels/announcement/warning.png";
import controller from "../../../assets/ColorfulChannels/controller.png";
import forumLock from "../../../assets/ColorfulChannels/forum/lock.png";
import forumWarning from "../../../assets/ColorfulChannels/forum/warning.png";
import imageLock from "../../../assets/ColorfulChannels/image/lock.png";
import imageWarning from "../../../assets/ColorfulChannels/image/warning.png";
import lock from "../../../assets/ColorfulChannels/lock.png";
import lockBottom from "../../../assets/ColorfulChannels/lockBottom.png";
import stageLock from "../../../assets/ColorfulChannels/stage/lock.png";
import textController from "../../../assets/ColorfulChannels/text/controller.png";
import textLock from "../../../assets/ColorfulChannels/text/lock.png";
import textWarning from "../../../assets/ColorfulChannels/text/warning.png";
import voiceLock from "../../../assets/ColorfulChannels/voice/lock.png";
import voiceWarning from "../../../assets/ColorfulChannels/voice/warning.png";
import warning from "../../../assets/ColorfulChannels/warning.png";
import warningBottom from "../../../assets/ColorfulChannels/warningBottom.png";
import { Module, ModuleCategory } from "../../stuff/Module";
import dark from "./dark.png";
import light from "./light.png";

enum GlyphKind {
	Lock = "Lock",
	Warning = "Warning",
	Controller = "Controller",
}

function getGlyphOverlay(kind: GlyphKind, bottom?: boolean) {
	if (kind === GlyphKind.Lock) return bottom ? lockBottom : lock;
	if (kind === GlyphKind.Warning) return bottom ? warningBottom : warning;
	if (kind === GlyphKind.Controller) return controller;
}

const glyphColors = {
	[GlyphKind.Lock]: [
		"#f0b232",
		semanticColors.STATUS_WARNING,
	],
	[GlyphKind.Warning]: [
		"#f23f43",
		semanticColors.STATUS_DANGER,
	],
	[GlyphKind.Controller]: [
		"#23a55a",
		semanticColors.STATUS_POSITIVE,
	],
} satisfies Record<GlyphKind, [fallback: string, semantic: string]>;

const glyphs = [
	// Announcements
	{
		name: "Announcements",
		kind: GlyphKind.Lock,
		base: announcementLock,
	},
	{
		name: "Announcements",
		kind: GlyphKind.Warning,
		base: announcementWarning,
	},

	// Text
	{
		name: "Text",
		kind: GlyphKind.Lock,
		base: textLock,
	},
	{
		name: "Text",
		kind: GlyphKind.Warning,
		base: textWarning,
	},
	{
		name: "Text",
		kind: GlyphKind.Controller,
		base: textController,
	},

	// Voice
	{
		name: "Voice",
		kind: GlyphKind.Lock,
		base: voiceLock,
	},
	{
		name: "Voice",
		kind: GlyphKind.Warning,
		base: voiceWarning,
	},

	// Forum (warning is unused)
	{
		name: "Forum",
		kind: GlyphKind.Lock,
		base: forumLock,
	},
	{
		name: "Forum",
		kind: GlyphKind.Warning,
		base: forumWarning,
	},

	// Stage (warning doesnt exist)
	{
		name: "Stage",
		kind: GlyphKind.Lock,
		bottom: true,
		base: stageLock,
	},
	{ name: "Stage", kind: GlyphKind.Warning, bottom: true, base: 0 },

	// Image
	{
		name: "Image",
		kind: GlyphKind.Lock,
		bottom: true,
		base: imageLock,
	},
	{
		name: "Image",
		kind: GlyphKind.Warning,
		bottom: true,
		base: imageWarning,
	},
];

const ChannelInfo = findByName("ChannelInfo", false);

export default new Module({
	id: "colorful-channels",
	label: "Colorful Channels",
	meta: {
		sublabel: "Gives channel icons with symbols colors to make them more aesthetically pleasing",
		category: ModuleCategory.Useful,
		icon: getAssetIDByName("LockIcon"),
		thumbnail: {
			dark,
			light,
		},
	},
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
			subLabel: "Uses yellow, red and green colors regardless of theme",
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
									{ variant: "destructive" },
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

					const glyph = glyphs.find(x => name === `${x.name}${x.kind}Icon`);
					if (!glyph) return;

					const color = glyphColors[glyph.kind];
					const overlay = getGlyphOverlay(glyph.kind, glyph.bottom);

					return React.createElement(
						RN.View,
						{},
						React.createElement(RN.Image, {
							style: RN.StyleSheet.flatten(style),
							source: glyph.base,
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
									tintColor: this.storage.options.colorIconsFallback
										? color[0]
										: resolveSemanticColor(color[1]),
								},
								source: overlay,
							}),
						),
					);
				}),
			);
		},
		onStop() {},
	},
});
