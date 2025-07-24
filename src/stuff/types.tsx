import { findByProps, findByStoreName } from "@vendetta/metro";
import { FluxDispatcher, ReactNative as RN } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import type { StyleSheet } from "react-native";

import { before } from "@vendetta/patcher";
import type Modal from "./components/Modal";
import { RNChatModule } from "./deps";
import type { ChatRowTypeMessage } from "./typings";

const ThemeStore = findByStoreName("ThemeStore");
const { triggerHaptic } = findByProps("triggerHaptic");

const colorModule = findByProps("colors", "unsafe_rawColors");
const colorResolver = colorModule?.internal ?? colorModule?.meta;

const { useThemeContext } = findByProps("useThemeContext");

export const TextStyleSheet = findByProps("TextStyleSheet")
	.TextStyleSheet as _TextStyleSheet;

export const Navigator = findByProps("Navigator")?.Navigator;
export const modalCloseButton = findByProps(
	"getHeaderCloseButton",
)?.getHeaderCloseButton;
export const { popModal, pushModal } = findByProps("popModal", "pushModal");

export type Entries<T> = [keyof T, T[keyof T]];

// ...
export const getDiscordTheme = () => {
	// getDefaultFallbackTheme is not exported :(
	const { theme } = ThemeStore;

	if (theme.startsWith("vd-theme-")) return theme.split("-")[3];
	return theme;
};

export const resolveCustomSemantic = (dark: any, light: any) =>
	getDiscordTheme() === "light" ? light : dark;

export const lerp = (og: string, target: string, perc: number) => {
	const hex2rgb = (hex: string) =>
		hex.match(/\w\w/g)?.map(x => Number.parseInt(x, 16)) ?? [0, 0, 0];
	const rgb2hex = (rgb: number[]) => `#${rgb.map(x => x.toString(16).padStart(2, "0")).join("")}`;

	const ogR = hex2rgb(og);
	const targetR = hex2rgb(target);

	const result = ogR.map((ogC, i) => Math.round(ogC + (targetR[i] - ogC) * perc));

	return rgb2hex(result);
};

export function resolveSemanticColor(
	color: any,
	theme: string = ThemeStore.theme,
) {
	return colorResolver?.resolveSemanticColor(theme, color);
}

export function getUserAvatar(
	user: {
		discriminator: string;
		avatar?: string;
		id: string;
	},
	animated?: boolean,
): string {
	const isPomelo = user.discriminator === "0";

	return user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${
			animated && user.avatar.startsWith("a_")
				? `${user.avatar}.gif`
				: `${user.avatar}.png`
		}`
		: `https://cdn.discordapp.com/embed/avatars/${
			isPomelo
				? (Number.parseInt(user.id) >> 22) % 6
				: Number.parseInt(user.discriminator) % 5
		}`;
}

export function openModal(key: string, modal: typeof Modal) {
	const empty = Symbol("empty");
	if (!Navigator || !modalCloseButton) {
		showToast(
			`${
				[
					Navigator ? empty : "Navigator",
					modalCloseButton ? empty : "modalCloseButton",
				]
					.filter(x => x !== empty)
					.join(", ")
			} is missing! Please try reinstalling your client.`,
			getAssetIDByName("CircleXIcon-primary"),
		);
		return;
	}

	pushModal({
		key,
		modal: {
			key,
			modal,
			animation: "slide-up",
			shouldPersistUnderModals: false,
			closable: true,
		},
	});
}

export function doHaptic(dur: number): Promise<void> {
	triggerHaptic();
	const interval = setInterval(() => triggerHaptic(), 1);
	return new Promise(res => setTimeout(() => res(clearInterval(interval)), dur));
}

export function androidifyColor(color: string, alpha = 255): number {
	const [_, r, g, b] = color.match(/#([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/i) ?? [];
	if (!_) return 0;

	return (
		((alpha & 0xff) << 24)
		| ((Number.parseInt(r, 16) & 0xff) << 16)
		| ((Number.parseInt(g, 16) & 0xff) << 8)
		| (Number.parseInt(b, 16) & 0xff)
	);
}

export function fluxSubscribe(
	topic: string,
	callback: (data: any) => void,
	once?: boolean,
) {
	const cback = (data: any) => (
		callback(data), once && FluxDispatcher.unsubscribe(topic, cback)
	);
	FluxDispatcher.subscribe(topic, cback);
	return () => FluxDispatcher.unsubscribe(topic, cback);
}

export function formatBytes(bytes: number) {
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	if (bytes === 0) return "0 B";

	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

export function deepEquals(x: any, y: any) {
	if (x === y) return true;
	if (typeof x === "object" && typeof y === "object" && x && y) {
		if (Object.keys(x).length !== Object.keys(y).length) return false;

		for (const prop in x) {
			if (Object.hasOwn(y, prop)) {
				if (!deepEquals(x[prop], y[prop])) return false;
			} else return false;
		}

		return true;
	}
}

export function formatDuration(duration: number) {
	const seconds = duration % 60;
	const minutes = Math.floor(duration / 60) % 60;
	const hours = Math.floor(duration / 3600);

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function createThemeContextStyleSheet<
	T extends StyleSheet.NamedStyles<any>,
>(sheet: T) {
	const themeContext = useThemeContext();

	for (const key in sheet) {
		// @ts-expect-error types
		sheet[key] = new Proxy(RN.StyleSheet.flatten(sheet[key]), {
			get(target, prop, receiver) {
				const res = Reflect.get(target, prop, receiver);
				return colorResolver.isSemanticColor(res)
					? resolveSemanticColor(res, themeContext?.theme)
					: res;
			},
		});
	}

	return sheet;
}

export function patchRows(callback: (rows: ChatRowTypeMessage[]) => void) {
	return before("updateRows", RNChatModule, (args) => {
		const rows = JSON.parse(args[1]);
		try {
			callback(rows);
		} catch (e) {
			console.error("[nexpid.patchRows]", e);
		}

		args[1] = JSON.stringify(rows);
	});
}

// ...

export type TextStyleSheetCase = "normal" | "medium" | "semibold" | "bold";

type TextStyleSheetHasExtraBoldCase =
	| "heading-sm"
	| "heading-md"
	| "heading-lg"
	| "heading-xl"
	| "heading-xxl"
	| "heading-deprecated-12";
export type TextStyleSheetHasCase =
	| TextStyleSheetHasExtraBoldCase
	| "text-xxs"
	| "text-xs"
	| "text-sm"
	| "text-md"
	| "text-lg"
	| "redesign/message-preview"
	| "redesign/channel-title";

export type TextStyleSheetVariant =
	| `${TextStyleSheetHasCase}/${TextStyleSheetCase}`
	| `${TextStyleSheetHasExtraBoldCase}/${TextStyleSheetCase | "extrabold"}`
	| "eyebrow"
	| "redesign/heading-18/bold"
	| "display-sm"
	| "display-md"
	| "display-lg";

type _TextStyleSheet = Record<
	TextStyleSheetVariant,
	{
		fontSize: number;
		lineHeight: number;
		textTransform: "none" | "capitalize" | "uppercase" | "lowercase";
		fontFamily: string;
		includeFontPadding: boolean;
		letterSpacing?: number;
	}
>;

export interface SearchContext {
	type: string;
	[key: PropertyKey]: any;
}

export function isObject(x: Record<any, any>) {
	return typeof x === "object" && !Array.isArray(x);
}
