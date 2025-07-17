// https://raw.githubusercontent.com/pyoncord/Bunny/dev/src/core/ui/settings/pages/Plugins/PluginCard.tsx
// this is a modified version with some plugin browser specific changes

import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { rawColors, semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { hideActionSheet, showSimpleActionSheet } from "$/components/ActionSheet";
import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { IconButton, Stack } from "$/lib/redesign";
import { lerp } from "$/types";

const { FormRow } = Forms;

// TODO: These styles work weirdly. iOS has cramped text, Android with low DPI probably does too. Fix?

const styles = stylesheet.createThemedStyleSheet({
	card: {
		padding: 16,
		borderRadius: 16,
		borderColor: semanticColors.BORDER_FAINT,
		borderWidth: 1,
		backgroundColor: semanticColors.CARD_PRIMARY_BG,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	title: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		flexShrink: 1,
	},
	pluginIcon: {
		tintColor: semanticColors.LOGO_PRIMARY,
		width: 18,
		height: 18,
	},
	actions: {
		flexDirection: "row-reverse",
		alignItems: "center",
		gap: 5,
	},
});

interface Action {
	label: string;
	icon: string;
	disabled?: boolean;
	isDestructive?: boolean;
	loading?: boolean;
	onPress: () => void;
}

type OverflowAction = Omit<Action, "loading">;

interface CardProps {
	headerLabel: React.ReactNode;
	headerSuffix?: React.ReactNode;
	headerSublabel?: React.ReactNode;
	headerIcon?: number;
	descriptionLabel?: string;
	actions: Action[];
	overflowTitle: string;
	overflowActions: OverflowAction[];
	highlight?: boolean;
	disabled?: boolean;
}

export default function Card(props: CardProps) {
	const baseColor = styles.card.backgroundColor as string;
	const highlightColor = lerp(
		baseColor,
		rawColors.BRAND_500,
		0.08,
	) as any as string;

	const color = Reanimated.useSharedValue(baseColor);

	React.useEffect(() => {
		color.value = baseColor;
		if (props.highlight) {
			color.value = Reanimated.withSequence(
				Reanimated.withTiming(highlightColor, {
					duration: 500,
					easing: Reanimated.Easing.cubic,
				}),
				Reanimated.withTiming(baseColor, {
					duration: 500,
					easing: Reanimated.Easing.cubic,
				}),
			);
		}
	}, [props.highlight]);

	return (
		<Reanimated.default.View
			style={[
				styles.card,
				{
					backgroundColor: color,
				},
				props.disabled && { opacity: 0.5 },
			]}
		>
			<Stack spacing={16}>
				<RN.View style={styles.content}>
					<Stack spacing={0} style={{ flex: 1 }}>
						<RN.View style={styles.title}>
							{props.headerIcon && (
								<RN.Image
									style={styles.pluginIcon}
									resizeMode="cover"
									source={props.headerIcon}
								/>
							)}
							<Text
								variant="heading-lg/semibold"
								color="HEADER_PRIMARY"
								lineClamp={1}
								ellipsis="tail"
								style={{ flexShrink: 1 }}
							>
								{props.headerLabel}
							</Text>
							{props.headerSuffix}
						</RN.View>
						{props.headerSublabel && (
							<Text variant="text-md/semibold" color="TEXT_MUTED">
								{props.headerSublabel}
							</Text>
						)}
					</Stack>
					<RN.View>
						<Stack spacing={5} direction="horizontal">
							{props.actions?.map(
								({
									label,
									icon,
									onPress,
									isDestructive,
									loading,
									disabled,
								}) => (
									<IconButton
										key={label}
										onPress={onPress}
										disabled={disabled}
										loading={loading}
										size="sm"
										variant={isDestructive
											? "destructive"
											: "secondary"}
										icon={getAssetIDByName(icon)}
									/>
								),
							)}
							{props.overflowActions && (
								<IconButton
									onPress={() => {
										showSimpleActionSheet({
											key: "CardOverflow",
											header: {
												title: props.overflowTitle,
												icon: props.headerIcon
													&& props.headerIcon && (
													<FormRow.Icon
														source={props.headerIcon}
													/>
												),
												onClose: hideActionSheet,
											},
											options: props.overflowActions?.map(
												i => ({
													...i,
													icon: getAssetIDByName(
														i.icon,
													),
												}),
											),
										});
									}}
									size="sm"
									variant="secondary"
									icon={getAssetIDByName(
										"CircleInformationIcon-primary",
									)}
								/>
							)}
						</Stack>
					</RN.View>
				</RN.View>
				{props.descriptionLabel && (
					<Text variant="text-md/medium" color="TEXT_NORMAL">
						{props.descriptionLabel}
					</Text>
				)}
			</Stack>
		</Reanimated.default.View>
	);
}
