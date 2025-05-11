import { logger } from "@vendetta";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { plugins } from "@vendetta/plugins";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Search } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { IconButton, RowButton } from "$/lib/redesign";
import { managePage } from "$/lib/ui";
import { formatBytes } from "$/types";

import { lang, vstorage } from "../..";
import { grabEverything } from "../../stuff/syncStuff";

export default function IgnoredPluginsPage() {
	const [search, setSearch] = React.useState("");
	const [sizedPlugins, setSizedPlugins] = React.useState<
		| {
			id: string;
			plugin: Plugin;
			size: number;
		}[]
		| null
	>(null);
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);

	React.useEffect(() => setSearch(""), []);
	React.useEffect(
		() =>
			void grabEverything(true)
				.then(val =>
					setSizedPlugins(
						Object.entries(plugins)
							.map(([id, plugin]) => ({
								id,
								plugin,
								size: (val.plugins[id]?.storage ?? "").length,
							}))
							.sort((a, b) => b.size - a.size),
					)
				)
				.catch(
					e => (
						showToast(
							"Failed to grab plugins womp womp what a bummer",
						), logger.error("grabEverything", e)
					),
				),
		[],
	);

	managePage(
		{
			title: lang.format("page.ignored_plugins.title", {
				count: vstorage.config.ignoredPlugins.length.toString(),
			}),
			headerRight: () => (
				<IconButton
					onPress={() => {
						showConfirmationAlert({
							title: lang.format(
								"alert.clear_ignored_plugins.title",
								{},
							),
							content: lang.format(
								"alert.clear_ignored_plugins.body",
								{},
							),
							confirmText: lang.format(
								"alert.clear_ignored_plugins.confirm",
								{},
							),
							confirmColor: "red" as ButtonColors,
							onConfirm: () => {
								vstorage.config.ignoredPlugins = [];
								forceUpdate();
							},
						});
					}}
					disabled={vstorage.config.ignoredPlugins.length === 0}
					icon={getAssetIDByName("TrashIcon")}
					size="sm"
					variant={vstorage.config.ignoredPlugins.length === 0
						? "secondary"
						: "destructive"}
				/>
			),
		},
		undefined,
		vstorage.config.ignoredPlugins.length,
	);

	if (!sizedPlugins) {
		return <RN.ActivityIndicator style={{ flex: 1 }} size="large" />;
	}

	return (
		<RN.FlatList
			ListHeaderComponent={
				<Search
					style={{ marginBottom: 10 }}
					onChangeText={x => {
						setSearch(x.toLowerCase());
					}}
				/>
			}
			style={{ paddingHorizontal: 10, paddingTop: 10 }}
			contentContainerStyle={{ paddingBottom: 20 }}
			ItemSeparatorComponent={() => <RN.View style={{ height: 8 }} />}
			data={sizedPlugins.filter(x =>
				x.plugin.manifest.name.toLowerCase().includes(search)
			)}
			renderItem={({ item: { id, plugin, size } }) => {
				return (
					<RowButton
						icon={getAssetIDByName(
							plugin.manifest.vendetta?.icon ?? "",
						)}
						label={plugin.manifest.name}
						subLabel={formatBytes(size)}
						arrow={false}
						trailing={
							<IconButton
								variant={vstorage.config.ignoredPlugins.includes(id)
									? "primary"
									: "secondary"}
								size="md"
								icon={getAssetIDByName(
									vstorage.config.ignoredPlugins.includes(id)
										? "EyeIcon"
										: "EyeSlashIcon",
								)}
								onPress={() => {
									if (
										vstorage.config.ignoredPlugins.includes(
											id,
										)
									) {
										vstorage.config.ignoredPlugins.splice(
											vstorage.config.ignoredPlugins.indexOf(
												id,
											),
											1,
										);
									} else vstorage.config.ignoredPlugins.push(id);
									forceUpdate();
								}}
							/>
						}
					/>
				);
			}}
		/>
	);
}
