import { join } from "node:path";

import { existsSync } from "fs";
import { readdir, readFile, rm } from "fs/promises";

import {
	bench,
	highlight,
	logCompleted,
	logDebug,
	logFinished,
	logHeader,
	runTask,
} from "../common/statistics/print";
import { cleanPath, getTarball, rollupDts, unzipTarball } from "./lib/registry";

const offset = performance.now();

const reg = JSON.parse(await readFile("declarations/reg.json", "utf8")) as {
	dependencies: string[];
};

logDebug("Clearing declarations folder");

for (const file of await readdir("declarations")) {
	if (file !== "reg.json") {
		await rm(join("declarations", file), { recursive: true, force: true });
	}
}
if (existsSync("temp")) await rm("temp", { recursive: true, force: true });

const dependencies = reg.dependencies.map(x => ({
	pkg: x.split("@").slice(0, -1).join("@"),
	ver: x.split("@").slice(-1)[0],
}));

const tarballPreparation = bench();
logHeader("Preparing tarballs");

const artifacts = new Set<{
	pkg: string;
	ver: string;
	data: Buffer;
}>();
await runTask(
	`Downloaded ${highlight("package")} tarballs`,
	Promise.all(
		dependencies.map(({ pkg, ver }) =>
			getTarball(pkg, ver).then(data =>
				artifacts.add({
					pkg,
					ver,
					data,
				})
			)
		),
	),
);

const artifactPaths = new Set<{
	path: string;
	pkg: string;
}>();
await runTask(
	`Unzipped ${highlight("package")} tarballs`,
	Promise.all([...artifacts.values()].map(({ pkg, ver, data }) =>
		unzipTarball(
			join("temp", `${cleanPath(pkg)}@${ver}`),
			data,
		).then(path => artifactPaths.add({ pkg, path }))
	)),
);

logFinished("preparing tarballs", tarballPreparation.stop());

const makingDeclarations = bench();

logHeader("Making declarations");

let anyErrors = false;
for (const { path, pkg } of [...artifactPaths.values()]) {
	await runTask(
		`Rolled up ${highlight(pkg)}`,
		rollupDts(
			path,
			pkg,
			join(import.meta.dirname, "../../", "declarations", `${cleanPath(pkg)}.d.ts`),
		).catch(
			err =>
				void (logDebug(`Couldn't rollup ${highlight(pkg)}!`),
					console.error(err),
					(anyErrors = true)),
		),
	);
}

if (!anyErrors) await rm("temp", { recursive: true, force: true });
logFinished("rolling up .d.ts", makingDeclarations.stop());

logCompleted(Math.floor(performance.now() - offset));
