import { findByName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

import ManageGuildSection from "../components/ManageGuildSection";
import AppDirectoryPage from "../components/pages/AppDirectoryPage";
import AppInfoPage from "../components/pages/AppInfoPage";

const GuildSettingsModal = findByName("GuildSettingsModal", false);
const GuildSettingsModalLanding = findByName("GuildSettingsModalLanding", false);

export default () => {
	const patches = new Array<() => void>();

	patches.push(
		after("default", GuildSettingsModal, (_, ret) => {
			ret.props.screens = {
				...ret.props.screens,
				APP_DIRECTORY: {
					title: "App Directory",
					render: AppDirectoryPage,
				},
				APP_INFO: {
					title: "",
					render: AppInfoPage,
				},
			};
		}),
	);

	let bowomp: () => void;
	patches.push(() => bowomp?.());
	patches.push(
		after("default", GuildSettingsModalLanding, (_, main) => {
			bowomp?.();
			bowomp = after("type", main, (_, content) => {
				const sett = findInReactTree(
					content,
					x => x.type?.name === "SettingsSection",
				);
				if (!sett) return;

				patches.push(
					after(
						"type",
						sett,
						([{ guild, pushScreen }], sret) => {
							return React.createElement(React.Fragment, {}, [
								sret,
								React.createElement(ManageGuildSection, {
									run: () =>
										pushScreen("APP_DIRECTORY", {
											guildId: guild.id,
											pushScreen,
										}),
								}),
							]);
						},
						true,
					),
				);
			});
		}),
	);

	return () => {
		for (const x of patches) {
			x();
		}
	};
};
