import { findByStoreName } from "@vendetta/metro";
import { clipboard, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { Button } from "$/lib/redesign";
import { managePage } from "$/lib/ui";
import { deepEquals } from "$/types";

import { debugLog, debugLogs, initState, lang, showDebugLogs, vstorage } from "..";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { useCacheStore } from "../stores/CacheStore";
import { deleteData, getData, saveData } from "../stuff/api";
import { openOauth2Modal } from "../stuff/oauth2";
import { linkCacheSymbol } from "../stuff/songs";
import { infoCacheSymbol } from "../stuff/songs/info";
import { parseCacheSymbol } from "../stuff/songs/parse";
import type { Song, UserData } from "../types";
import AddSong from "./songs/AddSong";
import SongInfo from "./songs/SongInfo";

const { FormRow } = Forms;

const UserStore = findByStoreName("UserStore");

export const ModifiedDataContext = React.createContext({
	data: [],
	setData: () => null,
} as {
	data: UserData;
	setData: (data: UserData) => void;
});

function Songs({ isFetching }: { isFetching: boolean }) {
	const styles = stylesheet.createThemedStyleSheet({
		songDisabled: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
			opacity: 0.4,
		},
	});

	const { data, setData } = React.useContext(ModifiedDataContext);

	const [manPositions, setManPositions] = React.useState<
		Record<string, number>
	>({});
	const dervPositions = Object.fromEntries(
		data.map((item, index) => [item.service + item.type + item.id, index]),
	);

	// can't use useEffect/useMemo because it doesn't update instantly and causes a quick flicker
	const oldData = React.useRef(
		data.map(item => item.service + item.type + item.id).join(","),
	);
	const newData = data
		.map(item => item.service + item.type + item.id)
		.join(",");

	let positions = { ...dervPositions, ...manPositions };
	if (newData !== oldData.current) {
		oldData.current = newData;

		setManPositions({});
		positions = dervPositions;
	}

	return (
		<Reanimated.default.FlatList
			data={new Array(6)
				.fill(null)
				.map((_, i) =>
					!data[i] && (data[i - 1] || i === 0)
						? true
						: (data[i] ?? null)
				) as (Song | true | null)[]}
			extraData={positions}
			keyExtractor={(item, index) =>
				item === true
					? "add-song"
					: item
					? item.service + item.type + item.id
					: `empty-${index}`}
			renderItem={({ item, index }) =>
				item === true ? <AddSong disabled={isFetching} /> : item
					? (
						<SongInfo
							song={item}
							disabled={isFetching}
							index={index}
							itemCount={data.length}
							positions={positions}
							updatePos={setManPositions}
							commit={() => {
								const newData = Object.entries(positions)
									.map(([hash, index]) => ({
										item: data.find(
											item =>
												item.service
														+ item.type
														+ item.id
													=== hash,
										),
										index,
									}))
									.filter(({ item }) => item)
									.sort((a, b) => a.index - b.index)
									.map(({ item }) => item) as Song[];
								setData(newData);
							}}
						/>
					)
					: <FormRow label="" style={styles.songDisabled} />}
			style={isFetching && { opacity: 0.8 }}
			ItemSeparatorComponent={() => <RN.View style={{ height: 8 }} />}
		/>
	);
}

