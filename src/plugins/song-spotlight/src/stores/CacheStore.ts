import { findByStoreName } from "@vendetta/metro";

import { RNCacheModule, zustand, zustandMW } from "$/deps";
import { fluxSubscribe } from "$/types";
import type { UserData } from "@song-spotlight/api/structs";

const UserStore = findByStoreName("UserStore");

interface CacheState {
	data: UserData | undefined;
	at: string | undefined;
	dir: Record<
		string,
		{
			data: UserData | undefined;
			at: string | undefined;
		}
	>;
	init: () => void;
	updateData: (userId: null | string, data?: UserData, at?: string) => void;
	hasData: () => boolean;
}

export const useCacheStore = zustand.create<
	CacheState,
	[["zustand/persist", { dir: CacheState["dir"] }]]
>(
	zustandMW.persist(
		(set, get) => ({
			data: undefined,
			at: undefined,
			dir: {},
			init() {
				const { data, at } = get().dir[UserStore.getCurrentUser()?.id] ?? {};
				set({ data, at });
			},
			updateData(userId, data, at) {
				const you = UserStore.getCurrentUser()?.id;
				if (!userId || userId === you) {
					set({
						data,
						at,
						dir: {
							...get().dir,
							[userId ?? you]: {
								data,
								at,
							},
						},
					});
				} else set({ dir: { ...get().dir, [userId]: { data, at } } });
			},
			hasData: () => !!get().data && !!get().at,
		}),
		{
			version: 2,
			name: "songspotlight-cache",
			storage: zustandMW.createJSONStorage(() => RNCacheModule),
			partialize: ({ dir }) => ({ dir }),
			onRehydrateStorage: () => state => state?.init(),
		},
	),
);

export const unsubCacheStore = fluxSubscribe("CONNECTION_OPEN", () => {
	useCacheStore.persist.rehydrate();
});
