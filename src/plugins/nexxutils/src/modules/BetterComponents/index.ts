import { find, findByDisplayName, findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { after, instead } from "@vendetta/patcher";
import { assets } from "@vendetta/ui";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { Module, ModuleCategory } from "../../stuff/Module";
import M3Dialog from "./components/M3Dialog";
import M3Snackbar from "./components/M3Snackbar";
import M3Switch from "./components/M3Switch";

const { FormSwitch } = find(
	x => typeof x?.FormSwitch === "function" && !("FormRow" in x),
);
const Toast = findByName("Toast", false);
const Alert = findByDisplayName("FluxContainer(Alert)");

export default new Module({
	id: "better-components",
	label: "Better Components",
	sublabel: "Alters the way some Discord components look",
	category: ModuleCategory.Useful,
	icon: getAssetIDByName("BicycleIcon"),
	settings: {
		switch: {
			label: "Switch",
			subLabel(value) {
				return value === "Default"
					? "Does not modify switches"
					: value === "Tabs v2"
					? "Replaces switches with Tabs v2 switches"
					: "Makes switches look like Material UI switches";
			},
			type: "choose",
			choices: ["Default", "M3", "Tabs v2"],
			default: "M3",
			icon: getAssetIDByName("TicketIcon"),
		},
		switch_xicon: {
			label: "Switch X Icon",
			subLabel: "Show an \"X\" icon on disabled switches",
			type: "toggle",
			default: false,
			icon: getAssetIDByName("TicketIcon"),
			predicate() {
				return this.storage.options.switch === "M3";
			},
		},
		switch_toast: {
			label: "Test Switch",
			type: "toggle",
			default: false,
			icon: getAssetIDByName("BugIcon"),
		},
		toast: {
			label: "Toast",
			subLabel(value) {
				return value === "Default"
					? "Does not modify toasts"
					: "Makes toasts look like Material UI snackbars";
			},
			type: "choose",
			choices: ["Default", "M3"],
			default: "M3",
			icon: getAssetIDByName("TicketIcon"),
		},
		toast_position: {
			label: "Toast Position",
			subLabel(value) {
				return `Toasts will show up on the ${value.toLowerCase()}`;
			},
			type: "choose",
			choices: ["Top", "Bottom"],
			default: "Top",
			icon: getAssetIDByName("TicketIcon"),
			predicate() {
				return this.storage.options.toast === "M3";
			},
		},
		test_toast: {
			label: "Test Toast",
			type: "button",
			action() {
				const list = Object.values(assets.all);
				const item = list[Math.floor(Math.random() * list.length)];
				showToast(item.name, item.id);
			},
			icon: getAssetIDByName("BugIcon"),
		},
		alert: {
			label: "Alert",
			subLabel(value) {
				return value === "Default"
					? "Does not modify alerts"
					: "Makes alerts look like Material UI alerts";
			},
			type: "choose",
			choices: ["Default", "M3"],
			default: "M3",
			icon: getAssetIDByName("TicketIcon"),
		},
		test_alert: {
			label: "Test Alert",
			type: "button",
			action() {
				showConfirmationAlert({
					title: "Confirm",
					content: "The quick brown fox would like to jump over the lazy dog. Allow?",
					confirmText: "Allow",
					onConfirm: () =>
						new Promise(res => {
							setTimeout(res, 5000);
						}),
					cancelText: "Dismiss",
					secondaryConfirmText: "Tell off",
				});
			},
			icon: getAssetIDByName("BugIcon"),
		},
	},
	handlers: {
		onStart() {
			if (this.storage.options.switch !== "Default") {
				this.patches.add(
					instead("render", RN.Switch, ([props]) => {
						if (this.storage.options.switch === "M3") {
							return React.createElement(M3Switch, {
								...props,
								showIcons: this.storage.options.switch_xicon,
							});
						}
						return React.createElement(FormSwitch, props);
					}),
				);
			}

			if (this.storage.options.toast !== "Default") {
				this.patches.add(
					instead("default", Toast, ([props]) =>
						React.createElement(M3Snackbar, {
							...props,
							isOnBottom: this.storage.options.toast_position
								=== "Bottom",
						})),
				);
			}
			if (this.storage.options.alert !== "Default") {
				this.patches.add(
					after(
						"render",
						Alert.prototype,
						(_, ret) => React.createElement(M3Dialog, ret.props),
					),
				);
			}
		},
		onStop() {},
	},
});
