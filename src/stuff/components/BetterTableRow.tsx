import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";

import Text from "./Text";

export function BetterTableRowTitle({
	title,
	onPress,
	icon,
	padding,
}: {
	title: string;
	onPress?: () => void;
	icon?: number;
	padding?: boolean;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 4,
		} as any,
		icon: {
			width: 16,
			height: 16,
			marginTop: 1.5,
			tintColor: semanticColors.TEXT_MUTED,
		},
	});
	const UseCompontent = onPress ? RN.Pressable : RN.View;

	return (
		<UseCompontent
			android_ripple={styles.androidRipple}
			onPress={onPress}
			style={{
				marginBottom: 8,
				marginHorizontal: padding ? 16 : 0,
				marginTop: padding ? 8 : 0,
				gap: 4,
				flexDirection: "row",
				alignItems: "center",
			}}
		>
			{icon && (
				<RN.Image
					style={styles.icon}
					source={icon}
					resizeMode="cover"
				/>
			)}
			<Text variant="text-sm/semibold" color="TEXT_MUTED">
				{title}
			</Text>
		</UseCompontent>
	);
}

export function BetterTableRowGroup({
	title,
	onTitlePress,
	icon,
	children,
	padding,
	nearby,
}: React.PropsWithChildren<{
	title?: string | React.ReactNode;
	onTitlePress?: () => void;
	icon?: number;
	padding?: boolean;
	nearby?: boolean;
}>) {
	const styles = stylesheet.createThemedStyleSheet({
		main: {
			backgroundColor: semanticColors.CARD_BACKGROUND_DEFAULT,
			borderColor: semanticColors.BORDER_MUTED,
			borderWidth: 1,
			borderRadius: 16,
			overflow: "hidden",
			flex: 1,
		},
	});

	return (
		<RN.View style={{ marginHorizontal: 16, marginTop: nearby ? 8 : 16 }}>
			{title
				? (
					typeof title === "string"
						? (
							<BetterTableRowTitle
								title={title}
								onPress={onTitlePress}
								icon={icon}
							/>
						)
						: title
				)
				: null}
			<RN.View style={styles.main}>
				{padding
					? (
						<RN.View
							style={{ paddingHorizontal: 16, paddingVertical: 16 }}
						>
							{children}
						</RN.View>
					)
					: children}
			</RN.View>
		</RN.View>
	);
}
