import { find, findByProps } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { without } from "@vendetta/utils";
import type { ImageSourcePropType, ViewProps } from "react-native";

const _ActionSheet = findByProps("ActionSheet")?.ActionSheet
	?? find(x => x.render?.name === "ActionSheet"); // thank you to @pylixonly for fixing this

const { ActionSheetTitleHeader, ActionSheetCloseButton } = findByProps(
	"ActionSheetTitleHeader",
	"ActionSheetCloseButton",
);

export const LazyActionSheet = findByProps("openLazy", "hideActionSheet") as {
	openLazy: (component: Promise<any>, key: string, props?: object) => void;
	hideActionSheet: () => void;
};
export const { openLazy, hideActionSheet } = LazyActionSheet;

export const { showSimpleActionSheet } = findByProps(
	"showSimpleActionSheet",
) as {
	showSimpleActionSheet: (props: {
		key: "CardOverflow";
		header: {
			title: string;
			subtitle?: string;
			icon?: React.ReactNode;
			onClose?: () => void;
		};
		options: {
			label: string;
			icon?: ImageSourcePropType;
			isDestructive?: boolean;
			onPress?: () => void;
		}[];
	}) => void;
};

type ActionSheetProps = React.PropsWithChildren<
	ViewProps & {
		title: string;
		onClose?: () => void;
	}
>;

export const ActionSheet = ((props: ActionSheetProps) => {
	return (
		<_ActionSheet>
			<ActionSheetTitleHeader
				title={props.title}
				trailing={
					<ActionSheetCloseButton
						onPress={props.onClose
							?? (() => {
								hideActionSheet();
							})}
					/>
				}
			/>
			<RN.View {...without(props, "title", "onClose")} />
		</_ActionSheet>
	);
}) as {
	(props: ActionSheetProps): JSX.Element;
	open: <Sheet extends React.FunctionComponent<any>>(
		sheet: Sheet,
		props: Parameters<Sheet>[0],
	) => void;
};

ActionSheet.open = (sheet, props) => {
	openLazy(
		new Promise(res => {
			res({
				default: sheet,
			});
		}) as any,
		"ActionSheet",
		props,
	);
};
