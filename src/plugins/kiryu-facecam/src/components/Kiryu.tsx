import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import { Reanimated } from "$/deps";

import kazuma from "../../assets/kazuma.png";
import { vstorage } from "..";

export const kyrDt = {
	w: 220,
	h: 146,
	col: 5,
	row: 4,
};

const rem = (rad: number) => rad * 16;
const width = rem(15);
const height = Math.floor(rem((kyrDt.h / kyrDt.w) * 15));

export let frameSet: (frame: number) => void;
export let openSet: (open: boolean) => void;
export let scaleSet: () => void;

export const kyriuStyles = stylesheet.createThemedStyleSheet({
	base: {
		position: "absolute",
		left: 0,
		top: 0,
		width: "100%",
		height: "100%",
		flexDirection: "row",
	},
	frame: {
		width,
		height,
		zIndex: 100,
		overflow: "hidden",
	},
	empty: {
		position: "absolute",
		left: 0,
		top: 0,
		width: width * kyrDt.col,
		height: height * kyrDt.row,
	},
});

export default function Kiryu({ oldUI }: { oldUI: boolean }) {
	useProxy(vstorage);

	const [frame, setFrame] = React.useState(0);
	frameSet = setFrame;
	const [open, setOpen] = React.useState(false);
	openSet = setOpen;

	const wHeight = RN.Dimensions.get("screen").height;

	let yPosOff = 0;
	let yPos = 0;

	const padding = wHeight / 5;

	if (vstorage.styling.yPos === "top") {
		yPosOff = -height - padding;
		yPos = oldUI ? rem(2.5) : rem(6);
	} else if (vstorage.styling.yPos === "middle") {
		yPosOff = -height - wHeight;
		yPos = 0;
	} else {
		yPosOff = -height - padding;
		yPos = rem(5);
	}

	const posVal = Reanimated.useSharedValue(
		vstorage.appear.style === "fly" ? yPosOff : yPos,
	);
	const opVal = Reanimated.useSharedValue(
		vstorage.appear.style !== "fade" ? vstorage.styling.opacity / 10 : 0,
	);
	const rotVal = Reanimated.useSharedValue(
		vstorage.effects.swinging.enabled ? "-5deg" : "0deg",
	);
	const scaleVal = Reanimated.useSharedValue(1);

	React.useEffect(() => {
		if (vstorage.appear.style === "fly") {
			opVal.value = vstorage.styling.opacity / 10;
			posVal.value = Reanimated.withTiming(open ? yPos : yPosOff, {
				duration: vstorage.appear.speed,
				easing: open
					? Reanimated.Easing.out(Reanimated.Easing.back(1.5))
					: Reanimated.Easing.in(Reanimated.Easing.cubic),
			});
		} else if (vstorage.appear.style === "fade") {
			posVal.value = yPos;
			opVal.value = Reanimated.withTiming(
				open ? vstorage.styling.opacity / 10 : 0,
				{
					duration: vstorage.appear.speed,
				},
			);
		} else {
			posVal.value = yPos;
			opVal.value = vstorage.styling.opacity / 10;
		}
	}, [
		open,
		vstorage.appear.style,
		vstorage.appear.speed,
		vstorage.styling.opacity,
	]);

	React.useEffect(() => {
		if (vstorage.effects.swinging.enabled) {
			rotVal.value = Reanimated.withRepeat(
				Reanimated.withTiming("5deg", {
					duration: vstorage.effects.swinging.speed,
				}),
				-1,
				true,
			);
		} else rotVal.value = "0deg";
	}, [vstorage.effects.swinging.enabled, vstorage.effects.swinging.speed]);

	scaleSet = () => {
		if (!vstorage.effects.bounce.enabled) return;
		scaleVal.value = vstorage.effects.bounce.multiplier;
		scaleVal.value = Reanimated.withTiming(1, {
			duration: vstorage.effects.bounce.speed,
		});
	};

	return (
		<RN.View
			style={[
				kyriuStyles.base,
				{
					justifyContent: vstorage.styling.xPos === "left"
						? "flex-start"
						: vstorage.styling.xPos === "right"
						? "flex-end"
						: "center",
					alignItems: vstorage.styling.yPos === "top"
						? "flex-start"
						: vstorage.styling.yPos === "bottom"
						? "flex-end"
						: "center",
				},
			]}
			pointerEvents="none"
		>
			<Reanimated.default.View
				style={[
					kyriuStyles.frame,
					{
						marginVertical: posVal,
						opacity: opVal,
						transform: [{ rotate: rotVal }, { scale: scaleVal }],
					},
				]}
			>
				<RN.Image
					source={kazuma}
					style={[
						kyriuStyles.empty,
						{
							left: -(frame % kyrDt.col) * width,
							top: -Math.floor(frame / kyrDt.col) * height,
						},
					]}
					resizeMode="stretch"
				/>
			</Reanimated.default.View>
		</RN.View>
	);
}