export default function Settings({ newData }: { newData?: UserData }) {
	useProxy(vstorage);

	const { isAuthorized } = useAuthorizationStore();
	const [isFetching, setIsFetching] = React.useState(false);

	const { data: _data } = useCacheStore();
	const [data, setData] = React.useState(newData ?? _data);
	const isDataModified = React.useMemo(
		() => data && _data && !deepEquals(data, _data),
		[data, _data],
	);

	const initial = React.useRef(true);
	React.useEffect(
		() => void (initial.current ? (initial.current = false) : setData(_data)),
		[_data],
	);

	const userId = UserStore.getCurrentUser()?.id ?? null;
	if (!initState.inits.includes(userId) && !newData) {
		debugLog("initState happening, fetching data!!!!");
		initState.inits.push(userId);
		isAuthorized()
			&& (setIsFetching(true), getData().finally(() => setIsFetching(false)));
	}

	const [isBusy, setIsBusy] = React.useState<string[]>([]);

	const setBusy = (x: string) => !isBusy.includes(x) && setIsBusy([...isBusy, x]);
	const unBusy = (x: string) => void setIsBusy(isBusy.filter(y => x !== y));

	managePage(
		{
			headerRight: () => (
				<Button
					size="sm"
					variant={isDataModified && !isFetching ? "primary" : "secondary"}
					disabled={!isDataModified || isFetching}
					loading={isFetching}
					text={lang.format("settings.update_songs", {})}
					onPress={() => {
						setIsFetching(true);
						saveData(data!)
							.then(() =>
								showToast(
									lang.format("toast.updated_songs", {}),
									getAssetIDByName("UploadIcon"),
								)
							)
							.finally(() => setIsFetching(false));
					}}
				/>
			),
		},
		null,
		isDataModified,
		isFetching,
		data,
	);

	return (
		<ModifiedDataContext.Provider value={{ data: data ?? [], setData }}>
			<RN.ScrollView>
				<BetterTableRowGroup
					title={lang.format("settings.songs.title", {})}
					icon={getAssetIDByName("MusicIcon")}
					padding
				>
					{isAuthorized() && data
						? <Songs isFetching={isFetching} />
						: !isAuthorized()
						? (
							<Text
								variant="text-md/semibold"
								color="TEXT_NORMAL"
								align="center"
							>
								{lang.format("settings.songs.auth_needed", {})}
							</Text>
						)
						: (
							<RN.ActivityIndicator
								size="small"
								style={{ flex: 1 }}
							/>
						)}
				</BetterTableRowGroup>
				<BetterTableRowGroup
					title="Authentication"
					icon={getAssetIDByName("LockIcon")}
				>
					{isAuthorized()
						? (
							<>
								<FormRow
									label={lang.format(
										"settings.auth.log_out.title",
										{},
									)}
									subLabel={lang.format(
										"settings.auth.log_out.description",
										{},
									)}
									leading={
										<FormRow.Icon
											source={getAssetIDByName(
												"DoorExitIcon",
											)}
										/>
									}
									destructive
									onPress={() =>
										!isBusy.length
										&& showConfirmationAlert({
											title: lang.format(
												"alert.log_out.title",
												{},
											),
											content: lang.format(
												"alert.log_out.body",
												{},
											),
											onConfirm: () => {
												useCacheStore
													.getState()
													.updateData(null);
												useAuthorizationStore
													.getState()
													.setToken(undefined);

												showToast(
													lang.format("toast.logout", {}),
													getAssetIDByName(
														"DoorExitIcon",
													),
												);
											},
										})}
								/>
								<FormRow
									label={lang.format(
										"settings.auth.delete_songs.title",
										{},
									)}
									subLabel={lang.format(
										"settings.auth.delete_songs.description",
										{},
									)}
									leading={isBusy.includes("delete_songs")
										? <RN.ActivityIndicator size="small" />
										: (
											<FormRow.Icon
												source={getAssetIDByName(
													"TrashIcon",
												)}
											/>
										)}
									onPress={() =>
										!isBusy.length
										&& showConfirmationAlert({
											title: lang.format(
												"alert.delete_songs.title",
												{},
											),
											content: lang.format(
												"alert.delete_songs.body",
												{},
											),
											confirmText: lang.format(
												"alert.delete_songs.confirm",
												{},
											),
											confirmColor: "red" as ButtonColors,
											onConfirm: async () => {
												setBusy("delete_songs");
												await deleteData();
												useAuthorizationStore
													.getState()
													.setToken(undefined);

												unBusy("delete_songs");
												showToast(
													lang.format(
														"toast.deleted_songs",
														{},
													),
													getAssetIDByName("TrashIcon"),
												);
											},
										})}
								/>
							</>
						)
						: (
							<FormRow
								label={lang.format("settings.auth.authorize", {})}
								leading={
									<FormRow.Icon
										source={getAssetIDByName("LinkIcon")}
									/>
								}
								trailing={FormRow.Arrow}
								onPress={openOauth2Modal}
							/>
						)}
					<FormRow
						label={lang.format(
							"settings.clear_link_cache.title",
							{},
						)}
						leading={
							<FormRow.Icon
								source={getAssetIDByName("LinkIcon")}
							/>
						}
						onPress={() => {
							showToast(
								lang.format("toast.cleared_link_cache", {}),
								getAssetIDByName("TrashIcon"),
							);
							(window as any)[infoCacheSymbol] = new Map();
							(window as any)[linkCacheSymbol] = new Map();
							(window as any)[parseCacheSymbol] = new Map();
						}}
					/>
				</BetterTableRowGroup>
				{showDebugLogs && (
					<Button
						variant="secondary"
						size="md"
						text="DO DIAGNOSTICS"
						icon={
							<RN.Image
								source={{
									uri:
										"https://cdn.discordapp.com/attachments/919655852724604978/1321246029148065883/plink.jpg?ex=676c89c0&is=676b3840&hm=d52249eecae923f738c0c3b2338cd56fa4e219b738e5def7a05358b3d6588a03&width=64&height=64",
								}}
								style={{
									width: 18,
									height: 18,
									marginRight: 4,
									borderRadius: 16,
								}}
							/>
						}
						onPress={() => {
							showToast("COPIED TO CLIPBOARD!!!!!!");
							clipboard.setString(
								`\`\`\`\n${debugLogs.join("\n")}\`\`\``,
							);
						}}
						style={{ paddingHorizontal: 12, marginVertical: 12 }}
					/>
				)}
				<RN.View style={{ height: 12 }} />
			</RN.ScrollView>
		</ModifiedDataContext.Provider>
	);
}
