import emojiRegex from "emoji-regex";
import { vstorage } from "..";
import { type EmojiPack, emojiPacks } from "./packs";

const rawRegex = emojiRegex();
const regex = new RegExp(`(${rawRegex.source})`, rawRegex.flags);

export function getSrc(src: string) {
	return getPack().format(src);
}

export function getPack(): EmojiPack {
	return emojiPacks[vstorage.emojipack] ?? emojiPacks.default;
}

export function convert(
	emoji: string,
	pack: EmojiPack = getPack(),
): string {
	if (!pack.joiner) return emoji;
	let chars = Array.from(emoji).map(x => x.codePointAt(0)?.toString(16)).filter(x =>
		typeof x === "string"
	);
	if (pack.excludeVariation) chars = chars.filter((x) => x !== "fe0f");

	return chars.join(pack.joiner);
}

export function parse(
	text: string,
	callback: (src: string) => React.ReactNode,
): string[] {
	// since when can String.split do this???
	const children: any[] = text.split(regex);

	for (let i = 1; i < children.length; i += 2) {
		children.splice(i, 1, callback(convert(children[i])));
	}

	return children;
}
