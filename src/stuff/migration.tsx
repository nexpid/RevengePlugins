import { React, ReactNative } from "@vendetta/metro/common";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { createMMKVBackend } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { RichText } from "./components/RichText";
import Text from "./components/Text";
import { Reanimated, RNFileModule } from "./deps";
import { Stack } from "./lib/redesign";

const { Pressable } = ReactNative;

interface InvalidDomain {
	match: RegExp;
	label: string;
}

const specialIDs = {
	usrpfp: "userpfp",
} as Record<string, string>;
const allowedPluginIDs = [
	PLUGINS_LIST,
	Object.keys(specialIDs),
].flat();

const invalidDomains: InvalidDomain[] = [{
	match: /vendetta\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "vendetta.nexpid.xyz",
}, {
	match: /dev\.bunny\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "dev.bunny.nexpid.xyz",
}, {
	match: /bunny\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "bunny.nexpid.xyz",
}];

const migrationLockFilePath = "nexpid/revengemigration.txt";

function MigrationModal(
	{ affectedPlugin, domains }: {
		affectedPlugin?: string;
		domains: string[];
	},
) {
	const jumper = Reanimated.useSharedValue(0);
	const spinner = Reanimated.useSharedValue("0deg");
	const squisherX = Reanimated.useSharedValue(1);
	const squisherY = Reanimated.useSharedValue(1);
	const [toggle, setToggle] = React.useState(true);

	const duration = 300;
	const fromY = -10;
	const toY = 30;
	const spinBetween = 11;

	const squishConfig = { duration: 0 };
	const squishVal = 1.25;
	const releaseConfig = {
		duration: duration * 2,
		easing: Reanimated.Easing.out(Reanimated.Easing.quad),
	};
	const releaseVal = 0.9;

	React.useEffect(() => {
		if (!toggle) {
			jumper.value = 0;
			spinner.value = "0deg";
			squisherX.value = 1;
			squisherY.value = 1;
			return;
		}

		jumper.value = Reanimated.withRepeat(
			Reanimated.withSequence(
				Reanimated.withTiming(toY, {
					easing: Reanimated.Easing.out(Reanimated.Easing.quad),
					duration,
				}),
				Reanimated.withTiming(fromY, {
					easing: Reanimated.Easing.quad,
					duration,
				}),
			),
			-1,
		);
		spinner.value = Reanimated.withRepeat(
			Reanimated.withSequence(
				Reanimated.withTiming("0deg", { duration: (duration * 2) * spinBetween }),
				Reanimated.withTiming("-360deg", {
					duration: duration * 2,
					easing: Reanimated.Easing.out(Reanimated.Easing.exp),
				}),
			),
			-1,
		);

		squisherX.value = Reanimated.withRepeat(
			Reanimated.withSequence(
				Reanimated.withTiming(squishVal, squishConfig),
				Reanimated.withTiming(releaseVal, releaseConfig),
			),
			-1,
		);
		squisherY.value = Reanimated.withRepeat(
			Reanimated.withSequence(
				Reanimated.withTiming(1 / squishVal, squishConfig),
				Reanimated.withTiming(1 / releaseVal, releaseConfig),
			),
			-1,
		);
	}, [toggle]);

	return (
		<Stack direction="vertical" spacing={8}>
			<Stack
				direction="horizontal"
				spacing={14}
				style={{
					justifyContent: "center",
					alignItems: "center",
					marginBottom: 18,
					marginHorizontal: 8,
				}}
			>
				<Pressable
					style={{ width: 80, height: 80 }}
					pointerEvents="box-only"
					onPress={() => setToggle(!toggle)}
					accessibilityRole="togglebutton"
					accessibilityLabel="toggle jumping animation"
				>
					<Reanimated.default.Image
						source={{
							uri: "https://api.lanyard.rest/853550207039832084.webp?size=128",
							width: 128,
							height: 128,
						}}
						style={[{
							borderRadius: 40,
							width: 80,
							height: 80,
							position: "absolute",
							bottom: 0,
						}, {
							bottom: jumper,
							transform: [{ scaleX: squisherX }, { scaleY: squisherY }, {
								rotate: spinner,
							}],
						}]}
					/>
				</Pressable>
				<Stack direction="vertical" style={{ flex: 1 }}>
					<Text
						variant="heading-xl/extrabold"
						color="TEXT_NORMAL"
						style={{ flex: 0 }}
					>
						Hey, it's me, nexpid!
					</Text>
					<Text
						variant="heading-md/medium"
						color="TEXT_NORMAL"
						style={{ flex: 0 }}
					>
						You might know me. I made {affectedPlugin
							? (
								<>
									a plugin you use, <RichText.Bold>{affectedPlugin}</RichText.Bold>
								</>
							)
							: "some of the plugins you use"}!
					</Text>
				</Stack>
			</Stack>
			<Text
				variant="text-md/medium"
				color="TEXT_NORMAL"
			>
				{affectedPlugin
					? "The plugin you use has"
					: "Some of my plugins you use have"} one of these domains:
			</Text>
			<Text
				variant="text-md/bold"
				color="TEXT_NORMAL"
				style={{ marginHorizontal: 10 }}
			>
				{domains.map(label => `• ${label}`).join("\n")}
			</Text>
			<Text
				variant="text-md/medium"
				color="TEXT_NORMAL"
			>
				These domains are being deprecated and plugins on them won't receive any new updates. Please
				use the new domain instead:
			</Text>
			<Text
				variant="text-lg/bold"
				color="TEXT_NORMAL"
				style={{ textDecorationLine: "underline" }}
				align="center"
			>
				revenge.nexpid.xyz
			</Text>
		</Stack>
	);
}

