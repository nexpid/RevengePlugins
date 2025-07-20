import { resolve } from "node:path";

import picocolors from "picocolors";

import { fixPluginLangs } from "../build/modules/lang.ts";
import {
	bench,
	highlight,
	logCompleted,
	logFinished,
	logHeader,
	runTask,
} from "../common/statistics/print.ts";
import { writeNewLangFiles } from "./lib/lang.ts";

const source = process.argv[2] && resolve(process.argv[2]);
if (!source) {
	throw new Error(
		picocolors.bold(
			picocolors.red(
				"This script shouldn't be ran manually, read it's usage in .github/workflows/weekly-merge.yml!",
			),
		),
	);
}

const offset = performance.now();

// Write lang files

const writePluginLangFiles = bench();
logHeader("Writing plugin lang files");

await runTask(
	`Updated ${highlight("plugin lang")} files`,
	writeNewLangFiles(source),
);
await runTask(
	`Fixed ${highlight("plugin translation")} files`,
	fixPluginLangs(),
);

logFinished("writing plugin lang files", writePluginLangFiles.stop());
logCompleted(Math.floor(performance.now() - offset));
