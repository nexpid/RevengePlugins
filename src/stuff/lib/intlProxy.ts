// a drop-in replacement for i18n
// https://github.com/discord/discord-intl

import { findByProps } from "@vendetta/metro";
import { i18n } from "@vendetta/metro/common";

const { intl, t: intlMap } = findByProps("intl") ?? {};
const { runtimeHashMessageKey } = findByProps("runtimeHashMessageKey") ?? {};

export function getLocale() {
	const lang = intl?.currentLocale ?? i18n.getLocale?.() ?? "en";
	return lang;
}

const isUsingi18n = !!i18n.Messages.DISCORD || !intl || !intlMap
	|| !runtimeHashMessageKey;

const _messages = {} as Record<string, string>;
const intlProxy = Object.freeze(
	new Proxy(_messages, {
		get(trg, prop, receiv) {
			const key = prop.toString();
			if (key in _messages) return Reflect.get(trg, key, receiv);

			if (isUsingi18n) return (_messages[key] = i18n.Messages[key]);

			const hash = runtimeHashMessageKey(key);
			try {
				return (_messages[key] = intl.string(intlMap[hash]));
			} catch (e) {
				console.warn(
					`intlProxy: Failed to get intl message for key: ${key} (${hash})`,
					e,
				);
				return (_messages[key] = "");
			}
		},
	}),
);

const _format = {} as Record<string, (values: Record<string, string>) => string>;
export const intlFormat = Object.freeze(
	new Proxy(_format, {
		get(trg, prop, receiv) {
			const key = prop.toString();
			if (key in _format) return Reflect.get(trg, key, receiv);

			if (isUsingi18n) {
				return (_format[key] = typeof i18n.Messages[key] === "string"
					? () => i18n.Messages[key]
					: i18n.Messages[key].format);
			}

			const hash = runtimeHashMessageKey(key);
			try {
				return (_format[key] = values => intl.format(intlMap[hash], values));
			} catch (e) {
				console.warn(
					`intlFormat: Failed to get intl format message for key: ${key} (${hash})`,
					e,
				);
				return (_format[key] = () => "");
			}
		},
	}),
);

export default intlProxy;
