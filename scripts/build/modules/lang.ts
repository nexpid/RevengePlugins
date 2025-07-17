import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { dprint } from "../../common/dprint";
import { readFileString } from "../../fs.ts";
import { listPlugins } from "./plugins.ts";

const variableRules = [
	// You have {plugins} {plugins, plural, one {plugin} other {plugins}}!
	// Good {time, select, isDay {day} isNight {night} other {}}!
	/{([^}]+), (select|plural), ?\n?([\s\S]+?)(?=(}})|(} ?\r?\n ?}))/g,
	// Hello world from {plugin.name}!
	/{([^}]+)}/g,
];
const replacerRegExp = /(\w+) {.*?} ?/g;

function parseVariablesToRules(text: string) {
	const rules: import("../types").Lang.Rule[] = [];

	for (const regex of variableRules) {
		const matches = text.matchAll(regex);
		for (const rawMatch of Array.from(matches)) {
			const [match, variable, kind, rawReplacers, _suffix, __suffix] = rawMatch;
			const { index: start } = rawMatch;

			const suffix = _suffix ?? __suffix ?? "";
			const length = match.length + suffix.length;

			// ignore previous matches
			if (rules.some(x => start >= x.start && start < x.start + x.length)) {
				continue;
			}

			if (!kind) {
				rules.push({
					type: "string",
					variable,
					start,
					length,
				});
			} else if (kind === "select" || kind === "plural") {
				// map replacers into an array
				const replacers = Array.from(
					(`${rawReplacers}}`).matchAll(replacerRegExp),
				).map(x => x[1]);
				const isBool = ["true", "false", "other"].every(x => replacers.includes(x))
					&& replacers.length === 3;

				rules.push({
					type: kind === "plural"
						? "number"
						: kind === "select" && isBool
						? "boolean"
						: replacers
							.map(x => JSON.stringify(x))
							.join(" | "),
					variable,
					start,
					length,
				});
			}
		}
	}

	return rules;
}

export async function fixPluginLangs(filter: string[] = []) {
	for (
		const { lang: plugin } of (await listPlugins()).filter(plugin =>
			filter.length !== 0 ? filter.includes(plugin.name) : true
		)
	) {
		if (!plugin) continue;

		const translations: Record<string, Record<string, string>> = JSON.parse(
			await readFileString(join("lang/values", `${plugin}.json`)),
		);

		const base: Record<string, string> = JSON.parse(
			await readFileString(join("lang/values/base", `${plugin}.json`)),
		);

		for (const entries of Object.values(translations)) {
			for (const key of Object.keys(entries)) {
				if (!base[key]) delete entries[key];
				else if (translations.en[key] !== base[key]) {
					entries[key] = base[key];
				}
			}

			for (const key of Object.keys(base)) {
				if (!entries[key]) entries[key] = base[key];
			}
		}

		// minify but also not really
		await writeFile(
			join("lang/values", `${plugin}.json`),
			`{\n${
				Object.entries(translations)
					.sort((a, b) => a[0].localeCompare(b[0]))
					.map(
						([lang, entries]) => `  ${JSON.stringify(lang)}: ${JSON.stringify(entries)}`,
					)
					.join(",\n")
			}\n}\n`,
		);
	}
}

export async function makeLangDefs() {
	const chunks: string[] = [];

	// header
	chunks.push("export default interface LangValues {");

	for (const { lang: plugin } of await listPlugins()) {
		if (!plugin) continue;

		// sub-heaer
		chunks.push(`${JSON.stringify(plugin)}: {`);

		chunks.push(
			`values: typeof import(${JSON.stringify(`./values/base/${plugin}.json`)});`,
		);

		const values = JSON.parse(
			await readFileString(join("lang/values/base", `${plugin}.json`)),
		);

		const keyRulesMap: Record<string, import("../types").Lang.Rule[]> = {};

		for (const key of Object.keys(values)) {
			const rules = parseVariablesToRules(values[key]);
			if (rules[0]) keyRulesMap[key] = rules;
		}

		if (Object.keys(keyRulesMap)[0]) {
			// sub-sub-header
			chunks.push("fillers: {");

			for (const key of Object.keys(keyRulesMap)) {
				chunks.push(
					`${JSON.stringify(key)}: { ${
						Object.values(keyRulesMap[key])
							.map(
								rule => `${JSON.stringify(rule.variable)}: ${rule.type}`,
							)
							.join(", ")
					} }`,
				);
			}

			// sub-sub-footer
			chunks.push("};");
		} else chunks.push("fillers: null;");

		// sub-footer
		chunks.push("};");
	}

	// footer
	chunks.push("};");

	await dprint.saveAndFormat(
		join("lang", "defs.d.ts"),
		chunks.join("\n"),
	);
}
