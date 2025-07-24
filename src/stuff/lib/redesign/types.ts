import type {
	FlexAlignType,
	ImageSourcePropType,
	PressableProps,
	TextInputProps,
	ViewProps,
} from "react-native";
import type { SharedValue } from "react-native-reanimated";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "tertiary"
	| "primary-overlay"
	| "secondary-overlay"
	| "destructive"
	| "active";

export interface PrimitiveButton {
	onPress?: () => void;
	disabled?: boolean;
	icon?: ImageSourcePropType | React.ReactNode;
	style?: ViewProps["style"];
}
export interface PrimitiveButtonIcon {
	source: ImageSourcePropType;
}

export type Button =
	& React.FC<
		PrimitiveButton & {
			variant?: ButtonVariant;
			size?: "sm" | "md" | "lg";
			text: string;
			iconPosition?: "start" | "end";
			grow?: boolean;
			loading?: boolean;
			onPressIn?: () => void;
			onPressOut?: () => void;
		}
	>
	& {
		Icon: React.FC<PrimitiveButtonIcon>;
	};

export type RowButton =
	& React.FC<
		PrimitiveButton & {
			icon?: ImageSourcePropType;
			label: string;
			subLabel?: string;
			variant?: "primary" | "secondary";
			trailing?: React.ReactNode;
			disabled?: boolean;
			arrow?: boolean;
			/** Requires onPress to bet set */
			onPressIn?: () => void;
			/** Requires onPress to bet set */
			onPressOut?: () => void;
		}
	>
	& {
		Icon: React.FC<
			PrimitiveButtonIcon & {
				variant?: "secondary" | "danger" | "blurple" | "boosting-pink";
			}
		>;
	};

export type FAB = React.FC<{
	icon: ImageSourcePropType;
	onPress?: () => void;
	text?: string;
	positionBottom?: number;
	state?: {
		collapseText?: SharedValue;
	};
}>;

export type IconButton = React.FC<{
	icon: ImageSourcePropType | React.ReactNode;
	onPress?: () => void;
	onLongPress?: () => void;
	loading?: boolean;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	variant?: ButtonVariant;
	style?: ViewProps["style"];
}>;

export type ContextMenu = React.FC<{
	title?: string;
	triggerOnLongPress?: boolean;
	align?: "left" | "right" | "above" | "below";
	items: {
		label: string;
		variant: "default" | "destructive";
		action: () => void;
		iconSource?: ImageSourcePropType;
		// TODO add IconComponent
	}[];
	children: (data: {
		ref: React.MutableRefObject<any>;
		onPress: (() => void) | undefined;
		onLongPress: (() => void) | undefined;
		onAccessibilityAction: () => void;
		accessibilityActions: { name: string; label: string }[];
	}) => React.ReactNode | undefined;
}>;

export type Slider = React.FC<{
	value: number;
	accessibilityLabel?: string;
	accessibilityValue?: {
		text: string;
	};
	step: number;
	onValueChange?: (value: number) => void;
	minimumValue: number;
	maximumValue: number;
	onSlidingStart?: () => void;
	onSlidingComplete?: () => void;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
}>;

export type TextInput = React.FC<
	Omit<TextInputProps, "onChange"> & {
		onChange?: (value: string) => void;
		size?: "sm" | "md" | "lg";
		label?: string;
		description?: React.ReactNode;
		focusable?: boolean;
		isDisabled?: boolean;
		leadingPressableProps?: PressableProps;
		leadingIcon?: React.FC;
		leadingText?: string;
		trailingPressableProps?: PressableProps;
		trailingIcon?: React.FC;
		trailingText?: string;
		isClearable?: boolean;
		status?: "error" | "default";
		errorMessage?: string;
		isCentered?: boolean;
		grow?: boolean;
		isRound?: boolean;
		ref?: any;
	}
>;

type controlState = symbol;
export type Tabs = React.FC<{
	state: controlState;
}>;

export type Card = React.FC<ViewProps>;

export type Stack = React.FC<
	React.PropsWithChildren<{
		direction?: "horizontal" | "vertical";
		spacing?: number;
		align?: FlexAlignType;
		style?: ViewProps["style"];
	}>
>;

export type useSegmentedControlState = (state: {
	defaultIndex: number;
	items: {
		label: string;
		id: string;
		page: React.ReactNode;
	}[];
	pageWidth: number;
}) => controlState;
