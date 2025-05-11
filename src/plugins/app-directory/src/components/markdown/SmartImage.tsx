import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

export default function({ url }: { alt?: string; url: string }) {
	const win = RN.Dimensions.get("screen");
	const [dims, setDims] = React.useState<[number, number]>();

	React.useEffect(
		() =>
			RN.Image.getSize(
				url,
				(width, height) => {
					setDims([width, height]);
				},
				err => {
					showToast(`${err}`, getAssetIDByName("CircleXIcon-primary"));
					console.log(err);
				},
			),
		[],
	);

	const width = win.width - 64;

	const styles = stylesheet.createThemedStyleSheet({
		main: {
			backgroundColor: "#faaa",
			borderRadius: 8,
			width: width,
			height: dims ? (dims[1] / dims[0]) * width : 0,
		},
	});

	return (
		<RN.Image
			style={styles.main}
			source={{ uri: url }}
			resizeMode="contain"
		/>
	);
}
