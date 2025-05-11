import { constants, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { Forms } from "@vendetta/ui/components";

import Text from "$/components/Text";

import { debug, vstorage } from "../..";
import { dispatchActivityIfPossible } from "../../stuff/activity";

const { FormSection } = Forms;

export let forceUpdateLiveRawActivityView: () => void;
export const LiveRawActivityView = () => {
	const [_, forceUpdate] = React.useReducer(x => ~x, 0);
	forceUpdateLiveRawActivityView = forceUpdate;

	const styles = stylesheet.createThemedStyleSheet({
		code: {
			fontFamily: constants.Fonts.CODE_SEMIBOLD || constants.Fonts.CODE_NORMAL,
			includeFontPadding: false,
			color: semanticColors.TEXT_NORMAL,
		},
	});

	return (
		<RN.ScrollView style={{ flex: 1, marginBottom: 50 }}>
			<FormSection title="Live Raw Activity">
				{debug.lastRawActivity
					? (
						<RN.Text style={styles.code}>
							{JSON.stringify(debug.lastRawActivity, undefined, 3)}
						</RN.Text>
					)
					: vstorage.settings.display
					? (
						<Text variant="text-md/semibold">
							Display activity setting is disabled. You need to actually enable it for the
							raw activity to show up lmao
						</Text>
					)
					: (
						<Text
							variant="text-md/semibold"
							onPress={() => {
								dispatchActivityIfPossible();
							}}
						>
							No last raw activity yet. Tap text to force update
						</Text>
					)}
			</FormSection>
			<FormSection title="Info">
				<Text variant="text-md/semibold" color="TEXT_NORMAL">
					Last raw activity update: {debug.lastRawActivityTimestamp
						? new Date(
							debug.lastRawActivityTimestamp,
						).toLocaleString("en-US")
						: "-"}
				</Text>
			</FormSection>
		</RN.ScrollView>
	);
};

export function openLiveRawActivityView(navigation: any) {
	navigation.push("VendettaCustomPage", {
		render: LiveRawActivityView,
		title: "Live RawActivity",
	});
}
