import { clipboard, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import Text from "$/components/Text";
import { Lang } from "$/lang";
import { Button, PressableScale, Stack, TextInput } from "$/lib/redesign";

import { lang } from "../..";
import { resolveLinkToSong } from "../../stuff/songs/parse";
import { humanReadableServices } from "../../types";
import { ModifiedDataContext } from "../Settings";

const { FormRow } = Forms;

function InputAlert({
	valueRef,
}: {
	valueRef: React.MutableRefObject<string>;
}) {
	const [value, setValue] = React.useState("");
	const [error, setError] = React.useState(false);
	valueRef.current = value;

	return (
		<Stack
			spacing={14}
			style={{
				width: RN.Dimensions.get("window").width * 0.8,
			}}
		>
			<Text variant="text-md/medium" color="TEXT_MUTED">
				{Lang.basicFormat(
					lang.format("alert.add_song.description", {
						services_seperated_by_commas: humanReadableServices.join(", "),
					}),
				)}
			</Text>
			<TextInput
				autoFocus
				isClearable
				value={value}
				onChange={v => {
					setValue(v);
					try {
						new URL(v);
						setError(false);
					} catch {
						setError(v !== "");
					}
				}}
				returnKeyType="done"
				status={error ? "error" : "default"}
				errorMessage={error
					? lang.format("alert.add_song.url_err", {})
					: undefined}
			/>
			<RN.ScrollView
				horizontal={true}
				showsHorizontalScrollIndicator={false}
				style={{ gap: 8 }}
			>
				<Button
					size="sm"
					variant="tertiary"
					text="Import from clipboard"
					icon={getAssetIDByName("ClipboardListIcon")}
					onPress={() =>
						clipboard
							.getString()
							.then((str: string) => setValue(str))}
				/>
			</RN.ScrollView>
		</Stack>
	);
}

export default function AddSong({ disabled }: { disabled: boolean }) {
	const styles = stylesheet.createThemedStyleSheet({
		song: {
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
		},
		songIcon: {
			width: 30,
			height: 30,
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			borderRadius: 15,
			justifyContent: "center",
			alignItems: "center",
		},
	});

	const valueRef = React.useRef("");
	const { data, setData } = React.useContext(ModifiedDataContext);

	return (
		<PressableScale
			onPress={() =>
				showConfirmationAlert({
					title: lang.format("alert.add_song.title", {}),
					content: <InputAlert valueRef={valueRef} />,
					confirmText: lang.format("alert.add_song.confirm", {}),
					cancelText: lang.format("alert.add_song.cancel", {}),
					async onConfirm() {
						const value = valueRef.current;
						try {
							new URL(value);
						} catch {
							return;
						}

						const song = await resolveLinkToSong(value);
						if (song) {
							const hash = song.service + song.type + song.id;
							if (
								!data.find(
									sng =>
										sng.service + sng.type + sng.id
											=== hash,
								)
							) {
								return setData([...data, song].slice(0, 6));
							}

							showToast(
								lang.format("toast.song_already_exists", {}),
								getAssetIDByName("CircleXIcon-primary"),
							);
						} else {
							showToast(
								lang.format("toast.song_fetch_failed", {}),
								getAssetIDByName("CircleXIcon-primary"),
							);
						}
					},
					isDismissable: true,
				})}
			disabled={disabled}
		>
			<FormRow
				label={lang.format("settings.songs.add_song", {})}
				leading={
					<RN.View style={styles.songIcon}>
						<FormRow.Icon
							source={getAssetIDByName("PlusMediumIcon")}
						/>
					</RN.View>
				}
				style={styles.song}
				disabled={disabled}
			/>
		</PressableScale>
	);
}
