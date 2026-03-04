import { findByStoreName } from "@vendetta/metro";

import { zustand } from "$/deps";
import type { UserData } from "@song-spotlight/api/structs";

const UserStore = findByStoreName("UserStore");

interface Data {
	data: UserData;
	at?: string;
}

interface CacheState {
	users: Record<string, Data>;
	self?: Data;
	update(props: {
		userId?: string;
		data: UserData;
		at?: string;
	}): void;
	delete(userId?: string): void;
	$refresh(): void;
}

export const useCacheStore = zustand.create<CacheState>(
	(set, get) => ({
		users: {},
		update({ userId, data, at }) {
			userId ??= UserStore.getCurrentUser()?.id;
			if (userId) {
				set({
					users: {
						...get().users,
						[userId]: { data, at },
					},
				});
			}
			get().$refresh();
		},
		delete(userId) {
			userId ??= UserStore.getCurrentUser()?.id;
			if (userId) {
				const { [userId]: _, ...users } = get().users;
				set({ users });
			}
			get().$refresh();
		},
		$refresh() {
			set({
				self: get().users[UserStore.getCurrentUser()?.id],
			});
		},
	}),
);
