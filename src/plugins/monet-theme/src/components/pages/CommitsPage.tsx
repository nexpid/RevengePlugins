import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import Text from "$/components/Text";
import { FlashList } from "$/deps";
import { managePage } from "$/lib/ui";
import { resolveSemanticColor } from "$/types";

import { vstorage } from "../..";
import Commit, { CommitState } from "../Commit";
import useCommits from "../hooks/useCommits";

export default function CommitsPage() {
	useProxy(vstorage);
	const { commits } = useCommits();

	managePage(
		{
			title: "Commits",
			headerRight: () => (
				<RN.Pressable
					android_ripple={{
						color: resolveSemanticColor(
							semanticColors.ANDROID_RIPPLE,
						),
					}}
					onPress={() => (
						(vstorage.patches.commit = undefined),
							showToast(
								"Using latest commit for patches",
								getAssetIDByName("ArrowAngleLeftUpIcon"),
							)
					)}
					disabled={!vstorage.patches.commit}
				>
					<Text
						variant={!vstorage.patches.commit
							? "text-md/normal"
							: "text-md/semibold"}
						color={!vstorage.patches.commit
							? "TEXT_MUTED"
							: "TEXT_BRAND"}
					>
						Use latest
					</Text>
				</RN.Pressable>
			),
		},
		null,
		vstorage.patches.commit,
	);

	const parsedCommits = React.useMemo(
		() =>
			commits
				? commits.map((commit, i) => ({
					commit,
					state: vstorage.patches.commit === commit.sha
						? CommitState.Selected
						: i === 0 && !vstorage.patches.commit
						? CommitState.Default
						: undefined,
				}))
				: [],
		[commits, vstorage.patches.commit],
	);

	return (
		<FlashList
			ItemSeparatorComponent={() => <RN.View style={{ height: 12 }} />}
			ListFooterComponent={<RN.View style={{ height: 20 }} />}
			estimatedItemSize={79.54}
			data={parsedCommits}
			extraData={vstorage.patches.commit}
			keyExtractor={item => item.commit.sha}
			renderItem={({ item: { commit, state } }) => (
				<Commit
					commit={commit}
					onPress={() => (vstorage.patches.commit = commit.sha)}
					state={state}
				/>
			)}
			removeClippedSubviews
		/>
	);
}
