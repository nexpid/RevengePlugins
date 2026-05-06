// =============================================================================
// CloudSync plugin — NerdConfig.tsx — migrated for Discord 325+ / Kettu / Bunny
// =============================================================================
//
// What changed vs the original:
//   • Forms.FormRow                         → TableRow
//   • Forms.FormInput                       → TextInput
//   • leading={<FormRow.Icon source={X} />} → icon={<TableRow.Icon source={X} />}
//
// Notes on TextInput:
//   • New TextInput's `onChange` callback receives a string directly (same
//     signature as the legacy FormInput), so the existing handlers don't
//     need their bodies changed.
//   • The negative-margin styling is preserved from the original. The new
//     TextInput component has slightly different default spacing so the
//     visual may end up a few pixels off — easy to tweak after first build.
//   • If you want to clean this up later, the new TextInput supports `label`
//     and `description` props natively, which would let you collapse each
//     TableRow + TextInput pair into a single TextInput with `leadingIcon`.
//     Left as-is here to keep the diff minimal.
//
// TableRow and TextInput live in different metro modules in modern Discord
// builds, so they need separate findByProps calls.
// =============================================================================

import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { BetterTableRowGroup } from "$/components/BetterTableRow";

import { lang, vstorage } from "..";
import constants, { defaultClientId, defaultHost } from "../constants";

const { TableRow } = findByProps("TableRow", "TableRowGroup");
const TextInput = findByProps("TextInput")?.TextInput;

export default function NerdConfig() {
	const [host, setHost] = React.useState(constants.api);
	const [clientId, setClientId] = React.useState(constants.oauth2.clientId);

	return (
		<BetterTableRowGroup nearby>
			<TableRow
				label={lang.format("settings.dev.api_url.title", {})}
				subLabel={lang.format("settings.dev.api_url.description", {})}
				icon={<TableRow.Icon source={getAssetIDByName("PencilIcon")} />}
			/>
			<TextInput
				placeholder={defaultHost}
				value={host}
				onChange={(x: string) => (
					setHost(x), (vstorage.custom.host = x !== defaultHost && x.length >= 1 ? x : "")
				)}
				onBlur={() => setHost(constants.api)}
				style={{ marginTop: -25, marginHorizontal: 12 }}
			/>
			<TableRow
				label={lang.format("settings.dev.client_id.title", {})}
				subLabel={lang.format("settings.dev.client_id.description", {})}
				icon={<TableRow.Icon source={getAssetIDByName("PencilIcon")} />}
			/>
			<TextInput
				placeholder={defaultClientId}
				value={clientId}
				onChange={(x: string) => (
					setClientId(x),
						(vstorage.custom.clientId = x !== defaultClientId && x.length >= 1
							? (x.match(/[0-9]/g)?.join("") ?? "")
							: "")
				)}
				onBlur={() => setClientId(constants.oauth2.clientId)}
				style={{ marginTop: -25, marginHorizontal: 12 }}
			/>
		</BetterTableRowGroup>
	);
}
