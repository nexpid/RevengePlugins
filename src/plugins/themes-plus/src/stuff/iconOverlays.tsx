import { ReactNative as RN } from "@vendetta/metro/common";
import { getAssetByID } from "@vendetta/ui/assets";

import type { PlusStructure } from "$/typings";

import check from "../../assets/check.png";
import resolveColor from "./resolveColor";

export function getIconTint(
	plus: PlusStructure,
	icon: number,
	customName?: string,
): string | undefined {
	const name = customName ?? getAssetByID(icon)?.name;
	if (!name) return;
	if (!plus.icons?.[name]) return;

	return resolveColor(plus.icons[name]);
}

export function asIcon<T extends JSX.Element>(
	plus: PlusStructure,
	customName: string,
	img: T,
): T {
	if (typeof img.props.source === "number") {
		const clr = getIconTint(plus, img.props.source, customName);
		if (clr) {
			img.props.style = [
				img.props.style,
				{
					tintColor: clr,
				},
			];
		}
	}
	img.props.ignore = true;
	return img;
}

export function getIconOverlay(
	plus: PlusStructure,
	icon: number,
	style?: any,
):
	| React.PropsWithChildren<{ style?: Record<string, any>; replace?: string }>
	| undefined
{
	const ic = getAssetByID(icon)?.name;
	if (!ic) return;

	if (
		[
			"ic_radio_circle_checked",
			"ic_radio_square_checked_24px",
			"ic_selection_checked_24px",
		].includes(ic)
	) {
		return {
			style: {
				tintColor: "#5865F2",
			},
			children: (
				<RN.View style={{ position: "absolute", left: 0, top: 0 }}>
					{asIcon(
						plus,
						`${ic}__overlay`,
						<RN.Image
							source={check}
							style={[
								style,
								{
									tintColor: "#FFF",
								},
							]}
						/>,
					)}
				</RN.View>
			),
		};
	}
	if (["app_installed_check", "ic_radio_circle_checked_green"].includes(ic)) {
		return {
			style: {
				tintColor: "#3BA55C",
			},
			children: (
				<RN.View style={{ position: "absolute", left: 0, top: 0 }}>
					{asIcon(
						plus,
						`${ic}__overlay`,
						<RN.Image
							source={check}
							style={[
								style,
								{
									tintColor: "#FFF",
								},
							]}
						/>,
					)}
				</RN.View>
			),
		};
	}
}
