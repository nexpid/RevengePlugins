import { ReactNative as RN } from "@vendetta/metro/common";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";
import { ErrorBoundary } from "@vendetta/ui/components";
import modules from "../modules";
import { moduleCategoryMap } from "../stuff/Module";
import { Header } from "./Header";
import { ModuleInfo } from "./ModuleInfo";

export default () => {
	return (
		<RN.ScrollView>
			<Header />
			{moduleCategoryMap.map(({ category, title, icon }) => {
				const mods = modules.filter(x => x.meta.category === category);
				const noMods = mods.length === 0;
				return (
					<BetterTableRowGroup
						key={title}
						title={title}
						icon={icon}
						padding={noMods}
					>
						{mods.map(module => (
							<ErrorBoundary key={module.id}>
								<ModuleInfo module={module} />
							</ErrorBoundary>
						))}
						{noMods && (
							<Text
								variant="text-md/semibold"
								color="TEXT_DEFAULT"
							>
								{`No plugins in the ${title} category yet!`}
							</Text>
						)}
					</BetterTableRowGroup>
				);
			})}
			<RN.View style={{ height: 12 }} />
		</RN.ScrollView>
	);
};
