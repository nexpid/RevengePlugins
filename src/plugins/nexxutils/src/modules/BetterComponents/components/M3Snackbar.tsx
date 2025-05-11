import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { rawColors } from "@vendetta/ui";

import Text from "$/components/Text";
import { Reanimated } from "$/deps";
import { resolveCustomSemantic } from "$/types";

export default function(props: {
	content: any;
	source?: any;
	icon?: any;
	isOnBottom?: boolean;
}) {
	const height = RN.Dimensions.get("window").height - 40;
	const styles = stylesheet.createThemedStyleSheet({
		container: {
			backgroundColor: resolveCustomSemantic(
				rawColors.PRIMARY_200,
				rawColors.PRIMARY_730,
			),
			width: 344,
			minHeight: 48,
			borderRadius: 8,
			paddingHorizontal: 16,
			paddingVertical: 14,
			flexDirection: "row",
		},
		containerBottom: {
			position: "absolute",
			bottom: -height,
		},
		text: {
			color: resolveCustomSemantic(
				rawColors.PRIMARY_730,
				rawColors.PRIMARY_130,
			),
			width: 280,
		},
		iconContainer: {
			alignSelf: "flex-end",
			width: 48,
			height: "100%",
			justifyContent: "center",
			alignItems: "center",
		},
		icon: {
			width: 24,
			height: 24,
		},
		shadow: {
			shadowColor: "#000",
			shadowOffset: {
				width: 0,
				height: 12,
			},
			shadowOpacity: 0.58,
			shadowRadius: 16.0,

			elevation: 24,
		},
	});

	const img = props.source ?? props.icon;
	const Content = typeof props.content === "function"
		? props.content
		: () => props.content ?? null;
	const Image = img
		&& (typeof img === "function"
			? img
			: () => (
				<RN.Image
					source={img}
					style={styles.icon}
					resizeMode="contain"
				/>
			));

	return (
		<Reanimated.default.View
			style={[
				styles.container,
				props.isOnBottom && styles.containerBottom,
				styles.shadow,
			]}
			entering={props.isOnBottom
				? Reanimated.FadeInUp.duration(150)
				: Reanimated.FadeInDown.duration(150)}
		>
			<Text variant="text-md/semibold" style={styles.text}>
				<Content />
			</Text>
			{img && (
				<RN.View style={styles.iconContainer}>
					<Image />
				</RN.View>
			)}
		</Reanimated.default.View>
	);
}
