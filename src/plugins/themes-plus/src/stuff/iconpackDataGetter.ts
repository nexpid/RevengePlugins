import type { IconpackConfig } from "../types";
import constants from "./constants";
import { cFetch } from "./util";

export interface FetchedIconpackData {
	config: IconpackConfig | null;
	tree: string[] | null;
}

export default async function getIconpackData(
	id: string,
	configUrl?: string,
): Promise<FetchedIconpackData> {
	const treeUrl = constants.iconpacks.tree(id);
	const [config, tree] = await Promise.allSettled([
		configUrl
			? cFetch<IconpackConfig>(configUrl, undefined, "json")
			: new Promise(res => res(Symbol())),
		cFetch(treeUrl).then(x => x.replaceAll("\r", "").split("\n")),
	]);

	return {
		config: config.status === "fulfilled" && typeof config.value !== "symbol"
			? (config.value as IconpackConfig)
			: null,
		tree: tree.status === "fulfilled" ? tree.value : null,
	};
}
