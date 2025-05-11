import { findByStoreName } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

import { RNChatModule } from "$/deps";

import NerdEmoji from "../../assets/MiniMod/NerdEmoji.png";
import { Module, ModuleCategory } from "../stuff/Module";

// It's just like Among Us
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
					before("updateRows", RNChatModule, args => {
						const rows = JSON.parse(args[1]);

						if (rows.find((row: any) => row?.message)) {
							const timedOut = GuildMemberStore.getCommunicationDisabledUserMap();

							for (const row of rows) {
								if (
									row?.message?.guildId
									&& row.message.authorId
									&& new Date(
											timedOut[
												`${row.message.guildId}-${row.message.authorId}`
											],
										).getTime() > Date.now()
								) {
									row.message.communicationDisabled = true;
								}
							}
						}

						args[1] = JSON.stringify(rows);
					}),
				);
			}
		},
		onStop() {},
	},
});
