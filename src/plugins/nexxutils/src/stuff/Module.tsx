import { logger } from "@vendetta";
import { React } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import type { ImageSourcePropType } from "react-native";

import SmartMention from "$/components/SmartMention";
import { openModal, resolveSemanticColor } from "$/types";

import { vstorage } from "..";
import ErrorViewerModal from "../components/modals/ErrorViewerModal";

export enum ModuleCategory {
	Useful = 0,
	Fixes = 1,
	Fun = 2,
}
export const moduleCategoryMap = [
	{
		category: ModuleCategory.Useful,
		title: "Useful",
		icon: getAssetIDByName("PencilSparkleIcon"),
	},
	{
		category: ModuleCategory.Fixes,
		title: "Fixes",
		icon: getAssetIDByName("WrenchIcon"),
	},
	{
		category: ModuleCategory.Fun,
		title: "Fun",
		icon: getAssetIDByName("GameControllerIcon"),
	},
] as {
	category: ModuleCategory;
	title: string;
	icon: number;
}[];

export type ModuleSetting =
	& {
		label: string;
		icon?: number;
		disabled?: boolean;
		predicate?: (this: AnyModule) => boolean;
	}
	& (
		| {
			subLabel?: string | ((value: boolean) => string);
			type: "toggle";
			default: boolean;
		}
		| {
			type: "button";
			action: (this: AnyModule) => void;
		}
		| {
			subLabel?: string | ((value: string) => string);
			type: "choose";
			choices: string[];
			default: string;
		}
	);

class Patches {
	store = [] as (() => void)[];

	add(patch: () => void) {
		this.store.push(patch);
	}

	unpatch() {
		for (const x of this.store) {
			x();
		}
		this.store.length = 0;
	}
}

interface InternalModuleExtra {
	id: string;
	content?: React.ReactNode;
	color?: string;
	icon: string;
	action?: () => any;
}

export function getModuleExtras(module: AnyModule) {
	const extras: InternalModuleExtra[] = [];

	if (Object.keys(module.errors).length > 0) {
		extras.push({
			id: "errors",
			content: `Encountered ${Object.keys(module.errors).length} error${
				Object.keys(module.errors).length !== 1 ? "s" : ""
			}`,
			color: resolveSemanticColor(semanticColors.TEXT_FEEDBACK_CRITICAL),
			icon: "WarningIcon",
			action: () => {
				openModal(
					"error-viewer",
					ErrorViewerModal({
						errors: module.errors,
						module: module.label,
						clearEntry: e => {
							delete module.errors[e];
							module.refresh();
						},
					}),
				);
			},
		});
	}

	const extra = module.meta.extra;
	if (extra?.warning) {
		extras.push({
			id: "warning",
			content: extra.warning,
			color: resolveSemanticColor(semanticColors.TEXT_WARNING),
			icon: "BugIcon",
		});
	}

	if (module.meta.disabled) {
		extras.push({
			id: "disabled",
			content: "This plugin has been temporarily disabled by nexpid",
			color: resolveSemanticColor(semanticColors.ICON_MUTED),
			icon: "FireIcon",
		});
	} else if (extra?.disabled) {
		extras.push({
			id: "disabled",
			content: "One or more features in this plugin have been temporarily disabled by nexpid",
			color: resolveSemanticColor(semanticColors.ICON_MUTED),
			icon: "ScreenXIcon",
		});
	}

	if (extra?.credits) {
		extras.push({
			id: "credits",
			content: [
				"Additional credits go to: ",
				...extra.credits.map((x, i, a) => (
					<>
						{!Number.isNaN(Number(x))
							? (
								<SmartMention
									key={x}
									userId={x}
									loadUsername={true}
								/>
							)
							: x}
						{i !== a.length - 1 ? ", " : ""}
					</>
				)),
			],
			icon: "HandRequestSpeakIcon",
		});
	}

	return extras;
}

enum ModuleErrorLabel {
	OnStart = "Start Function",
	OnStop = "Stop Function",
}

interface ModuleExtra {
	credits?: string[];
	warning?: string;
	disabled?: boolean;
}

