import {
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
} from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { ActionSheet } from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import ChooseSheet from "$/components/sheets/ChooseSheet";
import { TrailingText } from "$/components/Text";
import { Reanimated } from "$/deps";
import { Slider } from "$/lib/redesign";

import kazuma from "../../assets/kazuma.png";
import { lang, vstorage } from "..";
import { kyrDt, kyriuStyles } from "./Kiryu";

const { FormRow, FormSwitchRow } = Forms;

const rem = (rad: number) => rad * 16;
const height = Math.floor(rem((kyrDt.h / kyrDt.w) * 15));

const SettingsKyriu = () => {
	useProxy(vstorage);

	const styles = stylesheet.createThemedStyleSheet({
		preview: {
			height: height + 32,

			marginHorizontal: 16,
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			borderRadius: 8,
			borderWidth: 4,
			borderColor: semanticColors.BG_MOD_SUBTLE,
			borderStyle: "dotted",

			flexDirection: "row",
			justifyContent: vstorage.styling.xPos === "left"
				? "flex-start"
				: vstorage.styling.xPos === "right"
				? "flex-end"
				: "center",
			alignItems: "flex-start",

			overflow: "hidden",
		},
	});

	let yPosOff = 0;
	let yPos = 0;

	if (vstorage.styling.yPos === "top") {
		yPosOff = -height - rem(5);
		yPos = 0;
	} else if (vstorage.styling.yPos === "middle") {
		yPosOff = -height - rem(5);
		yPos = 16;
	} else {
		yPosOff = height + 32 + rem(5);
		yPos = 32;
	}

	const posVal = Reanimated.useSharedValue(
		vstorage.appear.style === "fly" ? yPosOff : yPos,
	);
	const opVal = Reanimated.useSharedValue(
		vstorage.appear.style !== "fade" ? vstorage.styling.opacity / 10 : 0,
	);
	const rotVal = Reanimated.useSharedValue(
		vstorage.effects.swinging.enabled ? "-5deg" : "0deg",
	);
	const scaleVal = Reanimated.useSharedValue(1);

	React.useEffect(() => {
		posVal.value = vstorage.appear.style === "fly" ? yPosOff : yPos;
		opVal.value = vstorage.appear.style !== "fade" ? vstorage.styling.opacity / 10 : 0;
		rotVal.value = vstorage.effects.swinging.enabled ? "-5deg" : "0deg";

		if (vstorage.appear.style === "fly") {
			posVal.value = Reanimated.withTiming(yPos, {
				duration: vstorage.appear.speed,
				easing: Reanimated.Easing.out(Reanimated.Easing.back(1.5)),
			});
		} else if (vstorage.appear.style === "fade") {
			opVal.value = Reanimated.withTiming(vstorage.styling.opacity / 10, {
				duration: vstorage.appear.speed,
			});
		}

		if (vstorage.effects.swinging.enabled) {
			rotVal.value = Reanimated.withRepeat(
				Reanimated.withTiming("5deg", {
					duration: vstorage.effects.swinging.speed,
				}),
				-1,
				true,
			);
		}

		if (vstorage.effects.bounce.enabled) {
			scaleVal.value = Reanimated.withRepeat(
				Reanimated.withSequence(
					Reanimated.withTiming(vstorage.effects.bounce.multiplier, {
						duration: 0,
					}),
					Reanimated.withTiming(1, {
						duration: vstorage.effects.bounce.speed,
					}),
					Reanimated.withTiming(1, { duration: 450 }),
				),
				-1,
				true,
			);
		} else scaleVal.value = 1;
	});

	return (
		<RN.View style={styles.preview} pointerEvents="none">
			<Reanimated.default.View
				style={[
					kyriuStyles.frame,
					{
						marginTop: posVal,
						opacity: opVal,
						transform: [{ rotate: rotVal }, { scale: scaleVal }],
					},
				]}
			>
				<RN.Image
					source={kazuma}
					style={kyriuStyles.empty}
					resizeMode="stretch"
				/>
			</Reanimated.default.View>
		</RN.View>
	);
};

type Category = "styling" | "appear" | "effects";
const categoryIcons = {
	styling: getAssetIDByName("PaintPaletteIcon"),
	appear: getAssetIDByName("ImageIcon"),
	effects: getAssetIDByName("MagicWandIcon"),
} satisfies Record<Category, number>;

