// Based on: https://github.com/pyoncord/Bunny/blob/dev/src/lib/ui/settings/patches/tabs.tsx

import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

import type { PinToSettingsTabs } from ".";

const { bunny } = window as any;

const { TableRowIcon } = findByProps("TableRowIcon");

const tabsNavigationRef = bunny.metro.findByPropsLazy("getRootNavigationRef");
const settingConstants = bunny.metro.findByPropsLazy("SETTING_RENDERER_CONFIG");
const SettingsOverviewScreen = bunny.metro.findByNameLazy(
	"SettingsOverviewScreen",
	false,
);

export function patchTabsUI(tabs: PinToSettingsTabs, patches: (() => void)[]) {
	const row = {
		[tabs.key]: {
			type: "pressable",
			title: tabs.title,
			icon: tabs.icon,
			IconComponent: tabs.icon && (() => <TableRowIcon source={tabs.icon} />),
			usePredicate: tabs.predicate,
			useTrailing: tabs.trailing,
			onPress: () => {
				const navigation = tabsNavigationRef.getRootNavigationRef();
				const Component = tabs.page;

				navigation.navigate("BUNNY_CUSTOM_PAGE", {
					title: tabs.title(),
					render: () => <Component />,
				});
			},
			withArrow: true,
		},
	};

	let rendererConfigValue = settingConstants.SETTING_RENDERER_CONFIG;

	Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
		enumerable: true,
		configurable: true,
		get: () => ({
			...rendererConfigValue,
			...row,
		}),
		set: v => (rendererConfigValue = v),
	});

	const firstRender = Symbol("pinToSettings meow meow");

	patches.push(
		after("default", SettingsOverviewScreen, (args, ret) => {
			// shrug??
			if (!args[0][firstRender]) {
				args[0][firstRender] = true;

				const { sections } = findInReactTree(
					ret,
					i => i.props?.sections,
				).props;
				const section = sections?.find((x: any) =>
					["Bunny", "Revenge"].some(
						mod => x.label === mod && x.title === mod,
					)
				);

				if (section?.settings) {
					section.settings = [...section.settings, tabs.key];
				}
			}
		}),
	);
}
