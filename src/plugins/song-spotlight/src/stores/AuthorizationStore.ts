// https://github.com/decor-discord/vendetta-plugin/blob/main/src/lib/stores/AuthorizationStore.ts
import { findByStoreName } from "@vendetta/metro";

import { RNCacheModule, zustand, zustandMW } from "$/deps";

const UserStore = findByStoreName("UserStore");

export interface Token {
	access: string;
	refresh: string;
}

interface AuthorizationState {
	tokens: Record<string, Token>;
	getToken(): Token | undefined;
	setToken(access: string, refresh: string): void;
	deleteTokens(): void;
	isAuthorized(): boolean;
}

export const useAuthorizationStore = zustand.create<
	AuthorizationState,
	[["zustand/persist", { tokens: AuthorizationState["tokens"] }]]
>(
	zustandMW.persist(
		(set, get) => ({
			tokens: {},
			getToken() {
				return get().tokens[UserStore.getCurrentUser()?.id];
			},
			setToken(access, refresh) {
				const userId = UserStore.getCurrentUser()?.id;
				if (userId) {
					set({
						tokens: {
							...get().tokens,
							[userId]: { access, refresh },
						},
					});
				}
			},
			deleteTokens() {
				set({ tokens: {} });
			},
			isAuthorized() {
				return !!get().getToken();
			},
		}),
		{
			name: "songspotlight-auth",
			version: 1,
			migrate(persisted: any, version) {
				if (version === 0) {
					persisted.tokens = Object.fromEntries(
						Object.entries(persisted.tokens).map(([userId, access]) => [userId, {
							access,
							refresh: "",
						}]),
					);
				}

				return persisted;
			},
			storage: zustandMW.createJSONStorage(() => RNCacheModule),
			partialize: ({ tokens }) => ({ tokens }),
		},
	),
);
