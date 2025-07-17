import patcher from "./stuff/patcher";

export interface Iterable {
	content: string | Iterable | Iterable[];
	[k: PropertyKey]: any;
}

export const onUnload = patcher();
