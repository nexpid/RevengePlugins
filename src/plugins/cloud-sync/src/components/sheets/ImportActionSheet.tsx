import { settings } from "@vendetta";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { plugins } from "@vendetta/plugins";
import { themes } from "@vendetta/themes";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { ActionSheet, hideActionSheet } from "$/components/ActionSheet";
import Text from "$/components/Text";
import { Button } from "$/lib/redesign";

import { canImport, isPluginProxied, lang } from "../..";
import { useCacheStore } from "../../stores/CacheStore";
import { getFonts, hasFontByName, hasFontBySource } from "../../stuff/fonts";
import { importData, type SyncImportOptions } from "../../stuff/syncStuff";
import type { UserData } from "../../types";
import { openImportLogsPage } from "../pages/ImportLogsPage";

const { FormCheckboxRow } = Forms;

export default function ImportActionSheet({
	defOptions,
	data = useCacheStore.getState().data!,
	navigation,
}: {
	defOptions?: SyncImportOptions;
	data?: UserData;
	navigation: any;
}) {
	const fonts = getFonts();
	const has = {
		unproxiedPlugins: Object.keys(data.plugins).filter(
			id => !plugins[id] && !isPluginProxied(id) && canImport(id),
		).length,
		plugins: Object.keys(data.plugins).filter(
			id => !plugins[id] && isPluginProxied(id) && canImport(id),
		).length,
		themes: Object.keys(data.themes).filter(id => !themes[id]).length,
		fonts: Object.keys(data.fonts.installed).filter(
			id => !hasFontBySource(id, fonts),
		).length
			+ data.fonts.custom.filter(({ name }) => !hasFontByName(name, fonts))
				.length,
	};
	const total = [has.unproxiedPlugins, has.plugins, has.themes].reduce(
		(x, a) => x + a,
		0,
	);
	const [options, setOptions] = React.useState<SyncImportOptions>(
		defOptions ?? {
			unproxiedPlugins: false,
			plugins: !!has.plugins,
			themes: !!has.themes,
			fonts: !!has.fonts,
		},
	);

	const styles = stylesheet.createThemedStyleSheet({
		icon: {
			width: 18,
			height: 18,
			tintColor: semanticColors.TEXT_BRAND,
			marginRight: 4,
		},
		btnIcon: {
			tintColor: semanticColors.TEXT_NORMAL,
			marginRight: 8,
		},
	});

	return (
		<ActionSheet title={lang.format("sheet.import_data.title", {})}>
			{!total && (
				<RN.View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						marginTop: 8,
					}}
				>
					<RN.Image
						source={getAssetIDByName(
							"CircleInformationIcon-primary",
						)}
						style={styles.icon}
						resizeMode="cover"
					/>
					<Text
						variant="text-md/semibold"
						color="TEXT_BRAND"
						align="center"
					>
						{lang.format("sheet.import_data.already_synced", {})}
					</Text>
				</RN.View>
			)}
			<FormCheckboxRow
				label={lang.format("sheet.import_data.unproxied_plugins", {
					count: String(has.unproxiedPlugins),
				})}
				disabled={!has.unproxiedPlugins}
				onPress={() =>
					has.unproxiedPlugins
					&& (!options.unproxiedPlugins
							&& !defOptions
							&& !settings.developerSettings
						? showConfirmationAlert({
							title: lang.format(
								"alert.unproxied_plugin_warn.title",
								{},
							),
							content: lang.format(
								"alert.unproxied_plugin_warn.body",
								{},
							),
							isDismissable: true,
							confirmText: lang.format(
								"alert.unproxied_plugin_warn.confirm",
								{},
							),
							onConfirm: () => {
								ActionSheet.open(ImportActionSheet, {
									data,
									navigation,
									defOptions: {
										...options,
										unproxiedPlugins: true,
									},
								});
							},
						})
						: setOptions({
							...options,
							unproxiedPlugins: !options.unproxiedPlugins,
						}))}
				selected={options.unproxiedPlugins}
			/>
			<FormCheckboxRow
				label={lang.format("sheet.import_data.plugins", {
					count: String(has.plugins),
				})}
				disabled={!has.plugins}
				onPress={() =>
					has.plugins
					&& setOptions({
						...options,
						plugins: !options.plugins,
					})}
				selected={options.plugins}
			/>
			<FormCheckboxRow
				label={lang.format("sheet.import_data.themes", {
					count: String(has.themes),
				})}
				disabled={!has.themes}
				onPress={() =>
					has.themes
					&& setOptions({
						...options,
						themes: !options.themes,
					})}
				selected={options.themes}
			/>
			<FormCheckboxRow
				label={lang.format("sheet.import_data.fonts", {
					count: String(has.fonts),
				})}
				disabled={!has.fonts}
				onPress={() =>
					has.fonts
					&& setOptions({
						...options,
						fonts: !options.fonts,
					})}
				selected={options.fonts}
			/>
			<Button
				text={lang.format("sheet.import_data.import", {})}
				variant="primary"
				size="md"
				iconPosition="start"
				icon={getAssetIDByName("DownloadIcon")}
				onPress={() => {
					openImportLogsPage(navigation);
					importData(data, options);
					hideActionSheet();
				}}
				style={{
					marginHorizontal: 16,
					marginVertical: 16,
				}}
				disabled={!options.unproxiedPlugins
					&& !options.plugins
					&& !options.themes
					&& !options.fonts}
			/>
		</ActionSheet>
	);
}
