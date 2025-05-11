import { ReactNative as RN } from "@vendetta/metro/common";

import { getSrc } from "../stuff/twemoji";

export default function({
	emoji,
	src = getSrc(emoji),
	size = 16,
}: {
	emoji: string;
	src?: string;
	size?: number;
}) {
	return (
		<RN.Image
			key={`emoji-${emoji}`}
			source={{
				uri: src,
			}}
			resizeMode="contain"
			fadeDuration={0}
			style={{
				height: size,
				width: size,
			}}
			// @ts-expect-error custom property
			vanilla={true}
		/>
	);
}
