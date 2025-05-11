import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import type { PressableProps } from "react-native";

import Text from "$/components/Text";
import { PressableScale, Stack } from "$/lib/redesign";
import { getDiscordTheme } from "$/types";

import { getLocale } from "$/lib/intlProxy";
import { vstorage } from "..";
import {
	conventionalCommitRegex,
	parseConventionalCommit,
} from "../stuff/conventionalCommits";

export interface CommitUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: false;
}
export interface CommitObj {
	sha: string;
	node_id: string;
	commit: {
		author: {
			name: string;
			email: string;
			date: string;
		};
		committer: {
			name: string;
			email: string;
			date: string;
		};
		message: string;
		tree: {
			sha: string;
			url: string;
		};
		url: string;
		comment_count: number;
		verification: {
			verified: boolean;
			reason: string;
			signature: any;
			payload: any;
		};
	};
	url: string;
	html_url: string;
	comments_url: string;
	author?: CommitUser;
	committer?: CommitUser;
	parents: {
		sha: string;
		url: string;
		html_url: string;
	}[];
}

export enum CommitState {
	Selected = 0,
	Default = 1,
}

const conventionalCommitLabelColors = {
	feat: [162, 238, 239, 180, 70, 78],
	fix: [215, 58, 74, 353, 66, 53],
	docs: [0, 117, 202, 205, 100, 39],
	build: [217, 63, 11, 15, 90, 44],
	refactor: [0, 107, 117, 185, 100, 22],
	test: [251, 202, 4, 48, 96, 50],
	ci: [197, 222, 245, 208, 70, 86],
	perf: [83, 25, 231, 256, 81, 50],
};

export default function Commit({
	commit,
	state,
	contextProps,
	...props
}: {
	commit: CommitObj;
	state?: CommitState;
	contextProps?: any;
} & PressableProps) {
	useProxy(vstorage);

	const styles = stylesheet.createThemedStyleSheet({
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 16,
		} as any,
		card: {
			padding: 16,
			borderRadius: 16,
			borderColor: semanticColors.BORDER_FAINT,
			borderWidth: 1,
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			marginHorizontal: 16,
		},
		cardSelected: {
			borderColor: semanticColors.TEXT_BRAND,
		},
		cardDefault: {
			borderColor: "#fffa",
		},
		title: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
		},
		avatar: {
			width: 18,
			height: 18,
			borderRadius: 11,
		},
		labelTitle: {
			transform: [{ translateY: -2 }],
		},
		label: {
			paddingHorizontal: 7,
			borderRadius: 100,
			borderWidth: 1,
			transform: [{ translateY: 2 }],
		},
	});

	let title = (
		<Text variant="text-md/medium" color="TEXT_NORMAL" lineClamp={1}>
			{commit.commit.message}
		</Text>
	);

	const labelTitle = parseConventionalCommit(commit.commit.message);
	if (labelTitle) {
		const labelColor = conventionalCommitLabelColors[
			labelTitle.rawType
		] ?? [255, 255, 255, 0, 0, 100];

		// color logic shamelessly stolen from GitHub
		const perceivedLightness = (labelColor[0] * 0.2126
			+ labelColor[1] * 0.7152
			+ labelColor[2] * 0.0722)
			/ 255;

		const lightnessThreshold = getDiscordTheme() === "light" ? 0.453 : 0.6;
		const lightnessSwitch = Math.max(
			0,
			Math.min(1 / (lightnessThreshold - perceivedLightness), 1),
		) * 100;
		const lightenBy = (lightnessThreshold - perceivedLightness) * lightnessSwitch;

		title = (
			<Text
				variant="text-md/medium"
				color="TEXT_NORMAL"
				style={styles.labelTitle}
				lineClamp={1}
			>
				<RN.View
					style={[
						styles.label,
						getDiscordTheme() === "light"
							? {
								backgroundColor: `rgb(${labelColor[0]}, ${labelColor[1]}, ${
									labelColor[2]
								})`,
								borderWidth: 0,
							}
							: {
								backgroundColor: `rgba(${labelColor[0]}, ${labelColor[1]}, ${
									labelColor[2]
								}, 0.3)`,
								borderColor: `hsla(${labelColor[3]}, ${labelColor[4]}%, ${
									labelColor[5] + lightenBy
								}%, 0.18)`,
							},
					]}
				>
					<RN.Text
						style={getDiscordTheme() === "light"
							? {
								color: `hsl(0, 0%, ${lightnessSwitch}%)`,
							}
							: {
								color: `hsl(${labelColor[3]}, ${labelColor[4]}%, ${
									labelColor[5] + lightenBy
								}%)`,
							}}
					>
						{labelTitle.type}
					</RN.Text>
				</RN.View>{" "}
				{labelTitle.scope && <Text color="TEXT_MUTED">{labelTitle.scope}</Text>}
				{commit.commit.message.replace(conventionalCommitRegex, "")}
			</Text>
		);
	}

	return (
		<PressableScale
			style={[
				styles.card,
				state === CommitState.Selected && styles.cardSelected,
				state === CommitState.Default && styles.cardDefault,
			]}
			android_ripple={styles.androidRipple}
			key={commit.sha}
			pointerEvents="box-only"
			{...contextProps}
			{...props}
		>
			<Stack spacing={6}>
				<RN.View style={styles.title}>
					<RN.Image
						style={styles.avatar}
						source={commit.committer
							? {
								uri: commit.committer.avatar_url,
								cache: "force-cache",
							}
							: getAssetIDByName("default_avatar_0")}
						resizeMode="cover"
					/>
					<Text
						variant="text-md/medium"
						color="TEXT_NORMAL"
						style={{ transform: [{ translateY: -1 }] }}
					>
						{commit.commit.committer.name}
					</Text>
					<Text
						variant="text-xs/medium"
						color="TEXT_MUTED"
						style={{ marginLeft: "auto" }}
					>
						{new Date(
							commit.commit.committer.date,
						).toLocaleDateString(getLocale())}
					</Text>
				</RN.View>
				{title}
			</Stack>
		</PressableScale>
	);
}