const advance = (navigation: any, category: Category) =>
	navigation.push("VendettaCustomPage", {
		title: lang.format(`settings.${category}.title`, {}),
		render: Settings(category),
	});

const BasePage = ({ navigation }: { navigation: any }) => {
	return (
		<>
			<FormRow
				label={lang.format("settings.styling.title", {})}
				leading={<FormRow.Icon source={categoryIcons.styling} />}
				trailing={<FormRow.Arrow />}
				onPress={() => advance(navigation, "styling")}
			/>
			<FormRow
				label={lang.format("settings.appear.title", {})}
				leading={<FormRow.Icon source={categoryIcons.appear} />}
				trailing={<FormRow.Arrow />}
				onPress={() => advance(navigation, "appear")}
			/>
			<FormRow
				label={lang.format("settings.effects.title", {})}
				leading={<FormRow.Icon source={categoryIcons.effects} />}
				trailing={<FormRow.Arrow />}
				onPress={() => advance(navigation, "effects")}
			/>
		</>
	);
};

const StylingPage = () => {
	useProxy(vstorage);

	return (
		<>
			<FormRow
				label={lang.format("settings.styling.opacity", {})}
				leading={<FormRow.Icon source={getAssetIDByName("EyeDropperIcon")} />}
				trailing={
					<TrailingText>
						{Math.floor(vstorage.styling.opacity) / 10}
					</TrailingText>
				}
				onPress={() => (vstorage.styling.opacity = 10)}
			/>
			<Slider
				value={vstorage.styling.opacity}
				step={1}
				onValueChange={val => (vstorage.styling.opacity = val)}
				minimumValue={1}
				maximumValue={10}
			/>
			<FormRow
				label={lang.format("settings.styling.pos_x", {})}
				leading={<FormRow.Icon source={getAssetIDByName("SignPostIcon")} />}
				trailing={
					<TrailingText>
						{lang.format(
							`settings.styling.pos_x.${vstorage.styling.xPos}`,
							{},
						)}
					</TrailingText>
				}
				onPress={() => {
					ActionSheet.open(ChooseSheet, {
						title: lang.format("settings.styling.pos_x", {}),
						value: vstorage.styling.xPos,
						options: [
							{
								name: lang.format(
									"settings.styling.pos_x.left",
									{},
								),
								value: "left",
							},
							{
								name: lang.format(
									"settings.styling.pos_x.center",
									{},
								),
								value: "center",
							},
							{
								name: lang.format(
									"settings.styling.pos_x.right",
									{},
								),
								value: "right",
							},
						],
						callback(v: any) {
							vstorage.styling.xPos = v;
						},
					});
				}}
			/>
			<FormRow
				label={lang.format("settings.styling.pos_y", {})}
				leading={<FormRow.Icon source={getAssetIDByName("SignPostIcon")} />}
				trailing={
					<TrailingText>
						{lang.format(
							`settings.styling.pos_y.${vstorage.styling.yPos}`,
							{},
						)}
					</TrailingText>
				}
				onPress={() => {
					ActionSheet.open(ChooseSheet, {
						title: lang.format("settings.styling.pos_y", {}),
						value: vstorage.styling.yPos,
						options: [
							{
								name: lang.format(
									"settings.styling.pos_y.top",
									{},
								),
								value: "top",
							},
							{
								name: lang.format(
									"settings.styling.pos_y.middle",
									{},
								),
								value: "middle",
							},
							{
								name: lang.format(
									"settings.styling.pos_y.bottom",
									{},
								),
								value: "bottom",
							},
						],
						callback(v: any) {
							vstorage.styling.yPos = v;
						},
					});
				}}
			/>
		</>
	);
};

const AppearPage = () => {
	useProxy(vstorage);

	return (
		<>
			<FormRow
				label={lang.format("settings.appear.style", {})}
				leading={<FormRow.Icon source={getAssetIDByName("BicycleIcon")} />}
				trailing={
					<TrailingText>
						{lang.format(
							`settings.appear.style.${vstorage.appear.style}`,
							{},
						)}
					</TrailingText>
				}
				onPress={() => {
					ActionSheet.open(ChooseSheet, {
						title: lang.format("settings.appear.style", {}),
						value: vstorage.appear.style,
						options: [
							{
								name: lang.format(
									"settings.appear.style.fly",
									{},
								),
								value: "fly",
							},
							{
								name: lang.format(
									"settings.appear.style.fade",
									{},
								),
								value: "fade",
							},
							{
								name: lang.format(
									"settings.appear.style.always",
									{},
								),
								value: "always",
							},
						],
						callback(v: any) {
							vstorage.appear.style = v;
						},
					});
				}}
			/>
			<FormRow
				label={lang.format("settings.appear.speed", {})}
				leading={<FormRow.Icon source={getAssetIDByName("NitroWheelIcon")} />}
				trailing={
					<TrailingText>
						{Math.floor(vstorage.appear.speed / 100) / 10}s
					</TrailingText>
				}
				onPress={() => (vstorage.appear.speed = 500)}
			/>
			<Slider
				value={vstorage.appear.speed}
				step={100}
				onValueChange={val => (vstorage.appear.speed = val)}
				minimumValue={100}
				maximumValue={1500}
			/>
		</>
	);
};

