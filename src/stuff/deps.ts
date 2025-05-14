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

export const zustand = (findByProps("create", "useStore") ?? {
	create: findByName("create"),
}) as typeof import("zustand");

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
export const RNCacheModule = (RN.NativeModules.MMKVManager
	?? RN.NativeModules.NativeCacheModule) as StateStorage;

export const RNChatModule = (RN.NativeModules.DCDChatManager
	?? RN.NativeModules.NativeChatModule) as {
		updateRows: (id: string, json: string) => any;
	};

export const RNFileModule = (RN.NativeModules.RTNFileManager
	?? RN.NativeModules.DCDFileManager
	?? RN.NativeModules.NativeFileModule) as {
		readFile(path: string, encoding: "base64" | "utf8"): Promise<string>;
		fileExists(path: string): Promise<boolean>;
		removeFile(
			storageDir: "documents" | "cache",
			path: string,
		): Promise<boolean>;
		writeFile(
			storageDir: "cache" | "documents",
			path: string,
			data: string,
			encoding: "base64" | "utf8",
		): Promise<string>;

		clearFolder(
			storageDir: "documents" | "cache",
			path: string,
		): Promise<boolean>;
		saveFileToGallery(
			uri: `file://${string}`,
			fileName: string,
			fileType: "PNG" | "JPEG",
		): Promise<string>;
		readAsset(path: string, encoding: "base64" | "utf8"): void;
		getSize(uri: string): Promise<boolean>;

		/** Doesn't end with / */
		CacheDirPath: string;
		/** Doesn't end with / */
		DocumentsDirPath: string;
		getConstants: () => {
			/** Doesn't end with / */
			CacheDirPath: string;
			/** Doesn't end with / */
			DocumentsDirPath: string;
		};
	};
