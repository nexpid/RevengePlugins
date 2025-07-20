// Based on: https://github.com/pyoncord/Bunny/blob/dev/src/lib/ui/settings/patches/panel.tsx

import { logger } from "@vendetta";
import { NavigationNative } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import intlProxy from "../intlProxy";
import type { PinToSettingsTabs } from ".";

const { FormSection, FormRow } = Forms;

function Section({ tabs }: { tabs: PinToSettingsTabs }) {
	const navigation = NavigationNative.useNavigation();

	return (
		<FormRow
			label={tabs.title()}
			leading={<FormRow.Icon source={tabs.icon} />}
			trailing={
				<>
					{tabs.trailing ? tabs.trailing : null}
					<FormRow.Arrow />
				</>
			}
			// Based on: https://github.com/pyoncord/Bunny/blob/dev/src/lib/ui/settings/patches/shared.tsx
			onPress={() => {
				const Component = tabs.page;

				navigation.navigate("BUNNY_CUSTOM_PAGE", {
					title: tabs.title(),
					render: () => <Component />,
				});
			}}
		/>
	);
}

export function patchPanelUI(tabs: PinToSettingsTabs, patches: (() => void)[]) {
	const { bunny } = window as any;

	// panel settings were removed in version 264.5 💔
	try {
		patches.push(
			after(
				"default",
				bunny.metro.findByNameLazy(
					"UserSettingsOverviewWrapper",
					false,
				),
				(_, ret) => {
					const UserSettingsOverview = findInReactTree(
						ret.props.children,
						n => n.type?.name === "UserSettingsOverview",
					);

					patches.push(
						after(
							"render",
							UserSettingsOverview.type.prototype,
							(_args, res) => {
								const titles = [
									intlProxy.BILLING_SETTINGS,
									intlProxy.PREMIUM_SETTINGS,
								];

								const sections = findInReactTree(
									res.props.children,
									n => n?.children?.[1]?.type === FormSection,
								)?.children;

								if (sections) {
									const index = sections.findIndex((c: any) => titles.includes(c?.props.label));

									sections.splice(
										-~index || 4,
										0,
										<Section tabs={tabs} />,
									);
								}
							},
						),
					);
				},
				true,
			),
		);
	} catch {
		logger.info("Panel UI patch failed graciously 💔");
	}
}
