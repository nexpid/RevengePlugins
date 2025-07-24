import Text from "$/components/Text";
import { ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { version } from "..";
import SillyAvatar from "./SillyAvatar";

export function Header() {
	const styles = stylesheet.createThemedStyleSheet({
		view: {
			flexDirection: "row",
			justifyContent: "center",
			margin: 20,
			gap: 4,
		},
		info: {
			flexDirection: "column",
			justifyContent: "center",
		},
	});

	return (
		<RN.View style={styles.view}>
			<SillyAvatar />
			<RN.View
				style={styles.info}
			>
				<Text variant="display-md" color="TEXT_NORMAL" align="left">NexxUtils</Text>
				<Text variant="text-md/bold" color="TEXT_MUTED" align="left">
					version {version}
				</Text>
			</RN.View>
		</RN.View>
	);
}
