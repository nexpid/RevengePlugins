import { resolveSemanticColor } from "$/types";
import { logger } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { updateMessages } from "./messages";

enum StateAction {
	Installing = "Installing",
	Uninstalling = "Uninstalling",
}

const CodedLinkExtendedType = findByProps("CodedLinkExtendedType")
	?.CodedLinkExtendedType as { EMBEDDED_ACTIVITY_INVITE: 3 };

const pluginInstalling = new Map<string, StateAction>();
const pluginInfo = new Map<string, PluginManifest | null>();

function retrievePluginInfo(plugin: string): PluginManifest | null {
	if (pluginInfo.has(plugin)) return pluginInfo.get(plugin)!;

	pluginInfo.set(plugin, null);
	(async () => {
		let data: PluginManifest | null = null;
		try {
			// cache for 30 mins
			data = await fetch(`${plugin}manifest.json`, {
				cache: "force-cache",
				headers: {
					"cache-control": "public, max-age=30",
				},
			}).then(x => x.json());
		} catch {
			data = null;
		}

		pluginInfo.set(plugin, data);
		updateMessages(plugin);
	})();

	return null;
}

function getPluginState(plugin: string) {
	return {
		installed: !!plugins[plugin],
		action: pluginInstalling.get(plugin),
	};
}

export function runPluginStateCta(plugin: string) {
	const info = retrievePluginInfo(plugin), state = getPluginState(plugin);
	if (!info || state.action) return;

	pluginInstalling.set(
		plugin,
		state.installed ? StateAction.Uninstalling : StateAction.Installing,
	);
	updateMessages(plugin);

	const promise: Promise<void> = state.installed
		? removePlugin(plugin) as any
		: installPlugin(plugin, true);
	const txtStatus = state.installed ? "Uninstalled" : "Installed";
	const txtLog = state.installed ? "uninstall" : "install";

	promise
		.then(() => showToast(`${txtStatus} ${info.name}`, getAssetIDByName("CircleCheckIcon-primary")))
		.catch((err) => {
			logger.error(err);
			showToast(
				`Failed to ${txtLog} ${info.name}`,
				getAssetIDByName("CircleXIcon-primary"),
			);
		})
		.finally(() => {
			pluginInstalling.delete(plugin);
			updateMessages(plugin);
		});
}

function resolve(semantic: any) {
	return ReactNative.processColor(resolveSemanticColor(semantic));
}

function getCodedLinkProps() {
	return {
		backgroundColor: resolve(semanticColors.CARD_BACKGROUND_DEFAULT), // #131318ff
		borderColor: resolve(semanticColors.BORDER_MUTED), // #6c6f7c24
		headerColor: resolve(semanticColors.TEXT_SUBTLE), // #a8aab4ff
		acceptLabelBackgroundColor: resolve(
			semanticColors.REDESIGN_BUTTON_PRIMARY_BACKGROUND,
		), // #5865f2
		type: 0,
		extendedType: CodedLinkExtendedType.EMBEDDED_ACTIVITY_INVITE,
		headerText: "",
		participantAvatarUris: [],
	};
}

export function getCodedLink(plugin: string) {
	const info = retrievePluginInfo(plugin);
	if (!info) return;

	const { installed, action } = getPluginState(plugin);
	const obj = {
		...getCodedLinkProps(),
		titleText: info.name,
		noParticipantsText: `\n${info.description}`,
		acceptLabelText: action || (installed ? "Uninstall" : "Install"),
		ctaEnabled: !action,
	};

	if (action) {
		obj.acceptLabelBackgroundColor = resolve(
			semanticColors.REDESIGN_BUTTON_SECONDARY_BACKGROUND,
		);
	} else if (installed) {
		obj.acceptLabelBackgroundColor = resolve(
			semanticColors.REDESIGN_BUTTON_DANGER_BACKGROUND,
		);
	}

	return obj;
}
