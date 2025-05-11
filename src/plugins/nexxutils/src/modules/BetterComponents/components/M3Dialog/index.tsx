import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";

import Text from "$/components/Text";

import TextButton from "./TextButton";
const Alerts = findByProps("openLazy", "close");

export default function({
	title,
	body,
	children,
	confirmColor,
	confirmText,
	onConfirm,
	isConfirmButtonDisabled,
	cancelText,
	onCancel,
	secondaryConfirmText,
	onConfirmSecondary,
}: Omit<ConfirmationAlertOptions, "content"> & {
	children?: ConfirmationAlertOptions["content"];
	body?: ConfirmationAlertOptions["content"];
	isConfirmButtonDisabled?: boolean;
}) {
	// TODO this is BAD, find a different way
	const isSpecial = isConfirmButtonDisabled !== undefined;

	const [loader, setLoader] = React.useState({
		confirm: false,
		cancel: false,
		secondaryConfirm: false,
	});
	const styles = stylesheet.createThemedStyleSheet({
		container: {
			backgroundColor: semanticColors.CARD_PRIMARY_BG,
			borderRadius: 28,
			flexDirection: "column",
			width: RN.Dimensions.get("window").width * 0.85,
		},
		textContent: {
			width: "100%",
			flexDirection: "column",
			gap: 16,
			paddingHorizontal: 24,
			paddingTop: 24,
		},
		actions: {
			width: "100%",
			flexDirection: "row-reverse",
			flexWrap: "wrap",
			gap: 8,
			paddingLeft: 8,
			marginRight: -24,
			paddingVertical: 24,
		},
	});

	const empty = Symbol("empty");
	const things = [
		{
			color: (confirmColor
				&& {
					brand: "BRAND",
					red: "DANGER",
					green: "POSITIVE",
					primary: "PRIMARY",
					transparent: "NORMAL",
					grey: "NORMAL",
					lightgrey: "NORMAL",
					white: "NORMAL",
					link: "NORMAL",
				}[confirmColor])
				?? "BRAND",
			text: confirmText ?? "Confirm",
			action: onConfirm,
			base: true,
			loading: "confirm",
		},
		cancelText
			? {
				color: "BRAND",
				text: cancelText,
				action: onCancel,
				base: false,
				loading: "cancel",
			}
			: empty,
		secondaryConfirmText
			? {
				color: "BRAND",
				text: secondaryConfirmText,
				action: onConfirmSecondary,
				base: false,
				loading: "secondaryConfirm",
			}
			: empty,
	].filter(x => x !== empty) as {
		color: string;
		text: string;
		action?: () => any;
		base: boolean;
		loading: keyof typeof loader;
	}[];

	return (
		<RN.View style={styles.container}>
			<RN.View style={styles.textContent}>
				<Text variant="text-lg/semibold" color="TEXT_NORMAL">
					{title}
				</Text>
				{children
					? <RN.View style={{ padding: 0 }}>{children}</RN.View>
					: (
						<Text variant="text-md/semibold" color="TEXT_NORMAL">
							{body}
						</Text>
					)}
			</RN.View>
			<RN.View style={styles.actions}>
				{things.map(x => (
					<TextButton
						color={x.color}
						label={x.text}
						disabled={x.base && isConfirmButtonDisabled}
						loading={loader[x.loading]}
						onPress={async () => {
							setLoader({
								...loader,
								[x.loading]: true,
							});
							if ("action" in x && isSpecial) {
								await x.action?.().catch(() => void 0);
								setLoader({
									...loader,
									[x.loading]: false,
								});
							} else {
								x.action?.();
								Alerts.close();
							}
						}}
					/>
				))}
			</RN.View>
		</RN.View>
	);
}
