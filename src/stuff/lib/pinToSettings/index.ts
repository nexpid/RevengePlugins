import { patchPanelUI } from "./panel";
import { patchTabsUI } from "./tabs";

export interface PinToSettingsTabs {
	key: string;
	title: () => string;
	icon?: number;
	predicate?: () => boolean;
	trailing?: () => React.ReactNode;
	page: React.ComponentType;
}

export function patchSettingsPin(tabs: PinToSettingsTabs): () => void {
	const patches = new Array<() => void>();

	let disabled = false;

	const realPredicate = tabs.predicate ?? (() => true);
	tabs.predicate = () => (disabled ? false : realPredicate());

	patchPanelUI(tabs, patches);
	patchTabsUI(tabs, patches);
	patches.push(() => (disabled = true));

	return () => {
		for (const x of patches) {
			x();
		}
	};
}
