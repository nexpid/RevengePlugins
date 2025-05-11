import { React, ReactNative as RN, stylesheet, url } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { Lang } from "$/lang";
import { Button, FloatingActionButton } from "$/lib/redesign";
import { openModal } from "$/types";

import { lang, PatchType } from "..";
import { state, useState } from "../stuff/active";
import load from "../stuff/loader";
import ConfigModal from "./modals/ConfigModal";

const ListItem = ({
	state,
	index,
	children,
	trolley,
}: React.PropsWithChildren<{
	state: boolean;
	index: number;
	trolley: boolean;
}>) => {
	const trolleySupercalifragilisticexpialidocious = Reanimated.useSharedValue("0deg");

	const color = state ? "TEXT_POSITIVE" : "TEXT_DANGER";

	const styles = stylesheet.createThemedStyleSheet({
		icon: {
			tintColor: semanticColors[color],
			width: 16,
			height: 16,
			marginTop: 3,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 4,
		},
	});

	React.useEffect(() => {
		if (trolley) {
			trolleySupercalifragilisticexpialidocious.value = Reanimated.withRepeat(
				Reanimated.withTiming("360deg", {
					duration: 1000,
					easing: Reanimated.Easing.linear,
				}),
				-1,
				false,
			);
		}
	}, []);

	const thing = Reanimated.FadeInLeft.duration(200)
		.easing(Reanimated.Easing.out(Reanimated.Easing.ease))
		.delay(index * 25);

	return (
		<Reanimated.default.View
			style={[
				styles.row,
				{
					transform: [
						{
							rotateY: trolleySupercalifragilisticexpialidocious,
							rotateZ: trolleySupercalifragilisticexpialidocious,
						},
						{
							perspective: 100,
						},
					],
				} as any,
			]}
			entering={thing}
			exiting={out}
		>
			<RN.Image
				source={state
					? getAssetIDByName("CircleCheckIcon-primary")
					: getAssetIDByName("CircleXIcon-primary")}
				style={styles.icon}
				resizeMode="cover"
			/>
			<Text
				variant={state ? "text-md/semibold" : "text-md/medium"}
				color={color}
			>
				{children}
			</Text>
		</Reanimated.default.View>
	);
};

let startTrollingTimeout: any;
let startTrollingCounter = 0;

const transition = Reanimated.LinearTransition.duration(100).easing(
	Reanimated.Easing.inOut(Reanimated.Easing.ease),
);
const inUp = Reanimated.FadeInUp.duration(200).easing(
	Reanimated.Easing.out(Reanimated.Easing.ease),
);
const out = Reanimated.FadeOut.duration(80).easing(Reanimated.Easing.ease);

