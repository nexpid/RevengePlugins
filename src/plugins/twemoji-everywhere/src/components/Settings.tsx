import { showSimpleActionSheet } from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { Card } from "$/lib/redesign";
import { React, ReactNative as RN, url } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { lang, vstorage } from "..";
import { type EmojiPack, jokePacks, normalPacks, type Pack } from "../stuff/packs";
import { convert } from "../stuff/parser";
import CustomTwemoji from "./CustomTwemoji";

const { FormRow } = Forms;

const emojis =
	"👿 🥶 😢 😘 🤮 🫤 😷 🧐 😮 😛 😀 😗 😙 🤑 😌 😴 😪 😚 🤪 😟 😲 😖 😕 🤠 😔 🥸 🫥 😡 😑 😋 😵 🤕 🤨 😵‍💫 😂 😶 ☹️ 😦 😬 😃 😄 😅 🥵 🫠 🤢 🤓 😐 🥳 🙂‍↕️ 😫 🙂 🤣 🫡 💀 🙁 😇 🥰 😈 😁 😎 🤤 😏 😩 😝 😒 🙃 😮‍💨 😜 🥴 😧 😆 😞 🥹 😣 🤗 😉"
		.split(" ");

function PackExample({
	pack,
	id,
}: {
	pack: EmojiPack;
	id: Pack;
}) {
	const emoji = React.useMemo(() => emojis[Math.floor(Math.random() * emojis.length)], [
		vstorage.emojipack,
	]);
	const code = React.useMemo(() => convert(emoji, pack), [emoji]);

	return (
		<FormRow
			label={lang.format(pack.title, {})}
			subLabel={pack.maintainer
				&& Lang.basicFormat(lang.format("settings.emojipack.maintained_by", {
					maintainer: pack.maintainer,
				}))}
			leading={<CustomTwemoji emoji={code} src={pack.format(code)} size={30} />}
			trailing={<FormRow.Radio selected={vstorage.emojipack === id} />}
			onPress={() => (vstorage.emojipack = id)}
			onLongPress={() =>
				pack.source && showSimpleActionSheet({
					key: "CardOverflow",
					header: {
						title: lang.format(pack.title, {}),
						subtitle: pack.maintainer
							&& lang.format("settings.emojipack.maintained_by.short", {
								maintainer: pack.maintainer,
							}),
					},
					options: [{
						label: lang.format("sheet.emojipack.source_repository", {}),
						icon: getAssetIDByName("img_account_sync_github_white"),
						onPress() {
							url.openURL(pack.source);
						},
					}],
				})}
		/>
	);
}

export default function Settings() {
	useProxy(vstorage);

	return (
		<RN.ScrollView>
			<Card style={{ marginHorizontal: 16, marginTop: 16 }}>
				<Text variant="text-md/medium" color="TEXT_NORMAL">
					{lang.format("settings.source_hint", {})}
				</Text>
			</Card>
			<BetterTableRowGroup
				title={lang.format("settings.emojipacks.title", {})}
				icon={getAssetIDByName("emoji-neutral")}
			>
				{Object.entries(normalPacks).map(([id, pack]) => (
					<PackExample key={id} pack={pack} id={id as Pack} />
				))}
			</BetterTableRowGroup>
			<BetterTableRowGroup
				title={lang.format("settings.jokepacks.title", {})}
				icon={getAssetIDByName("emoji-positive")}
			>
				{Object.entries(jokePacks).map(([id, pack]) => (
					<PackExample key={id} pack={pack} id={id as Pack} />
				))}
			</BetterTableRowGroup>
			<RN.View style={{ height: 16 }} />
		</RN.ScrollView>
	);
}
