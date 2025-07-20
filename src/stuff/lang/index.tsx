import { getLocale } from "$/lib/intlProxy";
import { fluxSubscribe } from "$/types";
import { findByName } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import type LangValues from "../../../lang/defs";
import { useLangStore } from "./LangStore";

// from Pyoncord
const IntlMessageFormat = findByName("MessageFormat");

export class Lang<Plugin extends keyof LangValues> {
	private _unload: () => void;

	public Values: LangValues[Plugin]["values"] | undefined;

	constructor(public plugin: Plugin) {
		useLangStore.persist.setOptions({
			name: `nexpid-lang-${plugin.toString()}`,
			onRehydrateStorage: () => state => state?.update(this.plugin),
		});
		void useLangStore.persist.rehydrate();

		this._unload = fluxSubscribe(
			"I18N_LOAD_SUCCESS",
			() => void useLangStore.persist.rehydrate(),
		);
	}

	unload() {
		this._unload();
	}

	static getLang(): string {
		const lang = getLocale().replace(/-/g, "_");

		return lang.startsWith("en") ? "en" : lang;
	}

	static basicFormat(text: string): React.ReactNode {
		const rules = [
			{
				regex: /\*\*(.*?)\*\*/g,
				react: (txt: string) => <RN.Text style={{ fontWeight: "900" }}>{txt}</RN.Text>,
			},
		];

		const txt = text.split("") as (string | React.ReactNode)[];
		let off = 0;
		for (const rule of rules) {
			const matches = Array.from(text.matchAll(rule.regex));
			for (const match of matches) {
				if (match[1] && match.index) {
					txt.splice(
						match.index - off,
						match[0].length,
						rule.react(match[1]),
					);
					off += match[0].length - 1;
				}
			}
		}

		return txt;
	}

	format<Key extends keyof LangValues[Plugin]["values"]>(
		_key: Key,
		input: Key extends keyof LangValues[Plugin]["fillers"] ? LangValues[Plugin]["fillers"][Key]
			: Record<string, never>,
	): string {
		const key = _key as string;
		if (PREVIEW_LANG) return key;

		const locale = Lang.getLang();

		const { values } = useLangStore.getState();
		if (!values) return String(key);

		const val = values[locale]?.[key] ?? values.en?.[key] ?? DEFAULT_LANG?.[key];
		if (!val) return String(key);

		if (Object.keys(input as any).length > 0) {
			return new IntlMessageFormat(val).format(input);
		}
		return val;
	}
}
