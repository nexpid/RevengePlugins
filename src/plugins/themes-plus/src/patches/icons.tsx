import { findByName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { before, instead } from "@vendetta/patcher";
import { getAssetByID, getAssetIDByName } from "@vendetta/ui/assets";

import type { PlusStructure } from "$/typings";

import { PatchType } from "..";
import { state } from "../stuff/active";
import { getIconOverlay, getIconTint } from "../stuff/iconOverlays";
import { patches } from "../stuff/loader";
import modIcons from "../stuff/modIcons";
import { fullIconsPath, isPackInstalled } from "../stuff/packInstaller";
import { fixPath, flattenFilePath } from "../stuff/util";
import type { BunnyAsset, IconpackConfig } from "../types";

const Status = findByName("Status", false);

export default function patchIcons(
	plus: PlusStructure,
	tree: string[],
	config: IconpackConfig,
) {
	const { iconpack } = state.iconpack;
	if (config.biggerStatus) {
		patches.push(
			before("default", Status, ([props], ...args) => [
				{
					...props,
					size: Math.floor(props.size * 1.5),
				},
				...args,
			]),
		);
	}

	let isInstalled = false;
	isPackInstalled(iconpack!).then(x => (isInstalled = x === true));

	if (plus.icons || plus.customOverlays || iconpack) {
		if (plus.icons) state.patches.push(PatchType.Icons);
		if (plus.customOverlays) {
			state.patches.push(PatchType.CustomIconOverlays);
		}
		if (iconpack) state.patches.push(PatchType.Iconpack);

		patches.push(
			instead("render", RN.Image, (_args, orig) => {
				const args = _args.slice();
				const [props] = args;

				if (props.ignore) return orig(...args);
				const { source } = props;

				let asset: BunnyAsset | null = null;

				// theme mod icons (bunny, revenge)
				const modIcon = Object.entries(modIcons).find(
					([_, { raw }]) => source?.uri === raw,
				);
				if (modIcon) {
					asset = {
						httpServerLocation: "//_",
						width: 64,
						height: 64,
						name: modIcon[0],
						type: "png",
					};
				} // custom themhed icons API
				else if (
					source
					&& typeof source.uri === "string"
					&& typeof source.width === "number"
					&& typeof source.height === "number"
					&& typeof source.file === "string"
					&& source.allowIconTheming
				) {
					const [file, ...parent] = source.file
						.split("/")
						.reverse() as string[];
					const [ext, ...base] = file.split(".").reverse();

					asset = {
						httpServerLocation: `//_/external${parent[0] ? "/" : ""}${
							parent.reverse().join("/")
						}`,
						width: source.width,
						height: source.height,
						name: base.reverse().join("."),
						type: ext,
					};
				} // any other asset
				else if (typeof source === "number") {
					asset = getAssetByID(source) as any;
				}

				if (!asset?.httpServerLocation) return orig(...args);

				const assetIconpackLocation = iconpack
					&& fixPath(
						[
							...asset.httpServerLocation.split("/").slice(2),
							`${asset.name}${iconpack.suffix}.${asset.type}`,
						].join("/"),
					);
				const useIconpack = assetIconpackLocation
					&& (tree.length ? tree.includes(assetIconpackLocation) : true);

				let overlay: any;
				if (
					plus.customOverlays
					&& !useIconpack
					&& typeof source === "number"
				) {
					overlay = getIconOverlay(plus, source, props.style);
					if (overlay) {
						if (overlay.replace) {
							props.source = getAssetIDByName(overlay.replace);
						}
						if (overlay.style) {
							props.style = [props.style, overlay.style];
						}
					}
				}

				if (plus.icons) {
					const tint = getIconTint(plus, source, asset.name);
					if (tint) {
						props.style = [
							props.style,
							{
								tintColor: tint,
							},
						];
					}
				}

				if (useIconpack) {
					props.source = {
						uri: isInstalled
							? `file://${fullIconsPath}${iconpack.id}/${
								flattenFilePath(assetIconpackLocation)
							}`
							: iconpack.load + assetIconpackLocation,
						headers: {
							"cache-contorl": "public, max-age=3600",
						},
						width: asset.width,
						height: asset.height,
						original: props.source,
					};
				}

				const ret = orig(...args);

				return overlay?.children
					? (
						<RN.View>
							{ret}
							{overlay.children}
						</RN.View>
					)
					: ret;
			}),
		);
	}
}
