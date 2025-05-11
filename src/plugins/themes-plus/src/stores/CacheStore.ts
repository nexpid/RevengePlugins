import { createJSONStorage, persist } from "zustand/middleware";

import { RNCacheModule, zustand } from "$/deps";

interface CacheState {
	cache: Record<string, string>;
	isCached: (link: string) => boolean;
	writeCache: (link: string, data: any) => void;
	readCache: (link: string) => any;
}

export const useCacheStore = zustand.create<
	CacheState,
	[["zustand/persist", { cache: CacheState["cache"] }]]
>(
	persist(
		(set, get) => ({
			cache: {},
			isCached: link => !!get().cache[link],
			writeCache: (link, data) => {
				set({
					cache: { ...get().cache, [link]: JSON.stringify(data) },
				});
			},
			readCache: link => get().cache[link] ? JSON.parse(get().cache[link]) : null,
		}),
		{
			name: "themes-plus-cache",
			storage: createJSONStorage(() => RNCacheModule),
			partialize: state => ({ cache: state.cache }),
		},
	),
);
