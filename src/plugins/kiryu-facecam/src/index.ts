import { storage } from "@vendetta/plugin";

import { Lang } from "$/lang";

import Settings from "./components/Settings";

export const vstorage = storage as {
	styling: {
		opacity: number;
		xPos: "left" | "center" | "right";
		yPos: "top" | "middle" | "bottom";
	};
	appear: {
		style: "fly" | "fade" | "always";
		speed: number;
	};
	effects: {
		swinging: {
			enabled: boolean;
			speed: number;
		};
		bounce: {
			enabled: boolean;
			multiplier: number;
			speed: number;
		};
	};
};

export const lang = new Lang("kiryu_facecam");

export function onLoad() {
	vstorage.styling ??= {
		opacity: 10,
		xPos: "center",
		yPos: "top",
	};
	vstorage.appear ??= {
		style: "fly",
		speed: 500,
	};
	vstorage.effects ??= {
		swinging: {
			enabled: true,
			speed: 900,
		},
		bounce: {
			enabled: true,
			multiplier: 1.05,
			speed: 100,
		},
	};
}

// export const onUnload = patcher();

export const settings = Settings();
