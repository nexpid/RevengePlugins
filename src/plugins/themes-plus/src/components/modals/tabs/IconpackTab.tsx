import { ActionSheet } from "$/components/ActionSheet";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import ChooseSheet from "$/components/sheets/ChooseSheet";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { RowButton, TextInput } from "$/lib/redesign";
import { constants, React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { ConfigIconpackMode, lang, vstorage } from "../../..";
import { state } from "../../../stuff/active";
import { customUrl } from "../../../stuff/util";
import IconpackRow from "../../IconpackRow";

const { FormRow, FormSwitchRow } = Forms;

const previewIcon = () =>
	`design/components/Icon/native/redesign/generated/images/StarIcon${vstorage.iconpack.custom.suffix}.png`;

function CustomIconpack() {
	const styles = stylesheet.createThemedStyleSheet({
		previewBase: {
			width: 60,
			height: 60,
			backgroundColor: semanticColors.BG_MOD_FAINT,
			borderRadius: 8,
			justifyContent: "center",
			alignItems: "center",
			marginBottom: 4,
			marginTop: 8,
		},
		previewImage: {
			width: 50,
			height: 50,
		},
		previewSource: {
			marginHorizontal: -16,
			paddingBottom: 20,
			fontFamily: constants.Fonts.CODE_SEMIBOLD
				|| constants.Fonts.CODE_NORMAL,
			includeFontPadding: false,
		},
	});

	return (
		<>
			<BetterTableRowGroup
				title={lang.format(
					"modal.config.iconpack.choose.custom",
					{},
				)}
				padding
			>
				<RN.View
					style={{
						paddingHorizontal: 16,
						paddingTop: 16,
					}}
				>
					<RN.View
						style={[
							{
								justifyContent: "center",
								alignItems: "center",
							},
						]}
					>
						<Text
							variant="text-sm/semibold"
							color="TEXT_SECONDARY"
						>
							{lang.format(
								"modal.config.iconpack.custom.preview",
								{},
							)}
						</Text>
						<RN.View
							style={styles.previewBase}
						>
							<RN.Image
								style={styles.previewImage}
								source={{
									uri: `${customUrl()}${previewIcon()}`,
								}}
								resizeMode="cover"
							/>
						</RN.View>
						<Text
							variant="text-xxs/medium"
							color="TEXT_MUTED"
							style={styles.previewSource}
						>
							{customUrl() + previewIcon()}
						</Text>
					</RN.View>

					<TextInput
						size="md"
						value={vstorage.iconpack.custom.url}
						onChange={v => (vstorage.iconpack.custom.url = v)}
						label={lang.format(
							"modal.config.iconpack.custom.url",
							{},
						)}
						description={lang.format(
							"modal.config.iconpack.custom.url.desc",
							{},
						)}
						placeholder="https://example.com"
					/>
					<RN.View style={{ height: 8 }} />
					<TextInput
						size="md"
						value={vstorage.iconpack.custom
							.suffix}
						onChange={v => (vstorage.iconpack.custom.suffix = v)}
						label={lang.format(
							"modal.config.iconpack.custom.suffix",
							{},
						)}
						description={Lang.basicFormat(
							lang.format(
								"modal.config.iconpack.custom.suffix.desc",
								{},
							),
						)}
						placeholder="@2x"
					/>
				</RN.View>
			</BetterTableRowGroup>
			<BetterTableRowGroup nearby>
				<FormSwitchRow
					label={lang.format(
						"modal.config.iconpack.custom.config.bigger_status",
						{},
					)}
					subLabel={Lang.basicFormat(
						lang.format(
							"modal.config.iconpack.custom.config.bigger_status.desc",
							{},
						),
					)}
					leading={
						<FormRow.Icon
							source={getAssetIDByName(
								"PencilIcon",
							)}
						/>
					}
					onValueChange={() => (vstorage.iconpack.custom.config.biggerStatus = !vstorage
						.iconpack.custom
						.config.biggerStatus)}
					value={vstorage.iconpack.custom.config
						.biggerStatus}
				/>
			</BetterTableRowGroup>
			<BetterTableRowGroup nearby>
				<FormSwitchRow
					label={lang.format(
						"modal.config.iconpack.custom.config.bigger_status",
						{},
					)}
					subLabel={Lang.basicFormat(
						lang.format(
							"modal.config.iconpack.custom.config.bigger_status.desc",
							{},
						),
					)}
					leading={
						<FormRow.Icon
							source={getAssetIDByName(
								"PencilIcon",
							)}
						/>
					}
					onValueChange={() => (vstorage.iconpack.custom.config.biggerStatus = !vstorage
						.iconpack.custom
						.config.biggerStatus)}
					value={vstorage.iconpack.custom.config
						.biggerStatus}
				/>
			</BetterTableRowGroup>
		</>
	);
}

export function IconpackTab() {
	useProxy(vstorage);
	const superSecretTimeout = React.useRef<any>(null);

	return (
		<>
			<RN.View style={{ marginHorizontal: 16, marginTop: 8 }}>
				<RowButton
					label={lang.format(
						"modal.config.iconpack.mode",
						{},
					)}
					subLabel={lang.format(
						`modal.config.iconpack.mode.${vstorage.iconpack.mode}.desc`,
						{},
					)}
					onPress={() => {
						ActionSheet.open(ChooseSheet, {
							title: lang.format(
								"modal.config.iconpack.mode",
								{},
							),
							value: vstorage.iconpack.mode,
							options: [
								ConfigIconpackMode.Automatic,
								ConfigIconpackMode.Manual,
								ConfigIconpackMode.Disabled,
							].map(e => ({
								name: lang.format(
									`modal.config.iconpack.mode.${e}`,
									{},
								),
								description: lang.format(
									`modal.config.iconpack.mode.${e}.desc`,
									{},
								),
								value: e,
							})),
							callback(v: any) {
								vstorage.iconpack.mode = v;
							},
						});
					}}
				/>
			</RN.View>
			{vstorage.iconpack.mode === ConfigIconpackMode.Manual && (
				<>
					<BetterTableRowGroup
						title={lang.format(
							"modal.config.iconpack.choose",
							{},
						)}
					>
						{state.iconpack.list.map(pack => (
							<IconpackRow
								key={pack.id}
								pack={pack}
								onPress={() => {
									vstorage.iconpack.pack = pack.id;
									vstorage.iconpack.isCustom = false;
								}}
							/>
						))}
						<FormRow
							label={lang.format(
								"modal.config.iconpack.choose.custom",
								{},
							)}
							trailing={
								<FormRow.Radio
									selected={vstorage.iconpack.isCustom}
								/>
							}
							onPress={() => {
								vstorage.iconpack.isCustom = true;
								vstorage.iconpack.pack = undefined;
							}}
						/>
					</BetterTableRowGroup>
					{vstorage.iconpack.isCustom && <CustomIconpack />}
				</>
			)}
			<RN.View style={{ height: 20 }} />
		</>
	);
}
