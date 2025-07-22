import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { FlashList } from "$/deps";
import { PressableScale, Stack } from "$/lib/redesign";
import { resolveCustomSemantic } from "$/types";
import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { type AnyModule, getModuleExtras } from "../../stuff/Module";
import { ModuleOption } from "../ModuleOption";

const { useThemeContext } = findByProps("useThemeContext");
const { FormRow, FormSwitchRow } = Forms;

function Enabled({ module }: { module: AnyModule }) {
	// some React jank
	const [_, update] = React.useReducer((x) => ~x, 0);
	module.useRefresh();

	return (
		<FormSwitchRow
			label="Enabled"
			subLabel={module.disabledReason}
			leading={<FormRow.Icon source={getAssetIDByName("SettingsIcon")} />}
			value={module.storage.enabled}
			onValueChange={() => {
				module.toggle();
				update();
			}}
		/>
	);
}

export function ModulePage({ module }: { module: AnyModule }) {
	module.useRefresh();

	const extras = getModuleExtras(module).filter(x => x.content);
	const styles = stylesheet.createThemedStyleSheet({
		thumbnailCard: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			borderColor: semanticColors.BORDER_STRONG,
			borderWidth: 1,
			borderRadius: 16,
			width: "100%",
			height: 200,
		},
		meta: {
			padding: 16,
		},
		themed: {
			color: semanticColors.TEXT_NORMAL,
			tintColor: semanticColors.TEXT_NORMAL,
		},
		ripple: {
			color: semanticColors.ANDROID_RIPPLE,
		},
	});

	const theme = useThemeContext();
	const thumbnail = React.useMemo(() => {
		if (
			module.meta.thumbnail && typeof module.meta.thumbnail === "object"
			&& "dark" in module.meta.thumbnail
		) return resolveCustomSemantic(module.meta.thumbnail.dark, module.meta.thumbnail.light);
		else return module.meta.thumbnail;
	}, [theme]);

	return (
		<RN.ScrollView style={{ flex: 1, paddingBottom: 16 }}>
			<BetterTableRowGroup padding>
				<Text variant="text-md/medium" color="TEXT_NORMAL">{module.meta.sublabel}</Text>
			</BetterTableRowGroup>
			{thumbnail && (
				<RN.View style={{ padding: 16, paddingTop: 8 }}>
					<RN.Image
						resizeMode="cover"
						source={thumbnail}
						style={styles.thumbnailCard}
					/>
				</RN.View>
			)}
			<BetterTableRowGroup
				title="Status"
				icon={getAssetIDByName("TopicsIcon")}
			>
				{extras[0]
					? (
						extras.map((extra) => {
							const content = (
								<RN.View key={extra.id} style={{ padding: 8 }}>
									<Stack
										direction="horizontal"
										spacing={8}
										align="center"
										style={[
											{ padding: 8 },
										]}
									>
										<RN.Image
											source={getAssetIDByName(extra.icon)}
											style={[styles.themed, extra.color && { tintColor: extra.color }]}
										/>
										<Text
											variant="text-md/medium"
											style={[{ flex: 1 }, styles.themed, extra.color && { color: extra.color }]}
										>
											{extra.content}
										</Text>
										{extra.action && <FormRow.Arrow />}
									</Stack>
								</RN.View>
							);

							return extra.action
								? <PressableScale key={extra.id} onPress={extra.action}>{content}</PressableScale>
								: content;
						})
					)
					: <Enabled module={module} />}
			</BetterTableRowGroup>
			{extras[0] && (
				<BetterTableRowGroup nearby>
					<Enabled module={module} />
				</BetterTableRowGroup>
			)}
			{Object.keys(module.settings)[0] && (
				<BetterTableRowGroup title="Options" icon={getAssetIDByName("SettingsIcon")}>
					<FlashList
						data={Object.entries(module.settings)}
						keyExtractor={(item) =>
							item[0]}
						estimatedItemSize={56}
						renderItem={({ item }) => <ModuleOption module={module} id={item[0]} />}
					/>
				</BetterTableRowGroup>
			)}
			<RN.View style={{ height: 16 }} />
		</RN.ScrollView>
	);
}
