import { watch } from "chokidar";
import Mime from "mime";
import { createReadStream, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import * as os from "node:os";
import { join } from "node:path";
import pc from "picocolors";
import { WebSocketServer } from "ws";
import { logDebug, logServer, logWss } from "../common/live/print.ts";
import { readFileString } from "../fs.ts";

const port = 8731;

async function exists(path: string) {
	return existsSync(path) && (await stat(path)).isFile();
}

const favicon = join("scripts/serve", "plink.ico");

const server = http.createServer();
server.on("request", async (req, res) => {
	const url = new URL(`http://localhost${req.url}`);

	if (url.pathname === "/favicon.ico") {
		const ico = await readFile(favicon);
		return res
			.writeHead(200, {
				"content-type": "image/x-icon",
				"content-length": ico.length,
			})
			.end(ico);
	}

	let path = join("dist", url.pathname);
	let file = (await exists(path)) && (await stat(path));

	if (
		(!file || !file.isFile())
		&& (await exists(join("dist", url.pathname, "index.html")))
	) {
		path = join("dist", url.pathname, "index.html");
		file = await stat(path);
	}

	if (file) {
		res.writeHead(
			200,
			JSON.stringify({
				"content-type": Mime.getType(path),
				"content-length": file.size,
			}),
		);

		const sr = createReadStream(path);
		sr.on("data", chunk => res.write(chunk));
		sr.on("close", () => res.end());
	} else {
		res.writeHead(404);
		res.end("Not Found");
	}

	const text = `${
		res.statusCode >= 400 && res.statusCode <= 599
			? `${res.statusCode} (${res.statusMessage}) "${req.method} ${url.pathname}"`
			: `${res.statusCode} "${req.method} ${url.pathname}"`
	}`;

	logServer(
		`${
			pc.bold(
				res.statusCode < 500
					? res.statusCode < 400
						? res.statusCode < 300
							? res.statusCode < 200
								// 1XX
								? pc.cyan(text)
								// 2XX
								: pc.green(text)
							// 3XX
							: pc.magenta(text)
						// 4XX
						: pc.yellow(text)
					// 5XX
					: pc.red(text),
			)
		}   ${pc.gray(req.headers["user-agent"]?.toString() ?? "-")}`,
	);
});

const wss = new WebSocketServer({
	server,
});

let nextMessage: any = {};
let nextMessageTimeout: any = 0;

const pluginHashes = new Map<string, string>();
let chokidarReady = false;
watch("dist", {
	ignoreInitial: false,
})
	.on("all", async (event, _path) => {
		if (!["add", "change"].includes(event) || !_path.endsWith("manifest.json")) return;
		const path = _path.replace(/\\/g, "/");

		const id = path.split("/")[1];
		let hash: string;

		try {
			pluginHashes.set(
				id,
				hash = JSON.parse(await readFileString(path)).hash,
			);
		} catch (_e) {
			return null;
		}

		if (!chokidarReady) return;

		nextMessage[id] = hash;

		clearTimeout(nextMessageTimeout);
		nextMessageTimeout = setTimeout(() => {
			const plugins = Object.keys(nextMessage).length;
			if (wss.clients.size > 0) {
				logWss(
					`Rejuvenating ${
						plugins === 1
							? pc.bold(id)
							: `${pc.bold(plugins)} plugin${plugins !== 1 ? "s" : ""}`
					} for ${pc.bold(wss.clients.size)} client${wss.clients.size !== 1 ? "s" : ""}`,
				);
			}

			for (const ws of wss.clients) {
				ws.send(JSON.stringify({ op: "update", updates: nextMessage }));
			}
			nextMessage = {};
		}, 500);
	})
	.on("ready", () => (chokidarReady = true));

wss.on("connection", ws => {
	let heartbeat: NodeJS.Timeout,
		ready = false;

	ws.addEventListener("message", event => {
		let data: import("./types").WSS.IncomingMessage;
		try {
			data = JSON.parse(event.data.toString());
		} catch {
			return;
		}

		if (data.op === "connect" && !ready) {
			ready = true;

			ws.send(
				JSON.stringify({
					op: "connect",
					map: Object.fromEntries(pluginHashes.entries()),
				}),
			);

			heartbeat = setInterval(
				() => ws.send(JSON.stringify({ op: "ping" })),
				20e3,
			);
		}
	});

	ws.addEventListener("close", () => clearInterval(heartbeat));
});

server.listen(port, async () => {
	const interfaces = Object.entries(os.networkInterfaces())
		.flatMap(([group, entries]) =>
			entries!.map(entry => ({
				...entry,
				group,
			}))
		)
		.filter(int => int.family === "IPv4")
		.sort((a, b) => a.group.localeCompare(b.group));
	const longestInterface = Math.max(
		...interfaces.map(int => int.address.length),
	);

	logDebug("Server and WSS started on:");
	for (const int of interfaces) {
		logDebug(
			`  - http://${int.address}${pc.white(`:${port}`)}${
				" ".repeat(longestInterface - int.address.length)
			}  ${pc.bold(int.group)}`,
		);
	}
});
