import { ReactNative as RN } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { ActionSheet, hideActionSheet } from "$/components/ActionSheet";
import ScaleRowButton from "$/components/ScaleRowButton";

import { lang } from "../..";
import { saveData } from "../../stuff/api";
import type { UserData } from "../../types";
import ImportActionSheet from "./ImportActionSheet";
import TooMuchDataSheet from "./TooMuchDataSheet";

export default function WwyltdSheet({
	backup,
	navigation,
}: {
	backup: UserData;
	navigation: any;
}) {
	return (
		<ActionSheet
			title={lang.format("sheet.wwyltd.title", {})}
			style={{ gap: 8 }}
		>
			<ScaleRowButton
				label={lang.format("sheet.wwyltd.actions.save_to_cloud", {})}
				icon={getAssetIDByName("UploadIcon")}
				onPress={async () => {
					hideActionSheet();
					showToast(
						lang.format("toast.saving", {}),
						getAssetIDByName("UploadIcon"),
					);
					try {
						await saveData(backup);
					} catch (e: any) {
						if (
							e?.message
								?.toLowerCase()
								.includes("request entity too large")
						) {
							ActionSheet.open(TooMuchDataSheet, { navigation });
						}
					}
				}}
				arrow={false}
			/>
			<ScaleRowButton
				label={lang.format("sheet.wwyltd.actions.import", {})}
				icon={getAssetIDByName("BookCheckIcon")}
				onPress={() =>
					ActionSheet.open(ImportActionSheet, {
						data: backup,
						navigation,
					})}
			/>
			<RN.View style={{ height: 16 }} />
		</ActionSheet>
	);
}
