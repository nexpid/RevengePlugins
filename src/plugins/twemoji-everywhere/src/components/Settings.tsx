import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";

import { lang, vstorage } from "..";
import {
	convert,
	type EmojiPack,
	type emojipacks,
	normalPacks,
	sillyPacks,
} from "../stuff/twemoji";
import CustomTwemoji from "./CustomTwemoji";

const { FormRow } = Forms;

const emojis = "😀 😁 😂 🤣 😃 😄 😅 😆 😋 😊 😉 😎 😍 😘 🥰 😗".split(" ");

function Pack({
	emoji,
	pack,
	id,
}: {
	emoji: string;
	pack: EmojiPack;
	id: keyof typeof emojipacks;
}) {
	const em = convert(emoji, pack);
	return (
		<FormRow
			label={lang.format(pack.title, {})}
			leading={<CustomTwemoji emoji={em} src={pack.format(em)} size={20} />}
			trailing={<FormRow.Radio selected={vstorage.emojipack === id} />}
			onPress={() => (vstorage.emojipack = id)}
		/>
	);
}

export default () => {
	vstorage.emojipack ??= "default";
	useProxy(vstorage);

	const [emoji, setEmoji] = React.useState(
		emojis[Math.floor(Math.random() * emojis.length)],
	);

	return (
		<RN.ScrollView
			refreshControl={
				<RN.RefreshControl
					refreshing={false}
					onRefresh={() => {
						setEmoji(emojis[emojis.indexOf(emoji) + 1] ?? emojis[0]);
					}}
				/>
			}
		>
			<BetterTableRowGroup
				title={lang.format("settings.emojipacks.title", {})}
				icon={getAssetIDByName("SettingsIcon")}
			>
				{Object.entries(normalPacks).map(([id, pack]) => (
					<Pack emoji={emoji} pack={pack} id={id as any} />
				))}
			</BetterTableRowGroup>
			<BetterTableRowGroup nearby>
				{Object.entries(sillyPacks).map(([id, pack]) => (
					<Pack emoji={emoji} pack={pack} id={id as any} />
				))}
			</BetterTableRowGroup>
		</RN.ScrollView>
	);
};
