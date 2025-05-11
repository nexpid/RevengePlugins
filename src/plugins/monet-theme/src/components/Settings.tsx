import { logger } from "@vendetta";
import { getDebugInfo } from "@vendetta/debug";
import {
	clipboard,
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
} from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { showInputAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { BetterTableRowGroup, BetterTableRowTitle } from "$/components/BetterTableRow";
import { RichText } from "$/components/RichText";
import Skeleton from "$/components/Skeleton";
import Text from "$/components/Text";
import { ContextMenu, IconButton, PressableScale } from "$/lib/redesign";
import type { ThemeDataWithPlus, VendettaSysColors } from "$/typings";

import RepainterIcon from "../../assets/icons/RepainterIcon.png";
import { getSysColors, hasTheme, vstorage } from "..";
import { apply, build } from "../stuff/buildTheme";
import { checkForURL, fetchRawTheme, parseTheme } from "../stuff/repainter";
import Color from "./Color";
import Commit from "./Commit";
import useCommits from "./hooks/useCommits";
import usePatches from "./hooks/usePatches";
import CommitsPage from "./pages/CommitsPage";
import { openConfigurePage } from "./pages/ConfigurePage";

const { FormRow, FormSwitchRow } = Forms;

export function setColorsFromDynamic(clr: VendettaSysColors) {
	vstorage.colors = {
		neutral1: clr.neutral1[7],
		neutral2: clr.neutral2[7],
		accent1: clr.accent1[7],
		accent2: clr.accent2[7],
		accent3: clr.accent3[7],
	};
}

export default () => {
	const navigation = NavigationNative.useNavigation();

	const { commits, revalidate: revalidateCommits } = useCommits();
	const { patches, revalidate: revalidatePatches } = usePatches();

	const [isLoadedTheme, setIsLoadedTheme] = React.useState(hasTheme());

	useProxy(vstorage);

	const styles = stylesheet.createThemedStyleSheet({
		pill: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 6,
			paddingVertical: 4,
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			borderRadius: 8,
		},
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 8,
		} as any,
		help: {
			width: 16,
			height: 16,
			tintColor: semanticColors.TEXT_BRAND,
			marginRight: 4,
		},
		labelIcon: {
			width: 14,
			height: 14,
			marginRight: 6,
			tintColor: semanticColors.TEXT_NORMAL,
		},
	});

	let showMessage: string | undefined = undefined;

	const debug = getDebugInfo() as any;
	const syscolors = getSysColors();

	if (debug.os.name !== "Android") {
		showMessage = "Dynamic colors are only available on Android.";
	} else if (debug.os.sdk < 31) {
		showMessage = "Dynamic colors are only available on Android 12+ (SDK 31+).";
	} else if (syscolors === null) showMessage = "Dynamic colors are unavailable.";

	const lastThemePressTime = React.useRef(0);

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			{showMessage && (
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
						style={styles.help}
					/>
					<Text variant="text-md/semibold" color={"TEXT_BRAND"}>
						{showMessage}
					</Text>
				</RN.View>
			)}
			<BetterTableRowGroup
				title="Colors"
				icon={getAssetIDByName("PaintPaletteIcon")}
				padding
			>
				<RN.View
					style={{
						marginBottom: 8,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
					}}
				>
					{syscolors && (
						<PressableScale
							android_ripple={styles.androidRipple}
							style={styles.pill}
							onPress={() => {
								setColorsFromDynamic(syscolors);
								showToast(
									"Autofilled colors",
									getAssetIDByName("PencilSparkleIcon"),
								);
							}}
						>
							<RN.Image
								source={getAssetIDByName("PencilSparkleIcon")}
								style={styles.labelIcon}
								resizeMode="cover"
							/>
							<Text
								variant="text-sm/semibold"
								color="TEXT_NORMAL"
							>
								Autofill
							</Text>
						</PressableScale>
					)}
					<PressableScale
						android_ripple={styles.androidRipple}
						style={styles.pill}
						onPress={async () => {
							const link = checkForURL(
								(await clipboard.getString()) ?? "",
							);
							showInputAlert({
								title: "Enter Repainter link",
								placeholder: "https://repainter.app/themes/123ABC",
								initialValue: link,
								confirmText: "Use",
								onConfirm: async i => {
									const link = checkForURL(i);
									if (!link) {
										throw new Error(
											"No Repainter link found!",
										);
									}

									const theme = parseTheme(
										await fetchRawTheme(link),
									);
									vstorage.colors = theme.colors;

									showToast(
										"Imported Repainter theme",
										// @ts-expect-error Invalid type!!
										RepainterIcon,
									);
								},
								confirmColor: "brand" as ButtonColors,
								cancelText: "Cancel",
							});
						}}
					>
						<RN.Image
							source={RepainterIcon}
							style={styles.labelIcon}
							resizeMode="cover"
						/>
						<Text variant="text-sm/semibold" color="TEXT_NORMAL">
							Use Repainter theme
						</Text>
					</PressableScale>
				</RN.View>
				<RN.View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Color
						title={"Neutral"}
						color={vstorage.colors.neutral1}
						update={c => (vstorage.colors.neutral1 = c)}
					/>
					<Color
						title={"Neutral variant"}
						color={vstorage.colors.neutral2}
						update={c => (vstorage.colors.neutral2 = c)}
					/>
					<Color
						title={"Primary"}
						color={vstorage.colors.accent1}
						update={c => (vstorage.colors.accent1 = c)}
					/>
					<Color
						title={"Secondary"}
						color={vstorage.colors.accent2}
						update={c => (vstorage.colors.accent2 = c)}
					/>
					<Color
						title={"Tertiary"}
						color={vstorage.colors.accent3}
						update={c => (vstorage.colors.accent3 = c)}
					/>
				</RN.View>
			</BetterTableRowGroup>
			<BetterTableRowTitle
				title="Theme"
				icon={getAssetIDByName("SettingsIcon")}
				onPress={() => {
					if (lastThemePressTime.current >= Date.now()) {
						lastThemePressTime.current = 0;

						const otter = vstorage.patches.from === "local" ? "git" : "local";
						showToast(
							`Switched to ${otter === "git" ? "GitHub" : "local"} patches`,
							getAssetIDByName("RetryIcon"),
						);
						vstorage.patches.from = otter;
						revalidatePatches();
					} else lastThemePressTime.current = Date.now() + 750;
				}}
				padding
			/>
			{!commits
				? <Skeleton height={79.54} style={{ marginHorizontal: 16 }} />
				: Array.isArray(commits)
				? (
					<ContextMenu
						title="Patches"
						items={[
							{
								label: "Use latest",
								variant: "default",
								action: () => (
									(vstorage.patches.commit = undefined),
										showToast(
											"Using latest commit for patches",
											getAssetIDByName("ArrowAngleLeftUpIcon"),
										)
								),
								iconSource: getAssetIDByName(
									"ArrowAngleLeftUpIcon",
								),
							},
						]}
						triggerOnLongPress
					>
						{(props: any) => (
							<Commit
								commit={commits.find(
									x => x.sha === vstorage.patches.commit,
								) ?? commits[0]}
								onPress={() =>
									navigation.push("VendettaCustomPage", {
										render: CommitsPage,
									})}
								contextProps={props}
							/>
						)}
					</ContextMenu>
				)
				: (
					<RN.View
						style={{
							marginTop: 35,
							marginBottom: 20,
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Text
							variant="text-md/semibold"
							color="TEXT_DANGER"
							align="center"
						>
							You've been ratelimited by GitHub.
						</Text>
						<Text
							variant="text-md/semibold"
							color="TEXT_DANGER"
							align="center"
							onPress={revalidateCommits}
						>
							<RichText.Underline>Tap to retry</RichText.Underline>
						</Text>
					</RN.View>
				)}
			{!patches
				? (
					<Skeleton
						height={308.36}
						style={{ marginHorizontal: 16, marginTop: 8 }}
					/>
				)
				: (
					<BetterTableRowGroup nearby>
						<FormRow
							label="Load Theme"
							leading={
								<FormRow.Icon
									source={getAssetIDByName("WrenchIcon")}
								/>
							}
							trailing={
								<IconButton
									onPress={() => apply(null) && setIsLoadedTheme(false)}
									disabled={!isLoadedTheme}
									size="sm"
									variant={isLoadedTheme ? "destructive" : "secondary"}
									icon={getAssetIDByName("TrashIcon")}
								/>
							}
							onPress={async () => {
								let theme: ThemeDataWithPlus;
								try {
									theme = build(patches);
								} catch (e) {
									const err = e instanceof Error
										? e
										: new Error(String(e));
									logger.error(
										"Error during applying theme",
										err.stack,
									);

									showToast(
										String(err),
										getAssetIDByName("CircleXIcon-primary"),
									);
									return;
								}

								if (apply(theme)) setIsLoadedTheme(true);
							}}
						/>
						<FormRow
							label="Configure Theme"
							leading={
								<FormRow.Icon
									source={getAssetIDByName("SettingsIcon")}
								/>
							}
							trailing={<FormRow.Arrow />}
							onPress={() => {
								openConfigurePage(navigation);
							}}
						/>
						<FormSwitchRow
							label="Automatically Reapply Theme"
							subLabel="Automatically reapplies Monet Theme when you change your Discord color scheme or restart the app"
							leading={
								<FormRow.Icon
									source={getAssetIDByName("DownloadIcon")}
								/>
							}
							onValueChange={() => (vstorage.reapply.enabled = !vstorage.reapply.enabled)}
							value={vstorage.reapply.enabled}
						/>
						<FormRow
							label="Reload Theme Patches"
							subLabel={`Patch v${patches.version} (${
								vstorage.patches.from === "local"
									? "from a local source"
									: "from GitHub"
							})`}
							leading={
								<FormRow.Icon
									source={getAssetIDByName("ActivitiesIcon")}
								/>
							}
							onPress={revalidatePatches}
						/>
					</BetterTableRowGroup>
				)}
			<RN.View style={{ height: 12 }} />
		</RN.ScrollView>
	);
};