const EffectsPage = () => {
	useProxy(vstorage);

	return (
		<>
			<BetterTableRowGroup
				title={lang.format("settings.effects.title", {})}
				icon={categoryIcons.effects}
			>
				<FormSwitchRow
					label={lang.format("settings.effects.swinging.enabled", {})}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("ActivitiesIcon")}
						/>
					}
					onValueChange={() => (vstorage.effects.swinging.enabled = !vstorage.effects
						.swinging.enabled)}
					value={vstorage.effects.swinging.enabled}
				/>
				<FormRow
					label={lang.format("settings.effects.swinging.speed", {})}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("NitroWheelIcon")}
						/>
					}
					trailing={
						<TrailingText>
							{Math.floor(vstorage.effects.swinging.speed / 100)
								/ 10}
							s
						</TrailingText>
					}
					onPress={() => (vstorage.effects.swinging.speed = 900)}
				/>
				<Slider
					value={vstorage.effects.swinging.speed}
					step={100}
					onValueChange={val => (vstorage.effects.swinging.speed = val)}
					minimumValue={100}
					maximumValue={1500}
				/>
			</BetterTableRowGroup>
			<BetterTableRowGroup nearby>
				<FormSwitchRow
					label={lang.format("settings.effects.bounce.enabled", {})}
					leading={<FormRow.Icon source={getAssetIDByName("ObjectIcon")} />}
					onValueChange={() => (vstorage.effects.bounce.enabled = !vstorage.effects.bounce
						.enabled)}
					value={vstorage.effects.bounce.enabled}
				/>
				<FormRow
					label={lang.format("settings.effects.bounce.speed", {})}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("NitroWheelIcon")}
						/>
					}
					trailing={
						<TrailingText>
							{Math.floor(vstorage.effects.bounce.speed / 100)
								/ 10}
							s
						</TrailingText>
					}
					onPress={() => (vstorage.effects.bounce.speed = 100)}
				/>
				<Slider
					value={vstorage.effects.bounce.speed}
					step={100}
					onValueChange={val => (vstorage.effects.bounce.speed = val)}
					minimumValue={100}
					maximumValue={1500}
				/>
				<FormRow
					label={lang.format(
						"settings.effects.bounce.multiplier",
						{},
					)}
					leading={
						<FormRow.Icon
							source={getAssetIDByName("SendMessageIcon")}
						/>
					}
					trailing={
						<TrailingText>
							{Math.floor(
								vstorage.effects.bounce.multiplier * 100,
							) / 100}
							x
						</TrailingText>
					}
					onPress={() => (vstorage.effects.bounce.multiplier = 1.05)}
				/>
				<Slider
					value={vstorage.effects.bounce.multiplier * 100}
					step={5}
					onValueChange={val => (vstorage.effects.bounce.multiplier = val / 100)}
					minimumValue={90}
					maximumValue={200}
				/>
			</BetterTableRowGroup>
		</>
	);
};

export default function Settings(category?: Category) {
	return () => {
		const navigation = NavigationNative.useNavigation();

		return (
			<RN.ScrollView style={{ flex: 1 }}>
				<SettingsKyriu />
				{category === "effects" ? <EffectsPage /> : (
					<BetterTableRowGroup
						title={lang.format(
							category
								? `settings.${category}.title`
								: "settings.title",
							{},
						)}
						icon={category
							? categoryIcons[category]
							: getAssetIDByName("SettingsIcon")}
					>
						{category === "styling"
							? <StylingPage />
							: category === "appear"
							? <AppearPage />
							: category === "effects"
							? <EffectsPage />
							: <BasePage navigation={navigation} />}
					</BetterTableRowGroup>
				)}
			</RN.ScrollView>
		);
	};
}
