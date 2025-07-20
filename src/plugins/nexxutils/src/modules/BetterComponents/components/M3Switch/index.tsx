// CODE REVIEW: always include a fallback sharedValue.value style before using the actual sharedValue because reanimated is buggy :P

import { React, ReactNative as RN } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { Reanimated } from "$/deps";

import {
	type ColorStyles,
	getStyles,
	type IconColorStyles,
	type LayoutStyles,
	layoutStyles,
} from "./styles";

const AnimatedPressable = Reanimated.default.createAnimatedComponent(
	RN.Pressable,
);

const emphasizedDecelerate = Reanimated.Easing.bezier(0.05, 0.7, 0.1, 1);
const emphasizedAccelerate = Reanimated.Easing.bezier(0.3, 0, 0.8, 0.15);

const SwitchStateContext = React.createContext({
	value: false,
	disabled: false,
	isPressing: false,
	showIcons: false,
});

function Track({
	onValueChange,
	setIsPressing,
	style,
	children,
}: React.PropsWithChildren<{
	onValueChange?: (value: boolean) => void;
	setIsPressing: (value: boolean) => void;
	style: any;
}>) {
	const { value, disabled } = React.useContext(SwitchStateContext);
	const { enabledStyles, disabledStyles } = getStyles();

	// Colors
	const colors = (
		value
			? disabled
				? disabledStyles.trackOn
				: enabledStyles.trackOn
			: disabled
			? disabledStyles.trackOff
			: enabledStyles.trackOff
	) as ColorStyles;

	const backgroundColor = Reanimated.useSharedValue(colors.backgroundColor);
	const borderColor = Reanimated.useSharedValue(colors.borderColor);
	const opacity = Reanimated.useSharedValue(colors.opacity ?? 1);

	React.useEffect(() => {
		const config = {
			duration: 100,
			easing: emphasizedAccelerate,
			reducedMotion: Reanimated.ReduceMotion.Never,
		};

		backgroundColor.value = Reanimated.withTiming(
			colors.backgroundColor,
			config,
		);
		borderColor.value = Reanimated.withTiming(colors.borderColor!, config);
		opacity.value = Reanimated.withTiming(colors.opacity ?? 1, config);
	}, [value, disabled]);

	return (
		<AnimatedPressable
			style={[
				layoutStyles.track,

				{
					backgroundColor: backgroundColor.value,
					borderColor: borderColor.value,
					opacity: opacity.value,
				},
				{ backgroundColor, borderColor, opacity },

				style,
			]}
			onPress={() => onValueChange?.(!value)}
			onFocus={() => setIsPressing(true)}
			onBlur={() => setIsPressing(false)}
			onHoverIn={() => setIsPressing(true)}
			onHoverOut={() => setIsPressing(false)}
			onPressIn={() => setIsPressing(true)}
			onPressOut={() => setIsPressing(false)}
			key="track"
		>
			{children}
		</AnimatedPressable>
	);
}

