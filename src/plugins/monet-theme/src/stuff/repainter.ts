import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { safeFetch } from "@vendetta/utils";

export interface RepainterRawTheme {
	pageProps: {
		initialId: string;
		fallback: Record<
			string,
			{
				id: string;
				name: string;
				description: string;
				createdAt: string;
				updatedAt: string;
				settingsLines: string[];
				voteCount: number;
				colors: number[];
			}
		>;
	};
	__N_SSP: boolean;
}
export interface RepainterTheme {
	name: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	settings: string[];
	likes: number;
	colors: {
		neutral1: string;
		neutral2: string;
		accent1: string;
		accent2: string;
		accent3: string;
	};
}

export function checkForURL(text: string): string | undefined {
	return text
		.match(HTTP_REGEX_MULTI)
		?.filter(x => x.startsWith("https://repainter.app/themes/"))[0];
}

export async function fetchRawTheme(link: string): Promise<RepainterRawTheme> {
	return await (
		await safeFetch(
			`https://repainter.app/_next/data/Z0BCpVYZyrdkss0k0zqLC/themes/${
				link.match(/themes\/([a-z0-9]+)/i)?.[1] ?? ""
			}.json`,
			{ cache: "no-store" },
		)
	).json();
}

export function parseTheme(theme: RepainterRawTheme): RepainterTheme {
	const data = Object.values(theme.pageProps.fallback)[0];
	if (!data) throw new Error("Invalid Repainter theme!");

	const parseClr = (clr: number) => (clr & 0x00ffffff).toString(16).padStart(6, "0");
	const mapped = data.colors.map(x => `#${parseClr(x)}`);

	return {
		name: data.name,
		description: data.description,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),
		settings: data.settingsLines,
		likes: data.voteCount,
		colors: {
			neutral1: mapped[44],
			neutral2: mapped[57],
			accent1: mapped[5],
			accent2: mapped[18],
			accent3: mapped[31],
		},
	};
}
