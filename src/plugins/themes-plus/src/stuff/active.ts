import { React } from "@vendetta/metro/common";

import type { InactiveReason, PatchType } from "..";
import type { Iconpack, IconpackData } from "../types";

export const state = {
	loading: true,
	active: false,
	iconpack: {
		iconpack: undefined as Iconpack | undefined,
		list: [] as IconpackData["list"],
		hashes: {} as Record<string, { hash: string; size: number }>,
	},
	patches: [] as PatchType[],
	inactive: [] as InactiveReason[],
};

let stateUsers = new Array<() => void>();
export function useState() {
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);

	React.useEffect(() => {
		const func = () => {
			forceUpdate();
		};

		stateUsers.push(func);
		return () => {
			stateUsers = stateUsers.filter(x => x !== func);
		};
	}, []);
}
export function updateState() {
	for (const x of stateUsers) {
		x();
	}
}
