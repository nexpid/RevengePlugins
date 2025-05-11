import { clipboard, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Codeblock } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import Modal from "$/components/Modal";
import Text from "$/components/Text";

const Card = ({
	label,
	error,
	clear,
}: {
	label: string;
	error: string;
	clear: () => void;
}) => {
	const styles = stylesheet.createThemedStyleSheet({
		main: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			borderRadius: 8,
			padding: 12,
			gap: 8,
		},
		middle: {
			marginLeft: "auto",
			marginRight: "auto",
			alignItems: "center",
			justifyContent: "center",
		},
		leading: {
			alignSelf: "flex-start",
			justifyContent: "flex-start",
			alignItems: "center",
		},
		trailing: {
			alignSelf: "flex-start",
			justifyContent: "flex-end",
			alignItems: "center",
		},
		upIcon: {
			width: 24,
			height: 24,
			tintColor: semanticColors.INTERACTIVE_NORMAL,
		},
		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 8,
			foreground: true,
		} as any,
		androidRippleRound: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 2147483647,
			foreground: true,
		} as any,
	});

	const [expanded, setExpanded] = React.useState(false);
	const [gone, setGone] = React.useState(false);
	const short = React.useMemo(() => {
		const lines = error.split("\n");
		return lines.length > 1 ? `${lines[0]} …` : lines[0];
	}, [error]);

	if (gone) return null;

	return (
		<RN.Pressable
			style={styles.main}
			android_ripple={styles.androidRipple}
			onPress={() => {
				setExpanded(!expanded);
				RN.LayoutAnimation.configureNext(
					RN.LayoutAnimation.Presets.easeInEaseOut,
				);
			}}
		>
			<RN.View
				style={{
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<RN.View style={styles.leading}>
					<RN.Pressable
						android_ripple={styles.androidRippleRound}
						onPress={() => {
							clipboard.setString(error);
							showToast(
								"Copied error",
								getAssetIDByName("toast_copy_message"),
							);
						}}
						style={{ padding: 4 }}
					>
						<RN.Image
							source={getAssetIDByName("CopyIcon")}
							resizeMode="cover"
							style={styles.upIcon}
						/>
					</RN.Pressable>
				</RN.View>
				<RN.View style={styles.middle}>
					<Text
						variant="text-lg/bold"
						color="TEXT_NORMAL"
						align="center"
					>
						{label}
					</Text>
				</RN.View>
				<RN.View style={styles.trailing}>
					<RN.Pressable
						android_ripple={styles.androidRippleRound}
						onPress={() => {
							clear();
							setGone(true);
							showToast(
								"Cleared error",
								getAssetIDByName("trash"),
							);
						}}
						style={{ padding: 4 }}
					>
						<RN.Image
							source={getAssetIDByName("trash")}
							resizeMode="cover"
							style={styles.upIcon}
						/>
					</RN.Pressable>
				</RN.View>
			</RN.View>
			<RN.Pressable pointerEvents="box-none">
				<Codeblock selectable={true}>
					{expanded ? error : short}
				</Codeblock>
			</RN.Pressable>
		</RN.Pressable>
	);
};

export default function ErrorViewerModal({
	errors,
	module,
	clearEntry,
}: {
	errors: Record<string, string>;
	module: string;
	clearEntry: (entry: string) => void;
}) {
	return () => {
		return (
			<Modal mkey="error-viewer" title={`${module} Errors`}>
				<RN.ScrollView style={{ flex: 1, padding: 12 }}>
					<RN.View style={{ gap: 12, flexDirection: "column" }}>
						{Object.entries(errors).map(([label, err]) => (
							<Card
								label={label}
								error={err}
								clear={() => {
									clearEntry(label);
								}}
							/>
						))}
					</RN.View>
				</RN.ScrollView>
			</Modal>
		);
	};
}
