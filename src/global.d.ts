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

declare module "*.png" {
	const icon: {
		uri: string;
		width: number;
		height: number;
		file: string | null;
		allowIconTheming: boolean;
	};
	export default icon;
}

declare const IS_DEV: boolean;
declare const PREVIEW_LANG: boolean;
declare const DEFAULT_LANG: Record<string, string> | undefined;
declare const DEV_LANG: Record<string, Record<string, string>> | undefined;

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

// biome-ignore lint/correctness/noUnusedVariables: This is used
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
	};
}
