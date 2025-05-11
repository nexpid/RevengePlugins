import { React, ReactNative as RN } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { ActionSheet, hideActionSheet } from "$/components/ActionSheet";
import { DocumentPicker } from "$/deps";
import { Button, TextInput } from "$/lib/redesign";

const { FormRow } = Forms;

export default function AddBackgroundSheet({
	add,
}: {
	add: (title: string, location: string) => void;
}) {
	const [file, setFile] = React.useState<
		{
			name: string;
			path: string;
		} | null
	>(null);
	const [label, setLabel] = React.useState("");

	return (
		<ActionSheet title={"Add custom background"}>
			<FormRow
				label="Select an image"
				subLabel={file?.name}
				leading={<FormRow.Icon source={getAssetIDByName("ImageIcon")} />}
				onPress={() => {
					DocumentPicker.pickSingle({
						type: DocumentPicker.types.images,
						mode: "open",
						copyTo: "documentDirectory",
					}).then(file => {
						setFile({
							name: file.name!,
							path: file.fileCopyUri!,
						});
					});
				}}
			/>
			<TextInput
				size="md"
				label="Label"
				placeholder="New background"
				value={label}
				onChange={x => setLabel(x)}
			/>
			<RN.View style={{ height: 8 }} />
			<Button
				text="Add"
				variant="primary"
				size="md"
				iconPosition="start"
				icon={getAssetIDByName("PlusIcon")}
				onPress={() => {
					if (!file || !label) return;

					add(label, `file://${file.path}`);
					hideActionSheet();
				}}
				disabled={!file || !label}
			/>
		</ActionSheet>
	);
}
