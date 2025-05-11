import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import InlineCheckbox from "$/components/InlineCheckbox";
import Text from "$/components/Text";
import { Lang } from "$/lang";
import { IconButton } from "$/lib/redesign";
import { formatBytes } from "$/types";

import { lang, vstorage } from "..";
import { state, useState } from "../stuff/active";
import {
	installIconpack,
	isPackInstalled,
	uninstallIconpack,
} from "../stuff/packInstaller";
import type { Iconpack } from "../types";
import ProgressCircle from "./ProgressCircle";

const { FormRow } = Forms;

export default function IconpackRow({
	pack,
	onPress,
}: {
	pack: Iconpack;
	onPress: () => void;
}) {
	const styles = stylesheet.createThemedStyleSheet({
		headerTrailing: {
			flexDirection: "row",
			gap: 15,
			alignItems: "center",
		},
		actions: {
			flexDirection: "row-reverse",
			alignItems: "center",
			gap: 5,
		},
	});

	const [packStatus, setPackStatus] = React.useState<{
		installed: boolean;
		outdated: boolean;
		loading: boolean;
	}>({
		installed: false,
		outdated: false,
		loading: true,
	});
	const [progressCnt, setProgressCnt] = React.useState<number | null>(0);

	React.useEffect(
		() =>
			void isPackInstalled(pack).then(x =>
				setPackStatus({
					installed: !!x,
					outdated: x === "outdated",
					loading: false,
				})
			),
		[],
	);

	const size = state.iconpack.hashes[pack.id]?.size;
	useState();

	const doInstall = () => {
		if (cancelRef.current) {
			cancelRef.current();
			setPackStatus({
				installed: packStatus.installed,
				outdated: packStatus.outdated,
				loading: false,
			});
			return;
		}
		if (!size || packStatus.loading) return;

		const willUninstall = packStatus.outdated ? false : packStatus.installed;
		const cont = async () => {
			setPackStatus({
				installed: willUninstall,
				outdated: packStatus.outdated,
				loading: true,
			});

			const controller = new AbortController();
			if (!willUninstall) {
				cancelRef.current = async () => {
					controller.abort();
					if (!packStatus.outdated) await uninstallIconpack(pack);
				};
			}

			try {
				if (willUninstall) await uninstallIconpack(pack);
				else {
					await installIconpack(
						pack,
						controller.signal,
						setProgressCnt,
					);
				}
			} catch (e) {
				cancelRef.current = null;
				setProgressCnt(0);

				if (!controller.signal.aborted) {
					showToast(
						String(e),
						getAssetIDByName("CircleXIcon-primary"),
					);
				}
				setPackStatus({
					installed: willUninstall,
					outdated: packStatus.outdated,
					loading: false,
				});
				return;
			}

			cancelRef.current = null;
			setProgressCnt(0);

			setPackStatus({
				installed: !willUninstall,
				outdated: false,
				loading: false,
			});
		};

		let balls = vstorage.downloadIconpackModalDismissed;
		if (!balls && !willUninstall) {
			showConfirmationAlert({
				title: lang.format("alert.downloadpack.title", {}),
				// @ts-expect-error children is missing from type
				children: (
					<>
						<Text
							variant="text-md/normal"
							color="TEXT_NORMAL"
							style={{ marginTop: 8 }}
						>
							{Lang.basicFormat(
								lang.format("alert.downloadpack.body", {
									iconpack: pack.name,
									space: formatBytes(size),
								}),
							)}
						</Text>
						<InlineCheckbox
							initialValue={!!vstorage.downloadIconpackModalDismissed}
							update={v => (balls = v)}
							label={lang.format(
								"alert.downloadpack.dontshowagain_toggle",
								{},
							)}
						/>
					</>
				),
				confirmText: lang.format("alert.downloadpack.confirm", {}),
				cancelText: lang.format("alert.downloadpack.cancel", {}),
				onConfirm: () => {
					vstorage.downloadIconpackModalDismissed = balls;
					cont();
				},
			});
		} else cont();
	};

	const cancelRef = React.useRef<(() => void) | null>(null);
	React.useEffect(() => {
		return () => cancelRef.current?.();
	}, []);

	return (
		<FormRow
			label={pack.name}
			subLabel={pack.description}
			onPress={onPress}
			leading={
				<FormRow.Icon
					source={{
						uri: `${pack.load}images/native/main_tabs/Messages${pack.suffix}.png`,
					}}
				/>
			}
			trailing={
				<RN.View style={styles.headerTrailing}>
					{/* TODO finally finish this */}
					{(IS_DEV || vstorage.iconpackDownloading) && (
						<RN.View style={styles.actions}>
							{progressCnt !== null && (
								<ProgressCircle
									radius={16}
									stroke={3}
									color="#fff"
									progress={progressCnt ?? null}
								/>
							)}
							<IconButton
								onPress={doInstall}
								loading={!packStatus || packStatus.loading}
								size="sm"
								variant={packStatus?.installed
									? packStatus.outdated
										? "primary"
										: "destructive"
									: "secondary"}
								disabled={!packStatus
									|| !size
									|| (packStatus.loading && !cancelRef.current)}
								icon={packStatus
									&& getAssetIDByName(
										packStatus.installed
											? packStatus.outdated
												? "GlobeEarthIcon"
												: "TrashIcon"
											: "DownloadIcon",
									)}
							/>
						</RN.View>
					)}
					<FormRow.Radio
						selected={vstorage.iconpack.pack === pack.id}
					/>
				</RN.View>
			}
		/>
	);
}
