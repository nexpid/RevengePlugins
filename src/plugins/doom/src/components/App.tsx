import { findByProps } from "@vendetta/metro";
import {
	NavigationNative,
	React,
	ReactNative as RN,
	stylesheet,
} from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { ActionSheet } from "$/components/ActionSheet";
import SuperAwesomeIcon from "$/components/SuperAwesomeIcon";
import Text from "$/components/Text";
import { WebView } from "$/deps";
import usePromise from "$/hooks/usePromise";
import { managePage } from "$/lib/ui";

import webviewCss from "../../assets/webview.css";
import webviewHtml from "../../assets/webview.html";
import { vstorage } from "..";
import { getFiles } from "../stuff/store";
import SettingsActionSheet from "./sheets/SettingsActionSheet";

const Orientation = findByProps("OrientationType", "useOrientation");

export default function App() {
	useProxy(vstorage);
	const { width: _width, height: _height } = RN.Dimensions.get("window");

	const navigation = NavigationNative.useNavigation();

	const isLandscape = Orientation.useOrientation() === 1;
	const { width } = React.useRef({
		width: isLandscape ? _height : _width,
		height: isLandscape ? _width : _height,
	}).current;

	managePage({
		headerRight: () => (
			<SuperAwesomeIcon
				onPress={() => {
					ActionSheet.open(SettingsActionSheet, {
						kaboom: () => navigation.goBack(),
					});
				}}
				icon={getAssetIDByName("SettingsIcon")}
				style="header"
			/>
		),
	});

	const styles = stylesheet.createThemedStyleSheet({
		container: {
			backgroundColor: "#000",
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		webview: {
			backgroundColor: semanticColors.BG_MOD_SUBTLE,
			overflow: "hidden",
			borderRadius: 2,
			aspectRatio: 1442.8 / 901.75,
		},
		webviewPortrait: {
			height: width,
			transform: [
				{
					rotate: "90deg",
				},
			],
		},
		webviewLandscape: {
			height: "100%",
		},

		webviewUnder: {
			position: "absolute",
			left: 0,
			top: 0,
			width: "100%",
			height: "100%",
			justifyContent: "center",
			alignItems: "center",
			flexDirection: "column",
			gap: 4,
			flex: 1,
		},

		androidRipple: {
			color: semanticColors.ANDROID_RIPPLE,
			cornerRadius: 2147483647,
		} as any,
	});

	const [text, setText] = React.useState("Updating...");
	const filePromise = usePromise(
		signal => getFiles(setText, signal),
		[vstorage.settings.game],
	);
	const files = filePromise.fulfilled && filePromise.success && filePromise.response;

	const done = files && typeof files !== "string";

	const html = React.useMemo(() => {
		if (!done) return;

		let txt = webviewHtml.replace(
			/REP_WEBVIEW_CSS/g,
			JSON.stringify(webviewCss),
		);
		for (const [a, b] of Object.entries(files)) {
			txt = txt.replace(new RegExp(a, "g"), b);
		}

		return txt;
	}, [files]);

	return (
		<RN.View style={styles.container}>
			<RN.View
				style={[
					styles.webview,
					isLandscape
						? styles.webviewLandscape
						: styles.webviewPortrait,
				]}
			>
				{done && html
					? (
						<WebView
							source={{
								html,
								baseUrl: "https://localhost",
							}}
							style={{
								width: "100%",
								height: "100%",
								backgroundColor: "#0000",
							}}
						/>
					)
					: (
						<RN.View style={styles.webviewUnder}>
							<Text
								variant="text-lg/semibold"
								color="WHITE"
								align="center"
							>
								{typeof files === "string" ? files : text}
							</Text>
						</RN.View>
					)}
			</RN.View>
		</RN.View>
	);
}
