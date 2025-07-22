import { existsSync } from "node:fs";
import { readdir, rm, } from "node:fs/promises";
import { join, } from "node:path";

import {
	bench,
	highlight,
	logCompleted,
	logDebug,
	logFinished,
	logHeader,
	runTask,
} from "../common/statistics/print";
import { readFileString } from "../fs";
import { cleanPath, getTarball, rollupDts, unzipTarball } from "./lib/registry";

type RawDependency = string | {
	from: string;
	as: {
		name: string;
		file: string;
	}[]
}
interface Dependency {
	pkg: string;
	ver: string;
	as: {
		name: string;
		file: string;
	}[]
}

const keep = process.argv.includes("--keep");

const offset = performance.now();

const reg = JSON.parse(await readFileString("declarations/reg.json")) as {
	dependencies: RawDependency[];
};

logDebug("Clearing declarations folder");

for (const file of await readdir("declarations")) {
	if (file !== "reg.json") {
		await rm(join("declarations", file), { recursive: true, force: true });
	}
}
if (existsSync("temp")) await rm("temp", { recursive: true, force: true });

const dependencies = reg.dependencies.map((dep) => {
	const join = typeof dep === "string" ? dep.split("@") : dep.from.split("@");
	const obj: Dependency = {
		pkg: join.slice(0, -1).join("@"),
		ver: join.slice(-1)[0],
		as: []
	}

	if (typeof dep !== "string") obj.as = dep.as;
	
	return obj;
});

const tarballPreparation = bench();
logHeader("Preparing tarballs");

const artifacts = new Set<{
	dep: Dependency;
	data: Buffer;
}>();
await runTask(
	`Downloaded ${highlight("package")} tarballs`,
	Promise.all(
		dependencies.map((dep) =>
			getTarball(dep.pkg, dep.ver).then(data =>
				artifacts.add({
					dep,
					data,
				})
			)
		),
	),
);

const artifactPaths = new Set<{
	dep: Dependency;
	path: string;
}>();
await runTask(
	`Unzipped ${highlight("package")} tarballs`,
	Promise.all([...artifacts.values()].map(({ dep, data }) =>
		unzipTarball(
			join("temp", `${cleanPath(dep.pkg)}@${dep.ver}`),
			data,
		).then(path => artifactPaths.add({ dep, path }))
	)),
);

logFinished("preparing tarballs", tarballPreparation.stop());

const makingDeclarations = bench();

logHeader("Making declarations");

let anyErrors = false;
for (const { path, dep } of [...artifactPaths.values()]) {
		await runTask(
			`Rolled up ${highlight(dep.pkg)}`,
			rollupDts(
				path,
				dep.pkg,
				join(import.meta.dirname, "../../", "declarations", `${cleanPath(dep.pkg)}.d.ts`),
			).catch(
				err =>
					void (logDebug(`Couldn't rollup ${highlight(dep.pkg)}!`),
						console.error(err),
						(anyErrors = true)),
			),
		);	
}

if (!anyErrors && !keep) await rm("temp", { recursive: true, force: true });
logFinished("rolling up .d.ts", makingDeclarations.stop());

logCompleted(Math.floor(performance.now() - offset));
