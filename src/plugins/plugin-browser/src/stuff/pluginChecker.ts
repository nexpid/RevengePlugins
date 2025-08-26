import { safeFetch } from "@vendetta/utils";

import { vstorage } from "..";
import type { FullPlugin } from "../types";
import constants from "./constants";
import { properLink } from "./util";

let lastPluginCache: string[] = [];
export function getChanges(): string[] {
	if (!lastPluginCache[0] || !vstorage.state.pluginCache[0]) return [];
	return lastPluginCache.filter(id => !vstorage.state.pluginCache.includes(id));
}

export function updateChanges() {
	vstorage.state.pluginCache = lastPluginCache;
}

export async function run(data?: FullPlugin[]) {
	const res = data
		?? ((await (
			await safeFetch(`${constants.proxyUrl}plugins.json`, {
				cache: "no-store",
			})
		).json()) as FullPlugin[]);
	lastPluginCache = res.map(x =>
		typeof x === "string" ? properLink(x) : properLink(x.vendetta.original)
	);
}

export function initThing(): () => void {
	const interval = setInterval(run, 1000 * 60 * 60);
	run();

	return () => {
		clearInterval(interval);
	};
}
