import { ReactNative as RN } from "@vendetta/metro/common";

import Modal from "$/components/Modal";
import { SegmentedControlPages, Tabs, useSegmentedControlState } from "$/lib/redesign";

import { lang } from "../..";
import { IconpackTab } from "./tabs/IconpackTab";

const tabs = {
	iconpack: {
		title: () => lang.format("modal.config.iconpack.title", {}),
		page: <IconpackTab />,
	},
} satisfies Record<string, { title: () => string; page: JSX.Element }>;

export default function ConfigModal() {
	const state = useSegmentedControlState({
		defaultIndex: 0,
		items: Object.entries(tabs).map(([id, data]) => ({
			label: data.title(),
			id,
			page: data.page,
		})),
		pageWidth: RN.Dimensions.get("window").width,
	});

	return (
		<Modal
			mkey="config-modal"
			title={lang.format("modal.config.title", {})}
		>
			<RN.View style={{ flex: 0, marginTop: 12 }}>
				<Tabs state={state} />
			</RN.View>
			<RN.ScrollView style={{ flex: 1 }}>
				<SegmentedControlPages state={state} />
			</RN.ScrollView>
		</Modal>
	);
}