function Handle({ children }: React.PropsWithChildren<any>) {
	const { value, disabled, isPressing, showIcons } = React.useContext(SwitchStateContext);
	const { enabledStyles, disabledStyles } = getStyles();

	// Layout
	const layout = (
		isPressing
			? value
				? layoutStyles.handleOnPressed
				: layoutStyles.handleOffPressed
			: value
			? layoutStyles.handleOn
			: showIcons
			? layoutStyles.handleOffBig
			: layoutStyles.handleOff
	) as LayoutStyles;

	function getState() {
		const width = layoutStyles.track.width!;
		const { left, right } = layout;
		const size = layout.width!;

		const x = typeof left === "number"
			? left
			: typeof right === "number"
			? width - size - 4 - right
			: 0;

		return { left: x };
	}

	const defState = getState();
	const width = Reanimated.useSharedValue(layout.width!);
	const height = Reanimated.useSharedValue(layout.height!);
	const left = Reanimated.useSharedValue(defState.left);
	const top = Reanimated.useSharedValue(layout.height! / -2);

	React.useEffect(() => {
		const state = getState();

		width.value = Reanimated.withTiming(layout.width!, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		height.value = Reanimated.withTiming(layout.height!, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		left.value = Reanimated.withTiming(state.left, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		top.value = Reanimated.withTiming(layout.height! / -2, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
	}, [value, disabled, isPressing]);

	// Colors
	const colors = (
		disabled
			? value
				? disabledStyles.handleOn
				: disabledStyles.handleOff
			: isPressing
			? value
				? enabledStyles.handleOnPressed
				: enabledStyles.handleOffPressed
			: value
			? enabledStyles.handleOn
			: enabledStyles.handleOff
	) as ColorStyles;

	const backgroundColor = Reanimated.useSharedValue(colors.backgroundColor);
	const opacity = Reanimated.useSharedValue(colors.opacity ?? 1);

	React.useEffect(() => {
		const config = { duration: 100, easing: emphasizedAccelerate };

		backgroundColor.value = Reanimated.withTiming(
			colors.backgroundColor,
			config,
		);
		opacity.value = Reanimated.withTiming(colors.opacity ?? 1, config);
	}, [value, disabled, isPressing]);

	const innerStyle = [
		layoutStyles.handle,
		{
			width: width.value,
			height: height.value,
			top: top.value,
		},
		{ width, height, top },
		{ zIndex: -50 },
	];

	return (
		<Reanimated.default.View
			style={[
				layoutStyles.handleContainer,

				{ left: left.value, top: (layoutStyles.track.height - 4) / 2 },
				{ left },
			]}
			key="handle-container"
		>
			<RN.View>
				<Reanimated.default.View
					style={innerStyle}
					key="handle-children-spacing"
				>
					{children}
				</Reanimated.default.View>
				<Reanimated.default.View
					style={[innerStyle, { zIndex: 51 }]}
					key="handle-icon-spacing"
				>
					<Icon />
				</Reanimated.default.View>
				<Reanimated.default.View
					style={[
						innerStyle,

						{
							backgroundColor: backgroundColor.value,
							opacity: opacity.value,
						},
						{ backgroundColor, opacity },

						{ zIndex: 50 },
					]}
					key="handle"
				/>
			</RN.View>
		</Reanimated.default.View>
	);
}

function Icon() {
	const { value, disabled, showIcons } = React.useContext(SwitchStateContext);
	const { enabledStyles, disabledStyles } = getStyles();

	// Colors
	const colors = (
		disabled
			? value
				? disabledStyles.iconOn
				: disabledStyles.iconOff
			: value
			? enabledStyles.iconOn
			: enabledStyles.iconOff
	) as IconColorStyles;

	const tintColor = Reanimated.useSharedValue(colors.tintColor);
	const enabOpacity = Reanimated.useSharedValue(
		value ? (colors.opacity ?? 1) : 0,
	);
	const disbOpacity = Reanimated.useSharedValue(
		!value ? (colors.opacity ?? 1) : 0,
	);

	React.useEffect(() => {
		tintColor.value = Reanimated.withTiming(colors.tintColor, {
			duration: 100,
			easing: emphasizedDecelerate,
		});
		enabOpacity.value = Reanimated.withDelay(
			50,
			Reanimated.withTiming(value ? (colors.opacity ?? 1) : 0, {
				duration: 50,
				easing: emphasizedDecelerate,
			}),
		);
		disbOpacity.value = Reanimated.withDelay(
			50,
			Reanimated.withTiming(!value ? (colors.opacity ?? 1) : 0, {
				duration: 50,
				easing: emphasizedDecelerate,
			}),
		);
	}, [value, disabled]);

	return (
		<RN.View key="icon" style={{ width: 16, height: 16 }}>
			<Reanimated.default.Image
				style={[
					layoutStyles.icon,

					{ tintColor: tintColor.value, opacity: enabOpacity.value },
					{ tintColor, opacity: enabOpacity },
				]}
				source={getAssetIDByName("CheckmarkLargeIcon")}
				key="icon-enabled"
			/>
			{showIcons && (
				<Reanimated.default.Image
					style={[
						layoutStyles.icon,

						{
							tintColor: tintColor.value,
							opacity: disbOpacity.value,
						},
						{ tintColor, opacity: disbOpacity },
					]}
					source={getAssetIDByName("XLargeIcon")}
					key="icon-disabled"
				/>
			)}
		</RN.View>
	);
}

function Ripple() {
	const { value, disabled, isPressing } = React.useContext(SwitchStateContext);
	const { enabledStyles } = getStyles();

	// Layout
	const layout = (
		isPressing && !disabled
			? layoutStyles.ripplePressed
			: layoutStyles.ripple
	) as LayoutStyles;

	const width = Reanimated.useSharedValue(layout.width!);
	const height = Reanimated.useSharedValue(layout.height!);
	const top = Reanimated.useSharedValue(layout.height! / -2);

	React.useEffect(() => {
		width.value = Reanimated.withTiming(layout.width!, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		height.value = Reanimated.withTiming(layout.height!, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		top.value = Reanimated.withTiming(layout.height! / -2, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
	}, [value, disabled, isPressing]);

	// Colors
	const colors = (
		isPressing && !disabled
			? value
				? enabledStyles.rippleOnPressed
				: enabledStyles.rippleOffPressed
			: {
				backgroundColor: "#fff",
				opacity: 0,
			}
	) as ColorStyles;

	const backgroundColor = Reanimated.useSharedValue(colors.backgroundColor);
	const opacity = Reanimated.useSharedValue(colors.opacity ?? 1);

	React.useEffect(() => {
		backgroundColor.value = Reanimated.withTiming(colors.backgroundColor, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
		opacity.value = Reanimated.withTiming(colors.opacity ?? 1, {
			duration: 200,
			easing: emphasizedDecelerate,
		});
	}, [value, disabled, isPressing]);

	return (
		<Reanimated.default.View
			style={[
				layoutStyles.ripple,

				{
					width: width.value,
					height: height.value,
				},
				{
					backgroundColor: backgroundColor.value,
					opacity: opacity.value,
				},
				{ width, height },
				{ backgroundColor, opacity },

				{ zIndex: -50 },
			]}
			key="ripple"
		/>
	);
}

export default function M3Switch({
	value,
	onValueChange,
	disabled,
	showIcons,
	style,
}: {
	value?: boolean;
	onValueChange?: (val: boolean) => void;
	disabled?: boolean;
	showIcons?: boolean;
	style?: any;
}) {
	const [isPressing, setIsPressing] = React.useState(false);

	return (
		<SwitchStateContext.Provider
			value={{
				value: !!value,
				disabled: !!disabled,
				showIcons: !!showIcons,
				isPressing,
			}}
		>
			<Track
				setIsPressing={setIsPressing}
				onValueChange={onValueChange}
				style={style}
			>
				<Handle>
					<Ripple />
				</Handle>
			</Track>
		</SwitchStateContext.Provider>
	);
}
