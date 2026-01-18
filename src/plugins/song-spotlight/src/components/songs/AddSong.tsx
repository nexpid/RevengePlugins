import { getInputAlertMessage, InputAlert } from "$/components/InputAlert";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { PressableScale } from "$/lib/redesign";
import { parseLink, parsers } from "@song-spotlight/api/handlers";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { lang } from "../..";
import { sid } from "../../stuff/songs";
import { ModifiedDataContext } from "../Settings";

const { FormRow } = Forms;

export default function AddSong({ disabled }: { disabled: boolean }) {
	const styles = stylesheet.createThemedStyleSheet({
		song: {
			backgroundColor: semanticColors.BACKGROUND_MOD_MUTED,
			borderRadius: 8,
		},
		songIcon: {
			width: 30,
			height: 30,
			backgroundColor: semanticColors.BACKGROUND_MOD_SUBTLE,
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
							id="addSong"
							title={Lang.basicFormat(
								lang.format("alert.add_song.description", {
									services_seperated_by_commas: parsers.map(x => x.name).join(", "),
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

						const song = await parseLink(value);
						if (song) {
							if (data.find(item => sid(item) === sid(song))) {
								return showToast(
									lang.format("toast.song_already_exists", {}),
									getAssetIDByName("CircleXIcon-primary"),
								);
							}

							setData([...data, song].slice(0, 6));
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
				label={
					<Text
						variant="text-md/semibold"
						color="TEXT_DEFAULT"
					>
						{lang.format("settings.songs.add_song", {})}
					</Text>
				}
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
