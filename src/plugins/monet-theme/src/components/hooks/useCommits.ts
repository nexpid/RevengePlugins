import { logger } from "@vendetta";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { safeFetch } from "@vendetta/utils";

import type { CommitObj } from "../Commit";

const revalidateTimeout = 5000;
const refetchTimeout = 15 * 6000;

const commitsSymbol = Symbol.for("monettheme.cache.commits");

let data = {
	canRefetch: 0,
	commits: null,
} as {
	canRefetch: number;
	commits: CommitObj[] | null;
};

if (
	!Number.isNaN(window[commitsSymbol]?.canRefetch)
	&& Array.isArray(window[commitsSymbol]?.commits)
) {
	data = {
		canRefetch: window[commitsSymbol].canRefetch,
		commits: JSON.parse(JSON.stringify(window[commitsSymbol].commits)),
	};
}

window[commitsSymbol] = data;

const uponRevalidate = new Set<(data: any) => void>();
let canRevalidate = 0;

// graphql test!!!!
//
// query {
//     repository(owner: "nexpid", name: "VendettaMonetTheme") {
//       ref(qualifiedName: "main") {
//         target {
//           ... on Commit {
//             history(path: "patches.jsonc", first: 10) {
//               edges {
//                 node {
//                   oid,
//                   message,
//                   committedDate,
//                   author {
//                     name,
//                     avatarUrl
//                   },
//                   additions,
//                   deletions
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }

const refetch = async () => {
	const commits = await safeFetch(
		"https://api.github.com/repos/nexpid/VendettaMonetTheme/commits?path=patches.jsonc",
		{
			cache: "no-store",
		},
	)
		.then(x =>
			x.json().catch((err: any) => {
				showToast(
					"Failed to parse GitHub commits!",
					getAssetIDByName("CircleXIcon-primary"),
				);
				logger.error("useCommits refetch error (parse)", err);
				return null;
			})
		)
		.catch((err: any) => {
			showToast(
				"Failed to fetch GitHub commits!",
				getAssetIDByName("CircleXIcon-primary"),
			);
			logger.error("useCommits refetch error (fetch)", err);
			return null;
		});

	data.commits = commits;
	data.canRefetch = Date.now() + refetchTimeout;

	for (const fnc of uponRevalidate) fnc(commits);
};

const useCommits = (() => {
	const [commits, setCommits] = React.useState(data.commits);
	const revalFunc = (data: any) => setCommits(data);

	React.useEffect(() => {
		uponRevalidate.add(revalFunc);
		return () => void uponRevalidate.delete(revalFunc);
	});

	React.useEffect(
		() => void ((!commits || data.canRefetch >= Date.now()) && refetch()),
		[],
	);

	return {
		commits,
		revalidate: async () => {
			if (canRevalidate < Date.now()) return;
			canRevalidate = Number.NaN;

			await refetch();
			canRevalidate = Date.now() + revalidateTimeout;
		},
	};
}) as {
	(): { commits: CommitObj[] | null; revalidate: () => Promise<void> };
	commits: Promise<CommitObj[] | null> | CommitObj[] | null;
};

Object.defineProperty(useCommits, "commits", {
	get: () => !data.commits ? refetch().then(() => data.commits) : data.commits,
});

export default useCommits;
