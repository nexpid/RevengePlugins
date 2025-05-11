import { all } from "@vendetta/ui/assets";

import { RNFileModule } from "$/deps";

import type { BunnyAsset, Iconpack } from "../types";
import { state } from "./active";
import getIconpackData from "./iconpackDataGetter";
import { flattenFilePath } from "./util";

const iconsPath = "pyoncord/downloads/themesplus/";
export const fullIconsPath = `${RNFileModule.DocumentsDirPath}/${iconsPath}`;

export async function isPackInstalled(pack: Iconpack) {
	if (
		(await RNFileModule.fileExists(`${fullIconsPath}${pack.id}.hash`))
		&& state.iconpack.hashes[pack.id]?.hash
	) {
		const hash = await RNFileModule.readFile(
			`${fullIconsPath}${pack.id}.hash`,
			"utf8",
		);
		return state.iconpack.hashes[pack.id]?.hash === hash ? true : "outdated";
	}
	return false;
}

export async function getInstalledIconpacks(): Promise<
	Record<string, boolean | "outdated">
> {
	const list = {};
	for (const pack of state.iconpack.list) {
		list[pack.id] = await isPackInstalled(pack);
	}

	return list;
}

export async function installIconpack(
	pack: Iconpack,
	signal?: AbortSignal,
	progress?: (x: number) => void,
) {
	const { hash } = state.iconpack.hashes[pack.id];
	if (!hash) throw new Error("Iconpack is not hashed");

	const { tree } = await getIconpackData(pack.id);
	if (!tree) throw new Error("Failed to get iconpack tree");

	await RNFileModule.writeFile(
		"documents",
		`${iconsPath}${pack.id}.hash`,
		hash,
		"utf8",
	);

	const shouldDownload = (Object.values(all) as any as BunnyAsset[]).map(
		asset =>
			[
				...asset.httpServerLocation.split("/").slice(2),
				`${asset.name}${pack.suffix}.${asset.type}`,
			].join("/"),
	);

	const toDownload = tree
		.filter(file => shouldDownload.includes(file))
		.map(file => [
			`${pack.load}/${file}`,
			`${iconsPath}${pack.id}/${flattenFilePath(file)}`,
			file,
		]);

	let incr = 0;
	const threadify = async (arr: typeof toDownload) => {
		for (const [from, to, raw] of arr) {
			if (signal?.aborted) throw new Error("Aborted");

			const blob = await fetch(from, { signal }).then(x => x.blob());
			const result: string = await (() =>
				new Promise((res, rej) => {
					const reader = new FileReader();
					reader.addEventListener("error", () => {
						rej(new Error(`Failed to get blob of ${raw}`));
					});
					reader.addEventListener("load", () => {
						if (reader.result) res(reader.result.toString());
					});
					signal?.addEventListener("abort", () => {
						reader.abort();
					});
					reader.readAsDataURL(blob);
				}))();

			if (signal?.aborted) throw new Error("Aborted");

			const index = result.indexOf(";base64,");
			if (index === -1) throw new Error(`Failed to get base64 of ${raw}`);
			const data = result.slice(index + 8);

			await RNFileModule.writeFile("documents", to, data, "base64");
			incr++;

			if (signal?.aborted) throw new Error("Aborted");
			progress?.(incr / toDownload.length);
		}
	};

	// only allow 10 requests to download at a time, janky but it works
	await Promise.all(
		new Array(10).fill(0).map((_, i, a) => {
			const quart = toDownload.length / a.length;
			return threadify(
				toDownload.slice(
					Math.floor(i * quart),
					Math.floor((i + 1) * quart),
				),
			);
		}),
	);
}

export async function uninstallIconpack(pack: Iconpack) {
	await RNFileModule.clearFolder("documents", `${iconsPath}${pack.id}`);
	await RNFileModule.removeFile("documents", `${iconsPath}${pack.id}.hash`);
}
