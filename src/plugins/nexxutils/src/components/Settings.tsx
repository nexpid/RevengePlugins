import { ReactNative as RN } from "@vendetta/metro/common";
import { ErrorBoundary } from "@vendetta/ui/components";

import { BetterTableRowGroup } from "$/components/BetterTableRow";
import Text from "$/components/Text";

import { version } from "..";
import modules from "../modules";
import { moduleCategoryMap } from "../stuff/Module";
import SillyAvatar from "./SillyAvatar";

export default () => {
	return (
		<RN.ScrollView>
			<RN.View
				style={{
					marginHorizontal: 20,
					marginTop: 20,
					marginBottom: 10,
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<SillyAvatar />
				<Text variant="text-lg/semibold" color="TEXT_NORMAL">
					NexxUtils v{version}
				</Text>
			</RN.View>
			{moduleCategoryMap.map(({ category, title, icon }) => {
				const mods = modules.filter(x => x.category === category);
				return (
					<BetterTableRowGroup
						title={title}
						icon={icon}
						padding={mods.length === 0}
					>
						{mods.length > 0
							? (
								mods.map(x => (
									<ErrorBoundary>
										<x.component />
									</ErrorBoundary>
								))
							)
							: (
								<Text
									variant="text-md/semibold"
									color="TEXT_NORMAL"
									style={{ fontStyle: "italic" }}
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
