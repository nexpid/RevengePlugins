// STUB[epic=types] fonts :3

import { without } from "@vendetta/utils";

const { bunny } = window as any;
export const rawFonts = bunny.fonts.fonts;

type FontMap = Record<string, string>;

export interface FontDefinition {
	spec: 1;
	name: string;
	previewText?: string;
	main: FontMap;
	__source?: string;
}

export function getSelectedFont(): string {
	return rawFonts.__selected;
}
export function getFonts(): Record<string, FontDefinition> {
	return without(rawFonts, "__selected");
}

export function hasFontBySource(source: string, fonts = getFonts()): boolean {
	return Object.values(fonts).some(x => x.__source === source);
}
export function hasFontByName(name: string, fonts = getFonts()): boolean {
	return Object.keys(fonts).includes(name);
}

export async function installFont(source: string, select?: boolean) {
	return bunny.fonts.installFont(source, select);
}
export async function addFont(font: FontDefinition, select?: boolean) {
	return bunny.fonts.saveFont(font, select);
}