// thanks to the shim, this only gets run once even if multiple plugins are installed
export async function runMigration() {
	if (
		await RNFileModule.fileExists(
			`${RNFileModule.DocumentsDirPath}/${migrationLockFilePath}`,
		)
	) return;

	const affected: {
		id: string;
		link: string;
		name: string;
	}[] = [];
	const isOutdated = new Set<string>();
	for (const plugin of Object.keys(plugins)) {
		const parser = invalidDomains.find(x => x.match.test(plugin));
		const id = parser && plugin.match(parser.match)?.groups?.plugin;

		console.log(allowedPluginIDs, id);
		if (id && allowedPluginIDs.includes(id)) {
			affected.push({
				id,
				link: plugin,
				name: plugins[plugin].manifest.name,
			});
			isOutdated.add(parser.label);

			if (plugin.includes("bn-plugins.github.io/vd-proxy")) {
				isOutdated.add("proxied plugin links");
			}
		}
	}

	if (isOutdated.size) {
		showConfirmationAlert({
			// @ts-expect-error Missing from typings
			children: (
				<MigrationModal
					affectedPlugin={affected.length === 1 ? affected[0].name : undefined}
					domains={[...isOutdated.values()]}
				/>
			),
			confirmText: "Migrate now",
			async onConfirm() {
				showToast("Starting migration");

				console.log("MIGRATION STARTS HERE, AFFECTED", affected);
				try {
					// take all plugins that are bad & make good :blush:
					for (const { id, link, name } of affected) {
						const newPlugin = `https://revenge.nexpid.xyz/${specialIDs[id] ?? id}/`;
						console.log(
							"FROM",
							link,
							"TO",
							newPlugin,
						);

						await createMMKVBackend(newPlugin).set(await createMMKVBackend(link).get());
						if (!plugins[newPlugin]) await installPlugin(newPlugin);
						// returns a promise (bug in types)
						await removePlugin(link);
						showToast(`Migrated ${name}`);
					}
					console.log("MIGRATION ENDS HERE");
				} catch (e) {
					console.error("Migration error", e);
					return showToast(
						`Got an error! ${e} (ping nexpid about this!!!)`,
						getAssetIDByName("CircleXIcon-primary"),
					);
				}

				showToast(
					"Migrated successfully! Please reload your client to apply changes",
					getAssetIDByName("CircleCheckIcon-primary"),
				);
			},
			cancelText: "Remind me later",
			secondaryConfirmText: "I understand (don't show again)",
			onConfirmSecondary() {
				RNFileModule.writeFile("documents", migrationLockFilePath, "revenged", "utf8");
			},
		});
	}
}
