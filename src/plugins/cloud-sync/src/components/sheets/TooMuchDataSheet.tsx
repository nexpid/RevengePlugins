import { React } from "@vendetta/metro/common";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet, hideActionSheet } from "$/components/ActionSheet";
import ScaleRowButton from "$/components/ScaleRowButton";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { Button } from "$/lib/redesign";
import { formatBytes } from "$/types";

import { lang, vstorage } from "../..";
import { grabEverything } from "../../stuff/syncStuff";
import IgnoredPluginsPage from "../pages/IgnoredPluginsPage";

const antied = {
	old: "https://angelix1.github.io/VP/antied/",
	new: "https://angelix1.github.io/MP/angel/antied/",
};

export default function TooMuchDataSheet({ navigation }: { navigation: any }) {
	useProxy(plugins);

	const hasOldAntied = !!plugins[antied.old];
	const [data, setData] = React.useState<number | null>(null);

	React.useEffect(
		() =>
			void grabEverything()
				.then(val => setData(JSON.stringify(val).length))
				.catch(() => setData(0)),
		[],
	);

	return (
		<ActionSheet
			title={lang.format("alert.too_much_data.title", {})}
			style={{ gap: 12 }}
		>
			<Text
				variant="text-md/medium"
				color="TEXT_NORMAL"
				style={{ marginBottom: 8 }}
			>
				{Lang.basicFormat(
					lang.format("alert.too_much_data.body", {
						storage: data === null ? "... B" : formatBytes(data),
					}),
				)}
			</Text>
			{hasOldAntied && (
				<ScaleRowButton
					label={lang.format("alert.too_much_data.antied.label", {})}
					subLabel={lang.format(
						"alert.too_much_data.antied.desc",
						{},
					)}
					icon={getAssetIDByName("PencilIcon")}
					onPress={async () => {
						const { enabled } = plugins[antied.old];

						if (!plugins[antied.new]) {
							await installPlugin(antied.new, enabled)
								.then(
									() => (
										removePlugin(antied.old),
											showToast(
												lang.format(
													"toast.antied.installed",
													{},
												),
												getAssetIDByName("DownloadIcon"),
											)
									),
								)
								.catch(() =>
									showToast(
										lang.format("toast.antied.failed", {}),
										getAssetIDByName(
											"CircleWarningIcon-primary",
										),
									)
								);
						} else {
							removePlugin(antied.old),
								showToast(
									lang.format(
										"toast.antied.already_installed",
										{},
									),
									getAssetIDByName(
										"CircleWarningIcon-primary",
									),
								);
						}
					}}
					arrow={false}
				/>
			)}
			<ScaleRowButton
				label={lang.format(
					"alert.too_much_data.ignore_plugins.label",
					{},
				)}
				subLabel={lang.format(
					"alert.too_much_data.ignore_plugins.desc",
					{},
				)}
				icon={getAssetIDByName("ListBulletsIcon")}
				onPress={() => {
					hideActionSheet();
					navigation.push("VendettaCustomPage", {
						render: IgnoredPluginsPage,
					});
				}}
			/>
			<Button
				text={lang.format("alert.too_much_data.continue", {})}
				variant="primary"
				size="md"
				onPress={() => {
					hideActionSheet();
					vstorage.realTrackingAnalyticsSentToChina.tooMuchData = false;
				}}
				style={{ marginTop: 8 }}
			/>
		</ActionSheet>
	);
}
