import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { cpus } from "node:os";
import { extname, join } from "node:path";

import chokidar from "chokidar";
import pc from "picocolors";

import { isDev, previewLang } from "../build/lib/common.ts";
import { makeDocsIconsHook } from "../build/modules/docs.ts";
import { fixPluginLangs, makeLangDefs } from "../build/modules/lang.ts";
import {
	buildPlugin,
	finishUp,
	listPlugins,
	restartBuild,
	workerResolves,
	workers,
} from "../build/modules/plugins.ts";
import { writePluginReadmes, writeRootReadme } from "../build/modules/readmes.ts";
import { logBuild, logBuildErr, logWatch, logWatchErr } from "../common/live/print.ts";
import { allExtensions, hashMap, slashResolve } from "../common/parser/getImports.ts";
import { TsWorker } from "../common/worker/index.ts";
import getDependencies, { dependencyMap } from "./lib/listDeps.ts";

const makeErrorGoodLooking = (e: any) =>
	pc.reset(
		String((e instanceof Error ? e : new Error(e)).stack)
			.split("\n")
			.map(x => `  ${x}`)
			.join("\n"),
	);

logWatch("Booting up Workers");

await (() =>
	new Promise<void>(res => {
		let count = 0;
		for (let i = 0; i < cpus().length; i++) {
			workers.push(
				new TsWorker(
					join(
						import.meta.dirname,
						"../build/modules/workers/plugins.ts",
					),
					{ workerData: { isDev, previewLang } },
				).once("message", () => ++count >= workers.length && res()),
			);
		}
	}))();

logWatch("Parsing imports...");

const promises: Promise<void>[] = [];

for (
	const file of await readdir("src", {
		withFileTypes: true,
		recursive: true,
	})
) {
	if (file.isFile() && allExtensions.includes(extname(file.name))) {
		promises.push(
			getDependencies(
				slashResolve(join(file.parentPath, file.name)).replace(/\\/g, "/"),
			),
		);
	}
}

await Promise.all(promises);

// meow

const srcPath = `${slashResolve("src")}/`;
const langPath = `${slashResolve("lang")}/`;

const shims = [
	slashResolve("scripts/build/modules/workers/migration-shim.ts"),
	slashResolve("src/stuff/migration.tsx"),
];

const runFileChange = async (localPath: string) => {
	const file = slashResolve(localPath);
	const newHash = createHash("sha256")
		.update(await readFile(file, "utf8"))
		.digest("hex");
	if (hashMap.get(file) === newHash) return;

	const affectedPlugins: Set<string> = new Set();

	logWatch(`File changed  ${pc.italic(pc.gray(localPath))}`);

	if (shims.includes(file)) {
		for (const plugin of await readdir("src/plugins")) {
			affectedPlugins.add(plugin);
		}
	} else if (file.slice(langPath.length).startsWith("values/base/")) {
		const [_, __, langFile] = file.slice(langPath.length).split("/");

		affectedPlugins.add(
			langFile.split(".").slice(0, -1).join(".").replace(/_/g, "-"),
		);
	} else {
		await getDependencies(file);

		const checked: Set<string> = new Set();

		const goThroughDeps = (deps: Set<string>) => {
			for (const dep of deps) {
				if (checked.has(dep)) continue;
				checked.add(dep);

				const [folder, plugin] = dep.slice(srcPath.length).split("/");
				if (folder === "plugins") affectedPlugins.add(plugin);

				if (dependencyMap.has(dep)) {
					goThroughDeps(dependencyMap.get(dep)!);
				}
			}
		};

		const [_folder, _plugin] = file.slice(srcPath.length).split("/");
		if (_folder === "plugins") affectedPlugins.add(_plugin);

		if (dependencyMap.has(file)) goThroughDeps(dependencyMap.get(file)!);
	}

	const affected = [...affectedPlugins.values()];
	if (affected.length) {
		if (workerResolves.code !== "") logBuild("Aborted build!");
		restartBuild();

		const code = randomUUID();
		workerResolves.code = code;

		try {
			logBuild(
				`Rebuilding ${pc.bold(`${affected.length} plugin${affected.length !== 1 ? "s" : ""}`)}`,
			);

			const plugins = (await listPlugins())
				.filter(plugin => affected.includes(plugin.name))
				.map(plugin => ({
					...plugin,
					prcess: crypto.randomUUID(),
				}));

			await fixPluginLangs(affected);
			const initPromise = Promise.all([
				makeLangDefs(),
				new Promise<void>((res, rej) => {
					workerResolves.res = res as any;
					workerResolves.rej = rej as any;
				}),
			]);

			for (const plugin of plugins) buildPlugin(plugin, true);
			await initPromise;

			if (workerResolves.code === code) {
				await Promise.all([
					writePluginReadmes(affected),
					writeRootReadme(),
					makeDocsIconsHook(),
				]);

				for (const { prcess, worker } of finishUp) {
					worker.postMessage({ finishUp: prcess });
				}
				finishUp.clear();

				logBuild("Finished building");
				workerResolves.code = "";
			}
		} catch (e: any) {
			workerResolves.code = "";
			workerResolves.rejected = false;
			logBuildErr(`Failed while building!\n${makeErrorGoodLooking(e)}`);
		}
	}
};

chokidar
	.watch(["src", "lang/values/base", ...shims], {
		ignoreInitial: true,
	})
	.on("add", path =>
		runFileChange(path).catch(e =>
			logWatchErr(
				`Failed during runFileChange (${path})!\n${makeErrorGoodLooking(e)}`,
			)
		))
	.on("change", path =>
		runFileChange(path).catch(e =>
			logWatchErr(
				`Failed during runFileChange (${path})!\n${makeErrorGoodLooking(e)}`,
			)
		))
	.on("ready", () => logWatch("Ready!"));

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
