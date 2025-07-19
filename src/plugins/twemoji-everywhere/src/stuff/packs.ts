import { ReactNative } from "@vendetta/metro/common";
import type { lang } from "..";

export interface EmojiPack {
	title: keyof NonNullable<typeof lang.Values>;
	format: (src: string) => string;
	joiner?: string;
	maintainer?: string;
	source?: string;
	excludeVariation?: boolean;
}

export const normalPacks = {
	default: {
		get title() {
			return ReactNative.Platform.select({
				default: "settings.emojipacks.choose.default",
				ios: "settings.emojipacks.choose.default.apple",
			}) as any;
		},
		format: src => `asset:/emoji-${src}.png`,
		joiner: "-",
	},
	twemoji: {
		title: "settings.emojipacks.choose.twemoji",
		format: src =>
			`https://raw.githubusercontent.com/jdecked/twemoji/main/assets/72x72/${src}.png`,
		joiner: "-",
		maintainer: "jdecked",
		source: "https://github.com/jdecked/twemoji",
		excludeVariation: true,
	},
	facebook: {
		title: "settings.emojipacks.choose.facebook",
		format: src =>
			`https://raw.githubusercontent.com/iamcal/emoji-data/refs/heads/master/img-facebook-64/${src}.png`,
		joiner: "-",
		maintainer: "iamcal",
		source: "https://github.com/iamcal/emoji-data",
	},
	fluent: {
		title: "settings.emojipacks.choose.fluent",
		format: src =>
			`https://raw.githubusercontent.com/bignutty/fluent-emoji/main/static/${src}.png`,
		joiner: "-",
		maintainer: "big nutty",
		source: "https://github.com/bignutty/fluent-emoji",
	},
	huawei: {
		title: "settings.emojipacks.choose.huawei",
		format: src => `https://emoji-cdn.mqrio.dev/${encodeURIComponent(src)}?style=huawei`,
		maintainer: "oddmario",
		source: "https://github.com/oddmario/emoji-cdn",
	},
	joypixels: {
		title: "settings.emojipacks.choose.joypixels",
		format: src =>
			`https://raw.githubusercontent.com/joypixels/emoji-assets/master/png/64/${src}.png`,
		joiner: "-",
		maintainer: "JoyPixels",
		source: "https://github.com/joypixels/emoji-assets",
		excludeVariation: true,
	},
	noto: {
		title: "settings.emojipacks.choose.noto",
		format: src =>
			`https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72/emoji_u${
				src
					.split("_")
					.map(x => x.padStart(4, "0"))
					.join("_")
			}.png`,
		joiner: "_",
		maintainer: "Google",
		source: "https://github.com/googlefonts/noto-emoji",
		excludeVariation: true,
	},
	samsung: {
		title: "settings.emojipacks.choose.samsung",
		format: src => `https://emoji-cdn.mqrio.dev/${encodeURIComponent(src)}?style=samsung`,
		maintainer: "oddmario",
		source: "https://github.com/oddmario/emoji-cdn",
	},
	apple: {
		title: "settings.emojipacks.choose.apple",
		format: src =>
			`https://raw.githubusercontent.com/zhdsmy/apple-emoji/ios-17.4/png/160/emoji_u${src}.png`,
		joiner: "_",
		maintainer: "zhdsmy",
		source: "https://github.com/zhdsmy/apple-emoji",
	},
} satisfies Record<string, EmojiPack>;

export const jokePacks = {
	discord: {
		title: "settings.jokepacks.choose.discord",
		format: src => `https://nexpid.github.io/DiscordEmojiPicker/assets/${src}.png`,
		joiner: "-",
		maintainer: "nexpid",
		source: "https://github.com/nexpid/DiscordEmojiPicker",
		excludeVariation: true,
	},
	skype: {
		title: "settings.jokepacks.choose.skype",
		format: src => `https://emoji-cdn.mqrio.dev/${encodeURIComponent(src)}?style=skype`,
		maintainer: "oddmario",
		source: "https://github.com/oddmario/emoji-cdn",
	},
} satisfies Record<string, EmojiPack>;

export const emojiPacks = {
	...normalPacks,
	...jokePacks,
};

export type Pack = keyof typeof emojiPacks;
