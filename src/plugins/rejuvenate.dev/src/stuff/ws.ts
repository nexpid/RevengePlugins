import { logger, settings } from "@vendetta";
import { fetchPlugin, plugins, startPlugin, stopPlugin } from "@vendetta/plugins";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { getPluginUrl } from "./constants";

export const wsSymbol = Symbol.for("rejuvenate.ws");

export let timeout: any, ws: WebSocket;
let since = Date.now();

async function refetchPlugins(pluh: Record<string, string>, catchup?: boolean) {
	const refetching = Object.entries(pluh)
		.map(
			([id, hash]) =>
				[plugins[`http://${getPluginUrl()}/${id}/`], hash] as [
					Plugin,
					string,
				],
		)
		.filter(([plugin, hash]) => plugin && plugin?.manifest?.hash !== hash);

	await Promise.all(
		refetching.map(([plugin]) =>
			(async () => {
				if (plugin.enabled) stopPlugin(plugin.id, false);
				await fetchPlugin(plugin.id);
				if (plugin.enabled) await startPlugin(plugin.id);
			})()
		),
	);

	if (refetching[0]) {
		showToast(
			`Rejuvenated ${refetching.length} plugin${refetching.length !== 1 ? "s" : ""}${
				catchup ? " (catchup)" : ""
			}`,
			getAssetIDByName("AppsIcon"),
		);
	}
}

function connectToWs() {
	ws = new WebSocket(`ws://${getPluginUrl()}`);
	window[wsSymbol] = ws;

	logger.log("Connected to WS!");

	ws.addEventListener("open", () => ws.send(JSON.stringify({ op: "connect", since })));
	ws.addEventListener("message", event => {
		let data: import("$/../../scripts/serve/types").WSS.OutgoingMessage;
		try {
			data = JSON.parse(event.data.toString());
		} catch {
			return;
		}

		if (data.op === "ping") ws.send(JSON.stringify({ op: "ping" }));
		else if (data.op === "connect") refetchPlugins(data.map, true);
		else if (data.op === "update") refetchPlugins(data.updates);
	});
	ws.addEventListener(
		"close",
		ev =>
			ev?.reason !== "plugin stopped"
			&& ((since = Date.now()), tryToConnect()),
	);
}

export async function tryToConnect(tries = 1) {
	if (tries > 5) return;

	// fetch() just hangs forever without this
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 20_000);

	const { status } = await fetch(
		`http://${settings.debuggerUrl.slice(0, -4)}8731`,
		{
			headers: {
				upgrade: "websocket",
				connection: "Upgrade",
			},
			signal: controller.signal,
		},
	).catch(() => ({ status: 0 }));

	if (status === 400) return connectToWs();
	timeout = setTimeout(() => tryToConnect(tries + 1), 15_000);
}
