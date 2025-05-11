import { storage } from "@vendetta/plugin";

import settings from "./components/Settings";
import patcher from "./stuff/patcher";

export const vstorage = storage as {
	pinned: Record<string, { id: string; pinned: number }[]>;
	preferFilters: ("server" | "local")[];
};

// TODO add some kind of compression
export function getPins(channel: string) {
	return vstorage.pinned[channel].sort((a, b) => b.pinned - a.pinned) ?? [];
}
export function getAllPins() {
	const pins = new Array<{ id: string; pinned: number; channelId: string }>();
	for (const [channelId, msgs] of Object.entries(vstorage.pinned)) {
		pins.push(...msgs.map(x => ({ id: x.id, pinned: x.pinned, channelId })));
	}
	return pins.sort((a, b) => b.pinned - a.pinned);
}
export function hasAnyPin() {
	return Object.values(vstorage.pinned).some(x => x.length > 0);
}
export function clearPins(channel: string) {
	delete vstorage.pinned[channel];
}
export function hasPin(channel: string, id: string) {
	return vstorage.pinned[channel].some(x => x.id === id);
}
export function addPin(channel: string, id: string) {
	vstorage.pinned[channel] ??= [];
	if (!hasPin(channel, id)) {
		vstorage.pinned[channel].push({ id, pinned: Date.now() });
	}
}
export function removePin(channel: string, id: string) {
	vstorage.pinned[channel] = (vstorage.pinned[channel] ?? []).filter(
		x => x.id !== id,
	);
}

let unpatch: () => void;
export default {
	onLoad: () => {
		vstorage.pinned ??= {};
		vstorage.preferFilters ??= ["server", "local"];

		unpatch = patcher();
	},
	onUnload: () => {
		unpatch();
	},
	settings,
};