export default function() {
	useState();

	const trolley = React.useMemo(() => {
		if (!startTrollingTimeout) {
			startTrollingTimeout = setTimeout(() => {
				startTrollingCounter = 0;
				startTrollingTimeout = null;
			}, 5_000);
		}
		startTrollingCounter++;

		if (startTrollingCounter >= 3) {
			clearTimeout(startTrollingTimeout);
			startTrollingCounter = 0;
			return true;
		}
		return false;
	}, []);

	const styles = stylesheet.createThemedStyleSheet({
		base: {
			width: "100%",
			height: "100%",
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: 12,
			gap: 15,
		},
		container: {
			width: "100%",
			padding: 12,
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			borderColor: semanticColors.BORDER_FAINT,
			borderWidth: 1,
			borderRadius: 16,
			gap: 2,
			overflow: "hidden",
		},
		bottomButtons: {
			width: "100%",
			flexDirection: "row",
			alignItems: "center",
			gap: trolley ? 0 : 8,
		},
		titleIcon: {
			tintColor: semanticColors.TEXT_NORMAL,
			width: 20,
			height: 20,
		},
		btnIcon: {
			tintColor: semanticColors.REDESIGN_BUTTON_PRIMARY_TEXT,
			width: 20,
			height: 20,
			marginRight: 4,
		},
		btnIconSecdonary: {
			tintColor: semanticColors.REDESIGN_BUTTON_SECONDARY_TEXT,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			marginBottom: 2,
		},
	});

	const trolleyRot = Reanimated.useSharedValue("0deg");
	const trolleyShake = Reanimated.useSharedValue("0deg");
	const trolleyClyde = Reanimated.useSharedValue("0deg");

	React.useEffect(() => {
		if (!trolley) return;
		trolleyRot.value = Reanimated.withRepeat(
			Reanimated.withTiming("360deg", {
				duration: 600,
				easing: Reanimated.Easing.linear,
			}),
			-1,
			false,
		);

		trolleyShake.value = "-7deg";
		trolleyShake.value = Reanimated.withRepeat(
			Reanimated.withTiming("7deg", { duration: 200 }),
			-1,
			true,
		);

		trolleyClyde.value = Reanimated.withRepeat(
			Reanimated.withTiming("360deg", {
				duration: 1500,
				easing: Reanimated.Easing.linear,
			}),
			-1,
			false,
		);
	}, []);

	return (
		<RN.View style={styles.base}>
			<Reanimated.default.View
				style={[
					styles.container,
					{ transform: [{ rotate: trolleyShake }] },
				]}
				layout={transition}
			>
				{state.loading
					? (
						<RN.ActivityIndicator
							size="large"
							style={{ flex: 1, marginVertical: 30 }}
						/>
					)
					: (
						<>
							<Reanimated.default.View
								style={styles.row}
								entering={inUp}
								exiting={out}
							>
								<Reanimated.default.Image
									source={trolley
										? getAssetIDByName("clyde-avatar")
										: state.active
										? getAssetIDByName(
											"CircleCheckIcon-primary",
										)
										: getAssetIDByName(
											"CircleXIcon-primary",
										)}
									style={trolley
										? {
											width: 100,
											height: 100,
											borderRadius: 25,
											transform: [
												{ rotateY: trolleyClyde },
												{ perspective: 100 },
											],
										}
										: styles.titleIcon}
									resizeMode="cover"
								/>
								<Text
									variant="text-lg/semibold"
									color="TEXT_NORMAL"
								>
									{trolley
										? (
											<>
												Themes+ is{" "}
												<Text
													variant="heading-xxl/bold"
													color="TEXT_WARNING"
												>
													AAAAAAAAAAAAAAAAAAAAAAAAAHHHH AAAAAAAAAAAA AAAAAAAGHHHHHHHHH
												</Text>
											</>
										)
										: (
											Lang.basicFormat(
												lang.format("settings.header", {
													active: state.active,
												}),
											)
										)}
								</Text>
							</Reanimated.default.View>
							{state.active
								? Object.values(PatchType)
									.sort((a, b) => {
										const isA = state.patches.includes(a);
										const isB = state.patches.includes(b);

										// patches are sorted by their activity & alphabetically
										if (isA === isB) {
											return a < b ? -1 : a > b ? 1 : 0;
										}
										return isA ? -1 : isB ? 1 : 0;
									})
									.map((x, i) => (
										<ListItem
											key={x}
											index={i}
											state={state.patches.includes(x)}
											trolley={trolley}
										>
											{lang.format(
												`settings.patch.${x}`,
												{},
											)}
										</ListItem>
									))
								: state.inactive.map((x, i) => (
									<ListItem
										key={x}
										index={i}
										state={false}
										trolley={trolley}
									>
										{lang.format(
											`settings.inactive.${x}`,
											{},
										)}
									</ListItem>
								))}
						</>
					)}
			</Reanimated.default.View>

			<Reanimated.default.View
				style={[
					styles.bottomButtons,
					{ transform: [{ rotate: trolleyRot }] },
				]}
				layout={transition}
			>
				<Button
					size={trolley ? "sm" : "md"}
					variant="primary"
					text={lang.format("settings.reload", {})}
					iconPosition="start"
					icon={
						<RN.Image
							source={getAssetIDByName("RetryIcon")}
							style={styles.btnIcon}
							resizeMode="cover"
						/>
					}
					onPress={() => !state.loading && load()}
					loading={state.loading}
					style={{ flex: trolley ? 0.25 : 0.5 }}
				/>
				<Button
					size={trolley ? "lg" : "md"}
					variant="secondary"
					text={trolley
						? `${lang.format("modal.config.title", {}).toUpperCase()}!!!!!!!`
						: lang.format("modal.config.title", {})}
					iconPosition="start"
					icon={
						<RN.Image
							source={getAssetIDByName("SettingsIcon")}
							style={[
								styles.btnIcon,
								styles.btnIconSecdonary,
								trolley ? { width: 60, height: 60 } : null,
							]}
							resizeMode="cover"
						/>
					}
					onPress={() => {
						openModal("config-modal", ConfigModal);
					}}
					style={{ flex: trolley ? 0.75 : 0.5 }}
				/>
			</Reanimated.default.View>
			<FloatingActionButton
				icon={getAssetIDByName("CircleQuestionIcon-primary")}
				positionBottom={16}
				onPress={() => url.openURL("https://github.com/nexpid/ThemesPlus")}
			/>
		</RN.View>
	);
}
