import type * as _FlashList from "@shopify/flash-list";
import { find, findByName, findByProps } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import type * as _Reanimated from "react-native-reanimated";
import type { StateStorage } from "zustand/middleware";

//
// JS deps
//
export const WebView = find((x: any) => x?.WebView && !x.default)
	.WebView as typeof import("react-native-webview").default;

export const Svg = findByProps("SvgXml") as typeof import("react-native-svg");

export const Reanimated = findByProps("useSharedValue") as typeof _Reanimated;

export const FlashList = findByProps("FlashList")
	.FlashList as typeof _FlashList.FlashList;

export const { default: Video } = findByProps(
	"DRMType",
	"FilterType",
) as typeof import("react-native-video");

export const Joi = findByProps("isJoi") as unknown as typeof import("joi");

export const zustand = (findByProps("create", "useStore") || {
	create: findByName("create"),
}) as typeof import("zustand");

export const zustandMW = findByProps(
	"createJSONStorage",
	"persist",
) as typeof import("zustand/middleware");

export const DocumentPicker = findByProps(
	"pickSingle",
	"isCancel",
) as typeof import("react-native-document-picker");
export const DocumentsNew = findByProps(
	"pick",
	"saveDocuments",
) as typeof import("@react-native-documents/picker");

const _MAS = findByProps("MobileAudioSound").MobileAudioSound;

// Messy code
export class MobileAudioSound {
	// Events
	public onPlay?: () => void;
	public onStop?: () => void;
	public onEnd?: () => void;
	public onLoad?: (loaded: boolean) => void;

	private mas: any;

	public duration?: number;
	public isLoaded?: boolean;
	public isPlaying?: boolean;

	/** Discord when it comes to not changing everything every fucking version!!! */
	private get ensureSoundGetter() {
		return this.mas?._ensureSound || this.mas?.ensureSound;
	}

	/** Preloads the audio, which automatically makes us better than Discord because they DON'T do that for some reason */
	private async _preloadSound(skip?: boolean) {
		const { _duration } = await this.ensureSoundGetter.bind(this.mas)();
		this.duration = RN.Platform.select({
			ios: _duration ? _duration * 1000 : _duration,
			default: _duration,
		});
		this.isLoaded = !!_duration;

		if (!skip) this.onLoad?.(!!_duration);
		return !!_duration;
	}

	constructor(
		public url: string,
		public usage: "notification" | "voice" | "ring_tone" | "media",
		public volume: number,
		events?: {
			onPlay?: () => void;
			onStop?: () => void;
			onEnd?: () => void;
			onLoad?: (loaded: boolean) => void;
		},
	) {
		this.mas = new _MAS(
			url,
			{
				media: "vibing_wumpus",
				notification: "activity_launch",
				ring_tone: "call_ringing",
				voice: "mute",
			}[usage],
			volume,
			"default",
		);
		this.mas.volume = volume;

		this._preloadSound();
		for (const [key, val] of Object.entries(events ?? {})) this[key] = val;
	}

	private _playTimeout?: number;

	/** Plays the audio */
	async play() {
		if (!this.isLoaded && this.isLoaded !== false) {
			await this._preloadSound();
		}
		if (!this.isLoaded) return;

		this.mas.volume = this.volume;
		await this.mas.play();
		this.isPlaying = true;
		this.onPlay?.();

		clearTimeout(this._playTimeout);
		this._playTimeout = setTimeout(
			() => (this.onEnd?.(), this.stop()),
			this.duration,
		) as any;
	}

	/** Stops the audio */
	async stop() {
		if (!this.isLoaded) return;

		this.mas.stop();
		this.isPlaying = false;
		this.onStop?.();

		clearTimeout(this._playTimeout);
		await this._preloadSound(true);
	}
}

//
// raw native modules
//

// ripped straight from https://github.com/revenge-mod/revenge-bundle/blob/0a90d762e5c9996bb6613edd136fafe2b8f25908/src/lib/api/native/modules/index.ts
// why the fuck isnt that exported
const nmp = window.nativeModuleProxy;

function getNativeModule<T = any>(...names: string[]): T | undefined {
	for (const name of names) {
		if (globalThis.__turboModuleProxy) {
			const module = globalThis.__turboModuleProxy(name);
			if (module) return module as T;
		}

		if (nmp[name]) return nmp[name] as T;
	}

	return undefined;
}

export const RNCacheModule = getNativeModule<StateStorage>(
	"NativeCacheModule",
	"MMKVManager",
)!;

export const RNChatModule = getNativeModule<{
	updateRows: (id: string, json: string) => any;
}>(
	"NativeChatModule",
	"DCDChatManager",
)!;

export const RNFileModule = getNativeModule<{
	/**
	 * @param path **Full** path to file
	 */
	fileExists: (path: string) => Promise<boolean>;
	/**
	 * Allowed URI schemes on Android: `file://`, `content://` ([See here](https://developer.android.com/reference/android/content/ContentResolver#accepts-the-following-uri-schemes:_3))
	 */
	getSize: (uri: string) => Promise<boolean>;
	/**
	 * @param path **Full** path to file
	 * @param encoding Set to `base64` in order to encode response
	 */
	readFile(path: string, encoding: "base64" | "utf8"): Promise<string>;
	saveFileToGallery?(uri: string, fileName: string, fileType: "PNG" | "JPEG"): Promise<string>;
	/**
	 * @param storageDir Either `cache` or `documents`.
	 * @param path Path in `storageDir`, parents are recursively created.
	 * @param data The data to write to the file
	 * @param encoding Set to `base64` if `data` is base64 encoded.
	 * @returns Promise that resolves to path of the file once it got written
	 */
	writeFile(
		storageDir: "cache" | "documents",
		path: string,
		data: string,
		encoding: "base64" | "utf8",
	): Promise<string>;
	/**
	 * Removes a file from the path given.
	 * (!) On Android, this always returns false, regardless if it fails or not!
	 * @param storageDir Either `cache` or `documents`
	 * @param path Path to the file to be removed
	 */
	removeFile(storageDir: "cache" | "documents", path: string): Promise<unknown>;
	/**
	 * Clear the folder from the path given
	 * (!) On Android, this only clears all *files* and not subdirectories!
	 * @param storageDir Either `cache` or `documents`
	 * @param path Path to the folder to be cleared
	 * @returns Whether the clearance succeeded
	 */
	clearFolder(storageDir: "cache" | "documents", path: string): Promise<boolean>;
	getConstants: () => {
		/**
		 * The path the `documents` storage dir (see {@link writeFile}) represents.
		 */
		DocumentsDirPath: string;
		CacheDirPath: string;
	};
	/**
	 * Will apparently cease to exist some time in the future so please use {@link getConstants} instead.
	 * @deprecated
	 */
	DocumentsDirPath: string;
}>(
	"NativeFileModule",
	"DCDFileManager",
)!;
