declare module "*.html" {
	const text: string;
	export default text;
}
declare module "*.css" {
	const text: string;
	export default text;
}
declare module "*.svg" {
	const text: string;
	export default text;
}

interface Asset {
	uri: string;
	width: number;
	height: number;
	file: string | null;
	allowIconTheming: boolean;
}

declare module "*.png" {
	const asset: Asset;
	export default asset;
}
declare module "*.webp" {
	const asset: Asset;
	export default asset;
}

declare const IS_DEV: boolean;
declare const PREVIEW_LANG: boolean;
declare const DEFAULT_LANG: Record<string, string> | undefined;
declare const DEV_LANG: Record<string, Record<string, string>> | undefined;
declare const PLUGINS_LIST: string[];

// simple Buffer type
type Encoding = "base64" | "utf8" | "ascii";
declare const Buffer: {
	from: (
		data: any,
		encoding?: Encoding,
	) => {
		toString(encoding?: Encoding): string;
	};
};

interface Window {
	nx?: {
		readonly semantic: Record<
			string,
			Record<"dark" | "darker" | "light" | "amoled", string>
		>;
		searchSemantic: (query: string) => any;
		findSemantic: (hex: string) => any;
		p: {
			wipe: () => void;
			snipe: (
				prop: string,
				parent: any,
				callback?: (args: any[], ret: any) => any,
				oneTime?: boolean,
			) => void;
			shotgun: (
				parent: any,
				callback?: (args: any[], ret: any) => any,
				oneTime?: boolean,
			) => void;
			props: {
				collect: (
					key: string,
					prop: string,
					parent: any,
					parser?: (obj: any) => any,
				) => void;
				redeem: (key: string, save?: boolean) => object | undefined;
			};
		};
		q: {
			toggleTheme: () => void;
		};
	};
	nativeModuleProxy?: any;
}
