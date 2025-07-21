import { ActionSheet } from "$/components/ActionSheet";
import ChooseSheet from "$/components/sheets/ChooseSheet";
import { TrailingText } from "$/components/Text";
import { Button } from "$/lib/redesign";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import type { AnyModule } from "../stuff/Module";

const { FormRow, FormSwitchRow } = Forms;

function call(val: any | (() => any), ...args: any[]) {
	if (typeof val === "function") return val(...args);
	else return val;
}

export function ModuleOption({ module, id }: { module: AnyModule; id: string }) {
	const storage = module.storage.options as any;
	const setting = React.useMemo(() => module.settings[id], [module, id]);
	module.useRefresh();

	if (setting.predicate && !setting.predicate.bind(module)()) return null;

	const cfg = { disabled: setting.disabled, style: setting.disabled && { opacity: 0.5 } };
	if (setting.type === "toggle") {
		return (
			<FormSwitchRow
				label={setting.label}
				subLabel={call(setting.subLabel, storage[id])}
				leading={<FormRow.Icon source={setting.icon ?? getAssetIDByName("PencilIcon")} />}
				value={storage[id]}
				onValueChange={() => {
					if (cfg.disabled) return;
					storage[id] = !storage[id];
					module.restart();
				}}
				{...cfg}
			/>
		);
	} else if (setting.type === "choose") {
		return (
			<FormRow
				label={setting.label}
				subLabel={call(setting.subLabel, storage[id])}
				leading={<FormRow.Icon source={setting.icon ?? getAssetIDByName("PencilIcon")} />}
				trailing={<TrailingText>{storage[id]}</TrailingText>}
				onPress={() => {
					!cfg.disabled && ActionSheet.open(
						ChooseSheet,
						{
							title: setting.label,
							value: storage[id],
							options: setting.choices.map(
								x => ({
									name: x,
									value: x,
								}),
							),
							callback: val => {
								storage[id] = val;
								module.restart();
							},
						},
					);
				}}
				{...cfg}
			>
			</FormRow>
		);
	} else if (setting.type === "button") {
		return (
			<Button
				text={setting.label}
				icon={setting.icon}
				onPress={() => !cfg.disabled && setting.action.bind(module)()}
				{...cfg}
				style={[cfg.style, { padding: 16 }]}
			/>
		);
	} else return null;
}
