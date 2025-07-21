import constants from "$/constants";
import { RNCacheModule, zustand, zustandMW } from "$/deps";

import type LangValues from "../../../lang/defs";

interface LangState {
	values: Record<string, Record<string, string>>;
	lastModified: string | null;
	update: (plugin: keyof LangValues) => Promise<void>;
}

export const useLangStore = zustand.create<
	LangState,
	[
		[
			"zustand/persist",
			{
				values: LangState["values"];
				lastModified: LangState["lastModified"];
			},
		],
	]
>(
	zustandMW.persist(
		(set, get) => ({
			values: {},
			lastModified: null,
			update: async (plugin: keyof LangValues) => {
				if (DEV_LANG) {
					set({
						values: DEV_LANG,
						lastModified: null,
					});
					return;
				}

				const res = await fetch(
					`${constants.github.raw}lang/values/${plugin.toString()}.json`,
					{
						headers: {
							"if-modified-since": get().lastModified as any,
						},
					},
				);
				if (!res.ok) return;

				const values = await res.json();
				set({
					lastModified: res.headers.get("last-modified"),
					values,
				});
			},
		}),
		{
			name: "nexpid-lang",
			storage: zustandMW.createJSONStorage(() => RNCacheModule),
			partialize: state => ({
				values: state.values,
				lastModified: state.lastModified,
			}),
			onRehydrateStorage: () => () => RNCacheModule.removeItem("nexpid-lang"),
		},
	),
);
