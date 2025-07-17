import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { listPlugins } from "../../build/modules/plugins.ts";
import { readFileString } from "../../fs.ts";

export async function writeNewLangFiles(source: string) {
	const data: Record<string, Record<string, any>> = {};

	// gather all translations from crowdin
	for (const lang of await readdir(source)) {
		if (lang === "base" || lang.endsWith(".json")) continue;

		for (const file of await readdir(join(source, lang))) {
			const key = file.split(".")[0];
			data[key] ??= {};
			data[key][lang] = JSON.parse(
				await readFileString(join(source, lang, file)),
			);
		}
	}

	// go through all plugins
	for (const { lang: plugin } of await listPlugins()) {
		if (!plugin) continue;

		const en = JSON.parse(
			await readFileString(join("lang/values/base", `${plugin}.json`)),
		);

		// if translations aren't on crowdin yet, make a placeholder
		if (!data[plugin]) data[plugin] = { en };
		else data[plugin] = Object.assign(data[plugin], { en });

		// minify but also not really
		await writeFile(
			join("lang/values", `${plugin}.json`),
			`{\n${
				Object.entries(data[plugin])
					.sort((a, b) => a[0].localeCompare(b[0]))
					.map(
						([lang, entries]) => `  ${JSON.stringify(lang)}: ${JSON.stringify(entries)}`,
					)
					.join(",\n")
			}\n}`,
		);
	}
}
