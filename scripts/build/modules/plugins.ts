import { readdir } from "node:fs/promises";
import type { Worker } from "node:worker_threads";

import {
	bench,
	highlight,
	logScopeFailed,
	logScopeFinished,
} from "../../common/statistics/print.ts";
import { isDev } from "../lib/common.ts";

export async function listPlugins(noDev?: boolean) {
	const plugins = await readdir("src/plugins");
	const lang = await readdir("lang/values/base");

	const list = plugins
		.filter(x => (x.endsWith(".dev") ? isDev && !noDev : true));

	return list
		.map(plugin => {
			const langName = plugin.replaceAll("-", "_");
			return {
				name: plugin,
				lang: lang.includes(`${langName}.json`) ? langName : null,
				plugins: list,
			};
		});
}

const pendingWorkers: import("../types").Worker.PluginWorkerRequest[] = [];
let usedWorkers = 0;

export const workerResolves = {
	res: () => void 0,
	rej: (() => void 0) as (error: any) => void,
	rejected: false,
	code: "",
};

export const workers: Worker[] = [];
export const finishUp = new Set<{ prcess: string; worker: Worker }>();
export let workerInd = 0;

export function buildPlugin(
	plugin: import("../types").Worker.PluginWorkerRequest,
	silent?: boolean,
) {
	const { code } = workerResolves;

	usedWorkers++;
	if (usedWorkers > workers.length) {
		pendingWorkers.push(plugin);
	} else {
		const started = bench();
		const worker = workers[usedWorkers - 1];

		worker.postMessage(plugin);
		if (plugin.prcess) finishUp.add({ prcess: plugin.prcess, worker });

		const listener = (data: any) => {
			if (code !== workerResolves.code) return;

			const status: import("../types").Worker.PluginWorkerResponse = data.data ?? data;
			if (workerResolves.rejected) return;

			const label = `Built plugin ${
				highlight(status.result === "yay" ? status.plugin : plugin.name)
			}`;

			if (status.result === "yay") {
				if (!plugin.prcess) logScopeFinished(label, started.stop());

				plugin = pendingWorkers.splice(0, 1)[0];
				usedWorkers--;

				if (plugin) {
					worker.postMessage(plugin),
						plugin.prcess
						&& finishUp.add({ prcess: plugin.prcess, worker });
				} else if (usedWorkers <= 0) {
					for (const worker of workers) {
						worker.emit("finished");
					}
					workerResolves.res();
				}
			} else if (status.result === "nay") {
				if (!silent) logScopeFailed(label);

				worker.emit("finished");
				workerResolves.rejected = true;
				workerResolves.rej(status.err);
			}
		};
		worker.addListener("message", listener);
		worker.once("finished", () => worker.removeListener("message", listener));
	}
}

export function restartBuild() {
	workerInd = 0;
	usedWorkers = 0;
	pendingWorkers.length = 0;
}
