import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

const MessageMarkupRendererGuhh = findByProps("renderMessageMarkupToAST");

export default () => {
	const unpatch = after(
		"renderMessageMarkupToAST",
		MessageMarkupRendererGuhh,
		(_, ret) => {
			const branch = (x: { content: any[] }, isHeading: boolean) => {
				const jumboableChain = new Array<any>();
				const content = new Array<any>();

				for (const y of x.content) {
					const guh = y.type === "emoji"
						? {
							type: "text",
							content: y.surrogate,
						}
						: y;

					if (Array.isArray(y.content)) guh.content = branch(y, true);

					if (
						(y.type === "emoji"
							|| y.type === "customEmoji"
							|| (y.type === "text" && y.content?.match(/^\s*$/)))
						&& y.jumboable
						&& !isHeading
					) {
						if (y.type !== "text") {
							guh.jumboable = undefined;
							jumboableChain.push(guh);
						}
					} else {
						if (jumboableChain.length > 0) {
							content.push({
								type: "heading",
								level: 1,
								content: jumboableChain,
							});
						}
						jumboableChain.length = 0;
						content.push(guh);
					}
				}

				if (jumboableChain.length > 0) {
					content.push({
						type: "heading",
						level: 1,
						content: jumboableChain,
					});
				}
				return content;
			};

			ret.content = branch(ret, false);
		},
	);

	return () => unpatch();
};
