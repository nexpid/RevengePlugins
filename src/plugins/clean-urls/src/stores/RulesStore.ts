import { createJSONStorage, persist } from "zustand/middleware";

import { RNCacheModule, zustand } from "$/deps";
import { fluxSubscribe } from "$/types";

import { listUrl } from "..";

export interface RulesType {
	providers: Record<
		string,
		{
			urlPattern?: string;
			rules?: string[];
			rawRules?: string[];
			referralMarketing?: string[];
			exceptions?: string[];
			redirections?: string[];
		}
	>;
}

interface RulesState {
	rules: RulesType | null;
	lastModified: string | null;
	update: () => Promise<void>;
}

export const useRulesStore = zustand.create<
	RulesState,
	[
		[
			"zustand/persist",
			{
				rules: RulesState["rules"];
				lastModified: RulesState["lastModified"];
			},
		],
	]
>(
	persist(
		(set, get) => ({
			rules: null,
			lastModified: null,
			update: async () => {
				const res = await fetch(listUrl, {
					headers: {
						"if-modified-since": get().lastModified,
					} as any,
				});
				if (!res.ok) return;

				const rules = await res.json();
				set({ rules, lastModified: res.headers.get("last-modified") });
			},
		}),
		{
			name: "clean-urls-rules",
			storage: createJSONStorage(() => RNCacheModule),
			partialize: state => ({
				rules: state.rules,
				lastModified: state.lastModified,
			}),
			onRehydrateStorage: () => state => state?.update(),
		},
	),
);

// update rules when user has internet
export const unsubRulesStore = fluxSubscribe(
	"CONNECTION_OPEN",
	() => useRulesStore.getState().update(),
);
