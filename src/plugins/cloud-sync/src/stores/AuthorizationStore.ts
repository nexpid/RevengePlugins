// https://github.com/decor-discord/vendetta-plugin/blob/main/src/lib/stores/AuthorizationStore.ts
import { findByStoreName } from "@vendetta/metro";
import { createJSONStorage, persist } from "zustand/middleware";

import { RNCacheModule, zustand } from "$/deps";
import { fluxSubscribe } from "$/types";

const UserStore = findByStoreName("UserStore");

interface AuthorizationState {
	token: string | undefined;
	tokens: Record<string, string | undefined>;
	init: () => void;
	setToken: (token?: string) => void;
	isAuthorized: () => boolean;
}

export const useAuthorizationStore = zustand.create<
	AuthorizationState,
	[["zustand/persist", { tokens: AuthorizationState["tokens"] }]]
>(
	persist(
		(set, get) => ({
			token: undefined,
			tokens: {},
			init() {
				set({
					token: get().tokens[UserStore.getCurrentUser()?.id],
				});
			},
			setToken(token) {
				set({
					token,
					tokens: {
						...get().tokens,
						[UserStore.getCurrentUser()?.id]: token,
					},
				});
			},
			isAuthorized: () => !!get().token,
		}),
		{
			name: "cloudsync-auth",
			storage: createJSONStorage(() => RNCacheModule),
			partialize: ({ tokens }) => ({ tokens }),
			onRehydrateStorage: () => state => state?.init(),
		},
	),
);

export const unsubAuthStore = fluxSubscribe(
	"CONNECTION_OPEN",
	() => useAuthorizationStore.persist.rehydrate(),
);