export interface ModuleMeta {
	sublabel: string;
	category: ModuleCategory;
	icon?: ImageSourcePropType;
	thumbnail?: ImageSourcePropType | {
		dark: ImageSourcePropType;
		light: ImageSourcePropType;
	};
	extra?: ModuleExtra;
	disabled?: boolean;
}

export type AnyModule = Module<Record<string, ModuleSetting>>;

export class Module<Settings extends Record<string, ModuleSetting>> {
	id: string;
	label: string;
	meta: ModuleMeta;
	settings: Settings;
	errors: Record<string, string> = {};

	private handlers: {
		onStart: (this: Module<Settings>) => void;
		onStop: (this: Module<Settings>) => void;
	};
	private started = false;
	private listeners = new Set<() => void>();

	disabledReason: string | undefined;
	patches = new Patches();

	constructor({
		id,
		label,
		meta,
		settings,
		handlers,
	}: {
		id: string;
		label: string;
		meta: ModuleMeta;
		settings?: Settings;
		handlers: {
			onStart: (this: Module<Settings>) => void;
			onStop: (this: Module<Settings>) => void;
		};
	}) {
		this.id = id;
		this.label = label;
		this.meta = meta;
		this.settings = Object.fromEntries(
			Object.entries(settings ?? {}).map(([x, y]) => {
				if ("default" in y) y.icon ??= getAssetIDByName("PencilIcon");
				return [x, y];
			}),
		) as Settings;
		this.handlers = handlers;
	}

	get storage(): {
		enabled: boolean;
		options: {
			[k in keyof Settings]: Settings[k] extends { default: infer D } ? D
				: never;
		};
	} {
		const options = Object.fromEntries(
			Object.entries(this.settings)
				.filter(([_, x]) => "default" in x)
				// @ts-expect-error fuck off typescript
				.map(([x, y]) => [x, y.default]),
		);

		vstorage.modules[this.id] ??= {
			enabled: false,
			options,
		};
		for (const [k, v] of Object.entries(options)) {
			const opts = vstorage.modules[this.id].options;
			if (typeof v !== typeof opts[k]) opts[k] = v;
		}

		return vstorage.modules[this.id] as any;
	}

	toggle() {
		this.storage.enabled = !this.storage.enabled;
		if (this.storage.enabled) this.start();
		else this.stop();
		this.refresh();
	}
	restart() {
		if (this.storage.enabled) {
			this.stop();
			this.start();
		}
		this.refresh();
	}
	start() {
		if (this.meta.disabled || this.started) return;

		this.disabledReason = undefined;
		try {
			this.started = true;
			this.handlers.onStart.bind(this)();
		} catch (e) {
			this.stop();
			this.started = false;
			const err = e instanceof Error ? e : new Error(String(e));

			logger.error(`[${this.label}]: Error on starting!\n${err}`);
			this.errors[ModuleErrorLabel.OnStart] = String(err.stack);

			showToast(
				"NexxUtils module errored on starting!",
				getAssetIDByName("CircleXIcon-primary"),
			);
			this.disabledReason = "Disabled due to an error";
		}
		this.refresh();
	}
	stop() {
		if (!this.started) return;

		this.disabledReason = undefined;
		try {
			this.started = false;
			this.handlers.onStop.bind(this)();
			this.patches.unpatch();
		} catch (e) {
			this.started = true;
			const err = e instanceof Error ? e : new Error(String(e));

			logger.error(`[${this.label}]: Error on stopping!\n${err.stack}`);
			this.errors[ModuleErrorLabel.OnStop] = String(err.stack);

			showToast(
				"NexxUtils module errored on stopping!",
				getAssetIDByName("CircleXIcon-primary"),
			);
			this.disabledReason = "Disabled due to an error";
		}
		this.refresh();
	}

	refresh() {
		this.listeners.forEach(x => x());
	}
	useRefresh() {
		const [_, refresh] = React.useReducer((x) => ~x, 0);

		React.useEffect(() => {
			this.listeners.add(refresh);
			return () => {
				this.listeners.delete(refresh);
			};
		}, []);
	}
}
