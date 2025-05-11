import { stylesheet } from "@vendetta/metro/common";
import { rawColors } from "@vendetta/ui";

import { resolveCustomSemantic } from "$/types";

export interface ColorStyles {
	backgroundColor: string;
	borderColor?: string;
	opacity?: number;
}

export interface IconColorStyles {
	tintColor: string;
	opacity?: number;
}

export interface LayoutStyles {
	width?: number;
	height?: number;
	left?: number;
	right?: number;
	[extra: string]: any;
}

const mdSysColor = {
	primary: () => resolveCustomSemantic(rawColors.BRAND_300, rawColors.BRAND_560),
	onPrimary: () => resolveCustomSemantic(rawColors.BRAND_730, rawColors.WHITE),
	primaryContainer: () => resolveCustomSemantic(rawColors.BRAND_630, rawColors.BRAND_200),
	onPrimaryContainer: () =>
		resolveCustomSemantic(rawColors.BRAND_200, rawColors.BRAND_630),

	surface: () => resolveCustomSemantic(rawColors.PRIMARY_860, rawColors.PRIMARY_100),
	onSurface: () => resolveCustomSemantic(rawColors.PRIMARY_200, rawColors.PRIMARY_830),
	onSurfaceVariant: () =>
		resolveCustomSemantic(rawColors.PRIMARY_300, rawColors.PRIMARY_630),
	surfaceContainerHighest: () =>
		resolveCustomSemantic(rawColors.PRIMARY_730, rawColors.PRIMARY_200),

	outline: () => resolveCustomSemantic(rawColors.PRIMARY_400, rawColors.PRIMARY_500),
};

export const layoutStyles = stylesheet.createThemedStyleSheet({
	track: {
		width: 52,
		height: 32,
		borderWidth: 2,
		borderRadius: 2147483647,
	},
	handleContainer: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
	},
	handle: {
		position: "absolute",
		borderRadius: 2147483647,
		justifyContent: "center",
		alignItems: "center",
	},
	handleOn: {
		width: 24,
		height: 24,
		right: 2,
	},
	handleOff: {
		width: 16,
		height: 16,
		left: 6,
	},
	handleOffBig: {
		width: 24,
		height: 24,
		left: 2,
	},
	handleOnPressed: {
		width: 28,
		height: 28,
		right: 0,
	},
	handleOffPressed: {
		width: 28,
		height: 28,
		left: 0,
	},
	icon: {
		position: "absolute",
		left: 0,
		top: 0,
		width: 16,
		height: 16,
	},
	ripple: {
		width: 16,
		height: 16,
		borderRadius: 2147483647,
	},
	ripplePressed: {
		width: 40,
		height: 40,
	},
});
export const makeEnabledStyles = () =>
	stylesheet.createThemedStyleSheet({
		trackOn: {
			backgroundColor: mdSysColor.primary(),
			borderColor: mdSysColor.primary(),
		},
		trackOff: {
			backgroundColor: mdSysColor.surfaceContainerHighest(),
			borderColor: mdSysColor.outline(),
		},
		handleOn: {
			backgroundColor: mdSysColor.onPrimary(),
		},
		handleOff: {
			backgroundColor: mdSysColor.outline(),
		},
		handleOnPressed: {
			backgroundColor: mdSysColor.primaryContainer(),
		},
		handleOffPressed: {
			backgroundColor: mdSysColor.onSurfaceVariant(),
		},
		iconOn: {
			tintColor: mdSysColor.onPrimaryContainer(),
		},
		iconOff: {
			tintColor: mdSysColor.surfaceContainerHighest(),
		},
		rippleOnPressed: {
			backgroundColor: mdSysColor.primary(),
			opacity: 0.12,
		},
		rippleOffPressed: {
			backgroundColor: mdSysColor.onSurface(),
			opacity: 0.12,
		},
	});
export const makeDisabledStyles = () =>
	stylesheet.createThemedStyleSheet({
		trackOn: {
			opacity: 0.12,
			backgroundColor: mdSysColor.onSurface(),
			borderColor: mdSysColor.onSurface(),
		},
		trackOff: {
			opacity: 0.12,
			backgroundColor: mdSysColor.onSurface(),
			borderColor: mdSysColor.onSurface(),
		},
		handleOn: {
			backgroundColor: mdSysColor.surface(),
		},
		handleOff: {
			opacity: 0.38,
			backgroundColor: mdSysColor.onSurface(),
		},
		iconOn: {
			tintColor: mdSysColor.onSurface(),
			opacity: 0.38,
		},
		iconOff: {
			tintColor: mdSysColor.surfaceContainerHighest(),
			opacity: 0.38,
		},
	});

export function getStyles() {
	return {
		enabledStyles: makeEnabledStyles(),
		disabledStyles: makeDisabledStyles(),
	};
}
