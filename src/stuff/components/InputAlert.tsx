import { Button, Stack, TextInput } from "$/lib/redesign";
import { clipboard, React, ReactNative } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Text from "./Text";

const messageMap = new Map<string, string>();

export function getInputAlertMessage(id: string) {
	const val = messageMap.get(id) ?? "";
	messageMap.delete(id);
	return val;
}

export function InputAlert({
	id,
	defaultValue = "",
	placeholder,
	title,
	importClipboard,
	errorMessage,
	validate,
}: {
	id: string;
	defaultValue?: string;
	placeholder?: string;
	title?: React.ReactNode;
	importClipboard?: string;
	errorMessage?: string;
	validate?: (value: string) => boolean;
}) {
	const [value, setValue] = React.useState(defaultValue);
	const [error, setError] = React.useState(false);
	messageMap.set(id, value);

	return (
		<Stack
			spacing={14}
			style={{
				width: ReactNative.Dimensions.get("window").width * 0.8,
			}}
		>
			{title && (
				<Text variant="text-md/medium" color="TEXT_MUTED">
					{title}
				</Text>
			)}
			<TextInput
				autoFocus
				isClearable
				value={value}
				onChange={v => {
					setValue(v);
					if (!validate) return setError(v !== "");

					try {
						setError(!validate(v));
					} catch {
						setError(true);
					}
				}}
				placeholder={placeholder}
				returnKeyType="done"
				status={error ? "error" : "default"}
				errorMessage={error
					? (errorMessage ?? "Invalid input")
					: undefined}
			/>
			{importClipboard && (
				<ReactNative.ScrollView
					horizontal={true}
					showsHorizontalScrollIndicator={false}
					style={{ gap: 8 }}
				>
					<Button
						size="sm"
						variant="tertiary"
						text={importClipboard}
						icon={getAssetIDByName("ClipboardListIcon")}
						onPress={() =>
							clipboard
								.getString()
								.then((str: string) => setValue(str))}
					/>
				</ReactNative.ScrollView>
			)}
		</Stack>
	);
}
