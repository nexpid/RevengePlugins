import { FluxDispatcher } from "@vendetta/metro/common";

import { Joi } from "$/deps";

import { debug, vstorage } from "..";
import { forceUpdateLiveRawActivityView } from "../components/pages/LiveRawActivityView";
import { placeholders } from "../components/Settings";
import { unregisterChanges } from "./autochange";
import { parseTimestamp } from "./util";
import {
	parseVariableImage,
	parseVariableString,
	parseVariableTimestamp,
	registerVariableEvents,
	type VariableType,
} from "./variables";

export interface RawActivity {
	name: string;
	application_id?: string;
	type?: number;
	flags: number;
	state?: string;
	details?: string;
	timestamps?: {
		start?: number;
		end?: number;
	};
	assets: {
		large_image?: string;
		large_text?: string;
		small_image?: string;
		small_text?: string;
	};
	metadata?: {
		button_urls?: string[];
	};
	buttons?: string[];
}
export interface SettingsActivity {
	app: {
		name?: string;
		id?: string;
	};
	state?: string;
	details?: string;
	timestamps: {
		start?: string | number;
		end?: string | number;
	};
	assets: {
		largeImg?: string;
		smallImg?: string;
	};
	buttons: {
		text: string;
		url?: string;
	}[];
	type?: ActivityType;
}

export enum ActivityType {
	Playing = 0,
	Listening = 2,
	Watching = 3,
	Competing = 5,
}

export const SettingsActivity = Joi.object({
	app: Joi.object({
		name: Joi.string().optional(),
		id: Joi.string().optional(),
	}),
	state: Joi.string().optional(),
	details: Joi.string().optional(),
	timestamps: Joi.object({
		start: Joi.alternatives(Joi.string(), Joi.number()).optional(),
		end: Joi.alternatives(Joi.string(), Joi.number()).optional(),
	}),
	assets: Joi.object({
		largeImg: Joi.string().optional(),
		smallImg: Joi.string().optional(),
	}).required(),
	buttons: [
		Joi.object({
			text: Joi.string(),
			url: Joi.string().optional(),
		}),
	],
	type: Joi.string().valid(...Object.values(ActivityType)),
});

// TODO support activity flags
export enum ActivityFlags {
	Instance = 1 << 0,
	Join = 1 << 1,
	Spectate = 1 << 2,
	JoinRequest = 1 << 3,
	Sync = 1 << 4,
	Play = 1 << 5,
	PartyPrivacyFriends = 1 << 6,
	PartyPrivacyVoiceChannel = 1 << 7,
	Embedded = 1 << 8,
}

export function makeEmptySettingsActivity(): SettingsActivity {
	return {
		timestamps: {},
		assets: {},
		buttons: [],
		app: {},
	};
}
export function settingsActivityToRaw(activity: SettingsActivity): {
	activity: RawActivity;
	types: VariableType[];
} {
	const types: VariableType[] = [];

	const handleVar = {
		str: (str: string): string => {
			const vr = parseVariableString(str);
			for (const x of vr.types) if (!types.includes(x)) types.push(x);
			return vr.content;
		},
		tim: (tim: number | string): number | undefined => {
			const vr = parseVariableTimestamp(tim);
			if (vr.type && !types.includes(vr.type)) types.push(vr.type);

			return vr.timestamp !== undefined
				? parseTimestamp(vr.timestamp)
				: undefined;
		},
		img: (img: string): string | undefined => {
			const vr = parseVariableImage(img);
			if (vr.type && !types.includes(vr.type)) types.push(vr.type);
			return vr.image;
		},
	};

	const at: RawActivity = {
		name: handleVar.str(activity.app.name ?? placeholders.appName),
		application_id: activity.app.id ?? "0",
		type: activity.type ?? ActivityType.Playing,
		flags: ActivityFlags.Instance,
		state: activity.state && handleVar.str(activity.state),
		details: activity.details && handleVar.str(activity.details),
		timestamps: {
			start: activity.timestamps.start !== undefined
				? handleVar.tim(activity.timestamps.start)
				: undefined,
			end: activity.timestamps.end !== undefined
				? handleVar.tim(activity.timestamps.end)
				: undefined,
		},
		assets: {
			large_image: activity.assets.largeImg
				&& handleVar.img(activity.assets.largeImg),
			small_image: activity.assets.smallImg
				&& handleVar.img(activity.assets.smallImg),
		},
	};

	if (at.assets.large_image && at.type === ActivityType.Playing) {
		at.assets.large_text = "CRPC@VD";
	}

	if (activity.buttons[0]) {
		at.metadata = {
			button_urls: activity.buttons
				.slice(0, 2)
				.filter(x => !!x.text)
				.map(x => (x.url ? handleVar.str(x.url) : null)) as string[],
		};
		at.buttons = activity.buttons
			.slice(0, 2)
			.filter(x => !!x.text)
			.map(x => handleVar.str(x.text));
	}

	debug.lastRawActivity = at;
	debug.lastRawActivityTimestamp = Date.now();
	forceUpdateLiveRawActivityView();

	return {
		activity: at,
		types,
	};
}

export async function dispatchActivity(
	activity?: SettingsActivity,
): Promise<void> {
	let send = {};

	unregisterChanges();
	if (activity) {
		const parsed = settingsActivityToRaw(activity);
		send = parsed.activity;
		registerVariableEvents(parsed.types);
	}

	FluxDispatcher.dispatch({
		type: "LOCAL_ACTIVITY_UPDATE",
		activity: send,
		socketId: "CustomRPC@Nexpid/Bunny", // based on Last.fm plugin
	});
}

export function getSavedActivity(): SettingsActivity {
	return (
		(vstorage.activity.profile
			&& vstorage.profiles[vstorage.activity.profile])
		|| vstorage.activity.editing
		|| makeEmptySettingsActivity()
	);
}

export function dispatchActivityIfPossible(): void {
	const activity = getSavedActivity();
	if (vstorage.settings.display) dispatchActivity(activity);
	else dispatchActivity();
}

export function isActivitySaved(): boolean {
	const a = getSavedActivity();
	return JSON.stringify(a) === JSON.stringify(vstorage.activity.editing);
}
