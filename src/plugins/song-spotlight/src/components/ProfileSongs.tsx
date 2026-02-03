import { logger } from "@vendetta";
import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import type { ViewProps } from "react-native";

import { FlashList } from "$/deps";

import type { UserData } from "@song-spotlight/api/structs";
import { lang } from "..";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { useCacheStore } from "../stores/CacheStore";
import { getData, listData } from "../stuff/api";
import { sid } from "../stuff/songs";
import ProfileSong from "./songs/ProfileSong";

const { TableRowGroupTitle } = findByProps("TableRowGroup", "TableRow");

// pre 264.5
const YouScreenProfileCard = findByProps(
	"YouScreenProfileCard",
)?.YouScreenProfileCard;
const SimplifiedUserProfileCard = findByName("SimplifiedUserProfileCard");
const UserProfileSection = findByName("UserProfileSection");
const UserStore = findByStoreName("UserStore");
// post 264.5
const UserProfileCard = findByName("UserProfileCard");

export default function ProfileSongs({
	userId,
	variant,
	style,
}: {
	userId: string;
	variant?: "you" | "simplified" | "classic";
	customBorder?: string;
	style?: ViewProps["style"];
}) {
	const { isAuthorized } = useAuthorizationStore();
	if (!isAuthorized()) return null;

	const styles = stylesheet.createThemedStyleSheet({
		card: {
			backgroundColor: semanticColors.CARD_SECONDARY_BG,
			minHeight: 200,
		},
	});

	const { data: ownData } = useCacheStore();
	const [data, setData] = React.useState<UserData | undefined>(undefined);

	React.useEffect(() => {
		if (userId === UserStore.getCurrentUser()?.id) {
			setData(ownData);
			if (!ownData) getData();
			return;
		}
	}, [ownData, userId]);

	React.useEffect(() => {
		if (userId === UserStore.getCurrentUser()?.id) return;
		setData(undefined);

		listData(userId)
			.then(dt => setData(dt))
			.catch(e => {
				logger.error(
					"ProfileSongs",
					`failed while checking ${userId} (${variant} variant)`,
					e,
				);
			});
	}, [userId]);

	const [currentlyPlaying, setCurrentlyPlaying] = React.useState<
		string | null
	>(null);

	if (!data?.length) return null;

	const songs = (
		<FlashList
			ItemSeparatorComponent={() => <RN.View style={{ height: 8 }} />}
			data={data}
			extraData={[currentlyPlaying]}
			renderItem={({ item }) => (
				<ProfileSong
					song={item}
					playing={{ currentlyPlaying, setCurrentlyPlaying }}
				/>
			)}
			keyExtractor={item => sid(item)}
			scrollEnabled
			nestedScrollEnabled
			estimatedItemSize={167} // average of 92 (single) and 241.6 (entries)
		/>
	);

	if (variant === "you" && YouScreenProfileCard) {
		return (
			<YouScreenProfileCard style={{ minHeight: 200 }}>
				<TableRowGroupTitle title={lang.format("plugin.name", {})} />
				{songs}
			</YouScreenProfileCard>
		);
	}
	if (variant === "simplified" && SimplifiedUserProfileCard) {
		return (
			<SimplifiedUserProfileCard
				title={lang.format("plugin.name", {})}
				style={[styles.card, style]}
			>
				{songs}
			</SimplifiedUserProfileCard>
		);
	}
	// post 264.5
	if (UserProfileCard) {
		return (
			<UserProfileCard
				title={lang.format("plugin.name", {})}
				style={[styles.card, style]}
			>
				{songs}
			</UserProfileCard>
		);
	}
	// pre 264.5
	if (UserProfileSection) {
		return (
			<UserProfileSection
				title={lang.format("plugin.name", {})}
				style={{ minHeight: 200 }}
			>
				{songs}
			</UserProfileSection>
		);
	}
	return null;
}
