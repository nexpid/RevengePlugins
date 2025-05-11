import { logger } from "@vendetta";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { assetsURL, vstorage } from "..";
import { existsFile, readFile, saveFile } from "./files";
import { type ManifestV1, manifestVer } from "./lib/manifest";

const getFile = async (
	file: string,
	extra: {
		parse?: (text: string) => any;
		signal?: AbortSignal;
		disable?: boolean;
		encoding?: "utf8" | "base64";
	} = {},
): Promise<any> => {
	let content: string | null = null;

	const oldEtag = !extra.disable
		&& (await existsFile(`${file}.etag`))
		&& (await readFile(`${file}.etag`));

	if (!extra.disable) {
		const res = await fetch(assetsURL + file, {
			headers: {
				"If-None-Match": oldEtag,
				"Cache-Control": "no-cache",
			} as any,
			signal: extra.signal,
		});
		if (res.ok) {
			const newEtag = res.headers.get("etag");

			if (newEtag && newEtag !== oldEtag) {
				saveFile(`${file}.etag`, newEtag);

				const blob = await res.blob();
				if (
					!(() =>
						new Promise(res => {
							const reader = new FileReader();
							reader.addEventListener("error", () => {
								res(false);
							});
							reader.addEventListener("load", () => {
								if (!reader.result) return res(false);

								const splitter = ";base64,";
								const aResult = reader.result
									.toString()
									.split(splitter);
								const text = aResult.slice(1).join(splitter);

								saveFile(file, text, "base64");
								content = extra.encoding === "base64"
									? text
									: Buffer.from(text, "base64").toString(
										"utf8",
									);
							});
							reader.readAsDataURL(blob);
						}))()
				) {
					return false;
				}
			}
		}
	}

	if (!content && (await existsFile(file))) {
		content = await readFile(file, extra.encoding ?? "utf8");
	} else if (!content) return false;

	if (extra.parse) {
		try {
			return extra.parse(content);
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			logger.error(`getFile->parser error!\n${err.stack}`);
			showToast(
				"Failed to parse file!",
				getAssetIDByName("CircleXIcon-primary"),
			);
			return false;
		}
	} else return content;
};

export function getManifest(signal?: AbortSignal): Promise<ManifestV1 | false> {
	return getFile(`manifest.${manifestVer}.json`, {
		signal,
		parse: x => JSON.parse(x),
	});
}
export function getHashes(
	signal?: AbortSignal,
): Promise<Record<string, string> | false> {
	return getFile("assets/hashes.txt", {
		signal,
		parse: x => Object.fromEntries(x.split("\n").map(x => x.split("|"))),
	});
}

const mimes = {
	css: "text/css",
	js: "text/javascript",
	wasm: "application/octet-stream",
	jsdos: "application/zip",
};

export async function getFiles(
	update: (text: string) => void,
	signal: AbortSignal,
): Promise<Record<string, string> | string> {
	update("Fetching manifest.json...");
	const manifest = await getManifest(signal);
	if (!manifest) return "Failed to get file: manifest.json";

	update("Fetching hashes.txt...");
	const hashes = await getHashes(signal);
	if (!hashes) return "Failed to get file: hashes.text";

	const root = manifest.games.find(x => x.id === vstorage.settings.game)?.root;

	const files = manifest.required;
	if (root) files.URL_GAME_LINK = root;

	update("Fetching assets...");
	const content = {};
	for (const key of Object.keys(files)) {
		if (signal.aborted) break;

		const file = files[key];
		const ext = file.split(".").slice(-1)[0];
		const stat = key.endsWith("?u")
			? { id: key.slice(0, -2), quot: false }
			: { id: key, quot: true };

		update(`Checking hash for asset:\n${file}`);

		const lastHash = (await existsFile(`assets/${file}.hash`))
			&& (await readFile(`assets/${file}.hash`));
		const hash = hashes[file];
		if (!hash) return `Required file: ${file} doesn't have a hash :3`;
		if (hash !== lastHash) saveFile(`assets/${file}.hash`, hash);

		update(`Fetching asset:\n${file}`);
		const data = await getFile(`assets/${file}`, {
			signal,
			disable: hash === lastHash,
			encoding: "base64",
		});
		if (!data) return `Failed to fetch asset:\n${file}`;

		if (signal.aborted) break;

		update(`Ok ${file}`);
		const url = `data:${mimes[ext] ?? "text/plain"};base64,${data}`;
		content[stat.id] = stat.quot ? JSON.stringify(url) : url;
	}

	return content;
}
