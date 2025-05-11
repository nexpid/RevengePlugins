import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";

import type * as t from "./types"; // shamelessly stolen from Bunny

const NotFound = (prop: string, isFunction?: boolean) => () => {
	const trigger = () => {
		showToast(`${prop} not found! Search for PNF in Debug Logs!`);
		console.warn(
			`!! PNF ERROR !!\nMissing the redesign ${
				isFunction ? "function" : "component"
			}: ${prop}. Please bug @nexpid about this on Discord!`,
		);
	};

	if (isFunction) trigger();
	else React.useEffect(trigger, []);

	return null;
};

const findProp = (...props: string[]) => findByProps(...props)?.[props[0]];
const findPropPolyfill = (isFunction: boolean, ...props: string[]) =>
	findProp(...props) ?? NotFound(props[0], isFunction);

// components

// buttons
export const Button = findPropPolyfill(false, "Button") as t.Button;
export const RowButton = findPropPolyfill(false, "RowButton") as t.RowButton;
export const FloatingActionButton = findPropPolyfill(
	false,
	"FloatingActionButton",
) as t.FAB;
export const PressableScale = findPropPolyfill(
	false,
	"PressableScale",
) as typeof RN.Pressable;
export const IconButton = findPropPolyfill(false, "IconButton") as t.IconButton;
export const ContextMenu = findPropPolyfill(
	false,
	"ContextMenu",
) as t.ContextMenu;

// inputs
const _Slider = findPropPolyfill(false, "Slider");
export const Slider =
	(props => (
		<RN.View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12 }}>
			<_Slider
				{...props}
				onValueChange={(val: any) => props.value !== val && props.onValueChange?.(val)}
			/>
		</RN.View>
	)) as t.Slider;
export const TextInput = findPropPolyfill(false, "TextInput") as t.TextInput;

// tabs
export const Tabs = findPropPolyfill(false, "Tabs") as t.Tabs;
export const SegmentedControlPages = findPropPolyfill(
	false,
	"SegmentedControlPages",
) as t.Tabs;

// views
export const Card = findPropPolyfill(false, "Card") as t.Card;
export const Stack = findPropPolyfill(false, "Stack") as t.Stack;

// functions

export const useSegmentedControlState = findPropPolyfill(
	true,
	"useSegmentedControlState",
) as t.useSegmentedControlState;
