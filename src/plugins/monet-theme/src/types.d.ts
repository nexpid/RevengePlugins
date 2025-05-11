export type Patches = PatchV2 | PatchV3;
export interface PatchV2 {
	version: 2;
	replacers: PatchThing<[string, number]>;
	semantic: PatchThing<string>;
	raw: PatchThing<string>;
}
export interface PatchV3 {
	version: 3;
	replacers: PatchThing<{
		color: string;
		ratio?: number;
		base?: number;
		alternative?: boolean;
	}>;
	semantic: PatchThing<string>;
	raw: PatchThing<string>;
	plus: {
		unreadBadgeColor: PatchThingSingle<string>;
		mentionLineColor: PatchThingSingle<string>;
		icons: PatchThing<string>;
	};
}

export interface PatchThing<value> {
	dark: Record<string, value>;
	light: Record<string, value>;
	both: Record<string, value>;
}
export type PatchThingSingle<value> =
	| {
		dark: value;
		light: value;
	}
	| {
		both: value;
	};
