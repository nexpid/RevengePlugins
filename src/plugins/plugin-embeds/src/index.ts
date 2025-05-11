import patcher from "./stuff/patcher";

export interface Iterable {
	content: string | Iterable | Iterable[];
	[k: PropertyKey]: any;
}

let unpatch: () => void;

export const onLoad = () => (unpatch = patcher());
export const onUnload = () => {
	unpatch();
};
