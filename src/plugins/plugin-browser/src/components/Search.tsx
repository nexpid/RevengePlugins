// https://raw.githubusercontent.com/pyoncord/Bunny/9809ef2cd4864d4f308c37016743f7d157e0ce3c/src/lib/ui/components/Search.tsx
// this is a modified version with some plugin browser specific changes

import { React, ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { ErrorBoundary } from "@vendetta/ui/components";
import type { TextInput as TextInputType } from "react-native";

import intlProxy from "$/lib/intlProxy";
import { ContextMenu, IconButton, TextInput } from "$/lib/redesign";
import { resolveSemanticColor } from "$/types";

import SortDateNewestIcon from "../../assets/SortDateNewestIcon.png";
import SortDateOldestIcon from "../../assets/SortDateOldestIcon.png";
import SortNameAZIcon from "../../assets/SortNameAZIcon.png";
import SortNameZAIcon from "../../assets/SortNameZAIcon.png";
import { lang } from "..";
import { Sort } from "./pages/PluginBrowserPage";

function SearchIcon() {
	return (
		<RN.Image
			style={{
				width: 16,
				height: 16,
				tintColor: resolveSemanticColor(
					semanticColors.INTERACTIVE_NORMAL,
				),
			}}
			source={getAssetIDByName("search")}
		/>
	);
}

export default function Search({
	onChangeText,
	filterSetSort,
	inputRef,
}: {
	onChangeText: (v: string) => void;
	filterSetSort: React.MutableRefObject<
		React.Dispatch<React.SetStateAction<Sort>>
	>;
	inputRef: React.MutableRefObject<TextInputType | undefined>;
}) {
	const [query, setQuery] = React.useState("");
	const [focused, setFocused] = React.useState(false);

	const onChange = (value: string) => {
		setQuery(value);
		onChangeText(value);
	};

	return (
		<ErrorBoundary>
			<RN.View
				style={{
					flexDirection: "row",
					justifyContent: "center",
					gap: 8,
					marginBottom: 5,
				}}
			>
				<RN.View
					style={{
						flexGrow: 1,
					}}
				>
					<TextInput
						grow
						isClearable
						leadingIcon={SearchIcon}
						placeholder={intlProxy.SEARCH}
						onChange={onChange}
						returnKeyType={"search"}
						size="md"
						autoCapitalize="none"
						autoCorrect={false}
						value={query}
						isRound
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						ref={inputRef}
					/>
				</RN.View>
				{!focused && !query && (
					<ContextMenu
						title={lang.format("sheet.sort.title", {})}
						items={Object.values(Sort).map(value => ({
							label: lang.format(value, {}),
							variant: "default",
							action: () => filterSetSort.current(value as Sort),
							iconSource: {
								"sheet.sort.date_newest": SortDateNewestIcon,
								"sheet.sort.date_oldest": SortDateOldestIcon,
								"sheet.sort.name_az": SortNameAZIcon,
								"sheet.sort.name_za": SortNameZAIcon,
							}[value],
						}))}
					>
						{(props: any) => (
							<IconButton
								icon={getAssetIDByName("FiltersHorizontalIcon")}
								size="md"
								variant="tertiary"
								{...props}
							/>
						)}
					</ContextMenu>
				)}
			</RN.View>
		</ErrorBoundary>
	);
}
