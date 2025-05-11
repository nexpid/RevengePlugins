import { ReactNative as RN } from "@vendetta/metro/common";
import rawEmojiRegex from "twemoji-parser/dist/lib/regex";

import { type lang, vstorage } from "..";
const emojiRegex = new RegExp(`(${rawEmojiRegex.source})`, rawEmojiRegex.flags);

export interface EmojiPack {
	title: keyof NonNullable<typeof lang.Values>;
	format: (src: string) => string;
	noVariation?: boolean;
}

export const normalPacks = {
	default: {
		get title() {
			return RN.Platform.select({
				default: "settings.emojipacks.choose.default",
				ios: "settings.emojipacks.choose.default.ios",
			}) as any;
		},
		format: src => `asset:/emoji-${src}.png`,
	},
	twemoji: {
		title: "settings.emojipacks.choose.twemoji",
		format: src =>
			`https://raw.githubusercontent.com/jdecked/twemoji/main/assets/72x72/${src}.png`,
		noVariation: true,
	},
	fluentuiStatic: {
		title: "settings.emojipacks.choose.fluentui_static",
		format: src =>
			`https://raw.githubusercontent.com/bignutty/fluent-emoji/main/static/${src}.png`,
	},
	fluentuiAnimated: {
		title: "settings.emojipacks.choose.fluentui_animated",
		format: src =>
			`https://raw.githubusercontent.com/bignutty/fluent-emoji/main/animated-static/${src}.png`,
	},
	notoEmoji: {
		title: "settings.emojipacks.choose.noto_emoji",
		format: src =>
			`https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72/emoji_u${
				src
					.split("-")
					.map(x => x.padStart(4, "0"))
					.join("_")
			}.png`,
		noVariation: true,
	},
} satisfies Record<string, EmojiPack>;
export const sillyPacks = {
	discord: {
		title: "settings.emojipacks.choose.discord",
		format: src => `https://nexpid.github.io/DiscordEmojiPicker/assets/${src}.png`,
		noVariation: true,
	},
} satisfies Record<string, EmojiPack>;

export const emojipacks = {
	...normalPacks,
	...sillyPacks,
} as const;

export function getSrc(src: string) {
	return (
		emojipacks[vstorage.emojipack].format(src)
			?? emojipacks.default.format(src)
	);
}

export function convert(
	emoji: string,
	pack: EmojiPack = emojipacks[vstorage.emojipack],
): string {
	return Array.from(emoji)
		.map(x => x.codePointAt(0)?.toString(16))
		.filter(x => !!x && (pack.noVariation ? x !== "fe0f" : true))
		.join("-");
}

export function parse(
	text: string,
	callback: (src: string) => React.ReactNode,
): string[] {
	// since when can String.split do this???
	const children: any[] = text.split(emojiRegex);

	for (let i = 1; i < children.length; i += 2) {
		children.splice(i, 2, callback(convert(children[i])));
	}

	return children;
}
