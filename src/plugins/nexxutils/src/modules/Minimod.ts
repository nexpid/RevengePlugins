import { findByStoreName } from "@vendetta/metro";

import { patchRows } from "$/types";
import NerdEmoji from "../../assets/MiniMod/NerdEmoji.png";
import { Module, ModuleCategory } from "../stuff/Module";

// It's just like Among Us
// [20/07/2025] So true!
const GuildMemberStore = findByStoreName("GuildMemberStore");

export default new Module({
	id: "minimod",
	label: "Minimod",
	sublabel:
		"Lets you see some moderator-only things. Similiar to the 'ShowHiddenThings' Vencord plugin",
	category: ModuleCategory.Fun,
	icon: NerdEmoji,
	settings: {
		showTimeouts: {
			label: "Show timeouts",
			subLabel: "Show member timeout icons in chat",
			type: "toggle",
			default: true,
		},
	},
	handlers: {
		onStart() {
			if (this.storage.options.showTimeouts) {
				this.patches.add(
					patchRows((rows) => {
						if (!rows.some((row) => "message" in row)) return;

						const timedOut = GuildMemberStore.getCommunicationDisabledUserMap();
						const now = Date.now();
						for (const row of rows) {
							if (row.type !== 1) continue;

							const date = new Date(timedOut[`${row.message.guildId}-${row.message.authorId}`]);
							if (date.getTime() > now) {
								row.message.communicationDisabled = true;
							}
						}
					}),
				);
			}
		},
		onStop() {},
	},
});
