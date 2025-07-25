import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import {
	dispatchActivity,
	dispatchActivityIfPossible,
	makeEmptySettingsActivity,
	type RawActivity,
	type SettingsActivity,
} from "./stuff/activity";
import { registerDefaultChanges, unregisterChanges } from "./stuff/autochange";
import PresetProfiles from "./stuff/presetProfiles";

export const vstorage = storage as {
	settings: {
		edit: boolean;
		display: boolean;
		debug: {
			enabled: boolean;
			visible: boolean;
		};
	};
	activity: {
		profile?: string;
		editing: SettingsActivity;
	};
	profiles: Record<string, SettingsActivity>;
};

export const debug: {
	lastRawActivity: RawActivity | undefined;
	lastRawActivityTimestamp: number | undefined;
} = {
	lastRawActivity: undefined,
	lastRawActivityTimestamp: undefined,
};

export async function onLoad() {
	vstorage.settings ??= {
		edit: false,
		display: false,
		debug: {
			enabled: false,
			visible: false,
		},
	};
	vstorage.activity ??= {
		editing: makeEmptySettingsActivity(),
	};
	vstorage.profiles ??= PresetProfiles;

	dispatchActivityIfPossible();
	registerDefaultChanges();
}

export function onUnload() {
	dispatchActivity();
	unregisterChanges(true);
}

export const settings = Settings;
