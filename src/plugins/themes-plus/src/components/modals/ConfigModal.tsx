import { constants, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet } from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Modal from "$/components/Modal";
import ChooseSheet from "$/components/sheets/ChooseSheet";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import {
	RowButton,
	SegmentedControlPages,
	Tabs,
	TextInput,
	useSegmentedControlState,
} from "$/lib/redesign";

import { ConfigIconpackMode, lang, vstorage } from "../..";
import { state } from "../../stuff/active";
import { customUrl } from "../../stuff/util";
import IconpackRow from "../IconpackRow";
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
	useProxy(vstorage);

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
