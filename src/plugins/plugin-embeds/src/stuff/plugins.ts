import { plugins } from "@vendetta/plugins";
import { semanticColors } from "@vendetta/ui";

import { androidifyColor, resolveSemanticColor } from "$/types";

import { pluginInstallingCache, updateMessages } from "./messages";

const pluginInfoCache = {} as Record<string, PluginManifest | null>;
const getPluginInfo = (
	plugin: string,
): {
	res: PluginManifest | null | false;
	promise?: Promise<PluginManifest | null>;
} => {
	if (pluginInfoCache[plugin] !== undefined) {
		return { res: pluginInfoCache[plugin] };
	}

	if (plugins[plugin]) {
		return {
			res: (pluginInfoCache[plugin] = plugins[plugin].manifest),
		};
	}

	// suffer
	return {
		res: false,
		promise: (async () => {
			try {
				pluginInfoCache[plugin] = await (
					await fetch(`${plugin}manifest.json`, {
						headers: { "cache-control": "public; max-age=30" },
					})
				).json();
			} catch (_e) {
				pluginInfoCache[plugin] = null;
			}
			updateMessages(plugin);
			return pluginInfoCache[plugin];
		})(),
	};
};

export const getCodedLink = (plugin: string) => {
	const obj = {
		borderColor: 0,
		backgroundColor: androidifyColor(
			resolveSemanticColor(semanticColors.BACKGROUND_SECONDARY),
		),
		thumbnailCornerRadius: 0,
		headerColor: androidifyColor(
			resolveSemanticColor(semanticColors.HEADER_PRIMARY),
		),
		headerText: "",
		acceptLabelBackgroundColor: 0,
		titleText: "",
		type: null,
		extendedType: 4,
		participantAvatarUris: [],
		acceptLabelText: "",
		noParticipantsText: "",
		ctaEnabled: false,
		plugin,
	};

	const info = getPluginInfo(plugin).res;
	const installing = pluginInstallingCache[plugin];

	if (info === false) {
		obj.headerText = "...";
	} else if (info === null) {
		obj.headerText = "unknown plugin";
	} else {
		obj.titleText = info.name;
		obj.noParticipantsText = `\n${info.description}`;
		obj.ctaEnabled = !installing;

		const has = !!plugins[plugin];
		obj.acceptLabelBackgroundColor = androidifyColor(
			resolveSemanticColor(
				!has || installing
					? semanticColors.BUTTON_POSITIVE_BACKGROUND
					: semanticColors.BUTTON_DANGER_BACKGROUND,
			),
		);
		obj.acceptLabelText = installing
			? "..."
			: has
			? "Uninstall Plugin"
			: "Install Plugin";
	}

	return obj;
};
