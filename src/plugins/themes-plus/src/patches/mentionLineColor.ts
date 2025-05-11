import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

import { androidifyColor } from "$/types";
import type { PlusStructure } from "$/typings";

import { PatchType } from "..";
import { state } from "../stuff/active";
import { patches } from "../stuff/loader";
import resolveColor from "../stuff/resolveColor";

const RowGeneratorUtils = findByProps("createBackgroundHighlight");

export default function patchMentionLineColors(plus: PlusStructure) {
	if (plus.mentionLineColor) {
		// ty to cynthia
		state.patches.push(PatchType.MentionLineColor);

		patches.push(
			after(
				"createBackgroundHighlight",
				RowGeneratorUtils,
				([x], ret) => {
					const clr = resolveColor(plus.mentionLineColor!);
					if (x?.message?.mentioned && clr) {
						ret.gutterColor = androidifyColor(clr, 200);
					}
				},
			),
		);
	}
}
