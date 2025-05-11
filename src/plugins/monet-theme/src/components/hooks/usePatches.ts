import { logger } from "@vendetta";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { safeFetch } from "@vendetta/utils";

import { devPatchesURL, patchesURL, vstorage } from "../..";
import { parse } from "../../stuff/jsoncParser";
import type { Patches } from "../../types";

const revalidateTimeout = 5000;
const refetchTimeout = 15 * 6000;

const patchesSymbol = Symbol.for("monettheme.cache.patches");

let data = {
	canRefetch: 0,
	patches: null,
} as {
	canRefetch: number;
	patches: Patches | null;
};

if (
	!Number.isNaN(window[patchesSymbol]?.canRefetch)
	&& typeof window[patchesSymbol]?.patches === "object"
) {
	data = {
		canRefetch: window[patchesSymbol].canRefetch,
		patches: JSON.parse(JSON.stringify(window[patchesSymbol].patches)),
	};
}

window[patchesSymbol] = data;

const uponRevalidate = new Set<(data: any) => void>();
let canRevalidate = 0;

const refetch = async () => {
	const patches = await safeFetch(
		vstorage.patches.from === "local" ? devPatchesURL : patchesURL(),
		{
			cache: "no-store",
		},
	)
		.then(x =>
			x.text().then(text => {
				try {
					return parse(text.replace(/\r/g, ""));
				} catch (err: any) {
					showToast(
						"Failed to parse color patches!",
						getAssetIDByName("CircleXIcon-primary"),
					);
					logger.error("usePatches refetch error (parse)", err);
					return null;
				}
			})
		)
		.catch((err: any) => {
			showToast(
				"Failed to fetch color patches!",
				getAssetIDByName("CircleXIcon-primary"),
			);
			logger.error("usePatches refetch error (fetch)", err);
			return null;
		});

	data.patches = patches;
	data.canRefetch = Date.now() + refetchTimeout;

	for (const fnc of uponRevalidate) fnc(patches);
};

const usePatches = (() => {
	const [patches, setPatches] = React.useState(data.patches);
	const revalFunc = (data: any) => setPatches(data);

	React.useEffect(() => {
		uponRevalidate.add(revalFunc);
		return () => void uponRevalidate.delete(revalFunc);
	});

	React.useEffect(
		() => void ((!patches || data.canRefetch >= Date.now()) && refetch()),
		[],
	);

	return {
		patches,
		revalidate: async () => {
			if (canRevalidate < Date.now()) return;
			canRevalidate = Number.NaN;

			await refetch();
			canRevalidate = Date.now() + revalidateTimeout;
		},
	};
}) as {
	(): { patches: Patches | null; revalidate: () => Promise<void> };
	patches: Promise<Patches | null> | Patches | null;
};

Object.defineProperty(usePatches, "patches", {
	get: () => !data.patches ? refetch().then(() => data.patches) : data.patches,
});

export default usePatches;
