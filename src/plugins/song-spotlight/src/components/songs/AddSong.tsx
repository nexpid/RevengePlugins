import { getInputAlertMessage, InputAlert } from "$/components/InputAlert";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { Button, PressableScale, Stack, TextInput } from "$/lib/redesign";
import { clipboard, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { lang } from "../..";
import { resolveLinkToSong } from "../../stuff/songs/parse";
import { humanReadableServices } from "../../types";
import { ModifiedDataContext } from "../Settings";

const { FormRow } = Forms;

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

	const { data, setData } = React.useContext(ModifiedDataContext);

	return (
		<PressableScale
			onPress={() =>
				showConfirmationAlert({
					title: lang.format("alert.add_song.title", {}),
					content: (
						<InputAlert
							key="addSong"
							title={Lang.basicFormat(
								lang.format("alert.add_song.description", {
									services_seperated_by_commas: humanReadableServices.join(", "),
								}),
							)}
							importClipboard="Import from clipboard"
							errorMessage={lang.format("alert.add_song.url_err", {})}
							validate={(v) => !!(new URL(v))}
						/>
					),
					confirmText: lang.format("alert.add_song.confirm", {}),
					cancelText: lang.format("alert.add_song.cancel", {}),
					async onConfirm() {
						const value = getInputAlertMessage("addSong");
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
