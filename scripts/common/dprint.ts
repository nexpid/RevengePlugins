import { familySync } from "detect-libc";
import { unzipSync } from "fflate";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";

function cleanOutput(txt: string) {
	return txt.replace(/^\n*/, "").replace(/\n*$/, "").replace(/\r/g, "");
}

export class DprintFormatter {
	public inited: any = null;
	constructor(public version = "0.49.1") {}

	getCliPath() {
		return process.env.DPRINT_PATH
			?? join(import.meta.dirname, "../../", "node_modules", ".dprint-cli");
	}

	getStaticBinary() {
		const chunks = ["dprint"];
		chunks.push(this.version);
		if (os.platform() === "win32") chunks.push("exe");
		return chunks.join(".");
	}

	getDownloadBinary() {
		const chunks = ["dprint"];

		switch (os.arch()) {
			case "riscv64":
				chunks.push("riscv64gc");
				break;
			case "arm":
			case "arm64":
				chunks.push("aarch64");
				break;
			default:
				chunks.push("x86_64");
				break;
		}

		switch (os.platform()) {
			case "win32":
				chunks.push("pc-windows-msvc");
				break;
			case "darwin":
				chunks.push("apple-darwin");
				break;
			default:
				const family = familySync();
				chunks.push("unknown-linux");
				chunks.push(family === "musl" ? "musl" : "gnu");
				break;
		}

		return chunks.join("-") + ".zip";
	}

	getDownloadUrl() {
		return `https://github.com/dprint/dprint/releases/download/${this.version}/${this.getDownloadBinary()}`;
	}

	private async initBinary() {
		await mkdir(this.getCliPath(), { recursive: true });

		const url = this.getDownloadUrl();
		const binaryName = this.getStaticBinary();
		const staticPath = join(this.getCliPath(), binaryName);
		if (existsSync(staticPath)) return staticPath;

		try {
			const zipped = await fetch(url).then(x => x.arrayBuffer()).then(x =>
				new Uint8Array(x)
			);
			const [dprintFile] = Object.values(unzipSync(zipped));

			await writeFile(staticPath, dprintFile);
			return staticPath;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private async run(
		args: string[],
		throwOnError: true,
		stdin?: string,
	): Promise<string>;
	private async run(
		args: string[],
		throwOnError: false,
		stdin?: string,
	): Promise<{ output: string; isError: boolean }>;
	private async run(args: string[], throwOnError = false, stdin?: string) {
		const cwd = join(import.meta.dirname, "../../");
		const binary = this.getStaticBinary();
		const maxStdinCharLength = stdin
			? stdin.split("\n").length.toString().length
			: 0;

		return new Promise((res, rej) => {
			const sub = execFile(
				join(this.getCliPath(), binary),
				args,
				{
					cwd,
				},
				(error, stdout, stderr) => {
					if (error || stderr) {
						rej(
							`${
								!stderr ? String(error) : cleanOutput(stderr)
							}\n\nTrace: [${sub.pid}] ${binary} ${args.join(" ")}\nStdin:\n${
								stdin
									? stdin.split("\n").map((x, i) =>
										` ${i.toString().padStart(maxStdinCharLength, " ")}  ${x}`
									).join("\n")
									: "  <none>"
							}`,
						);
					} else res(cleanOutput(stdout));
				},
			);
			if (stdin) sub.stdin?.write(stdin);
			sub.stdin?.end();
		})
			.then(output => throwOnError ? output : { output, isError: false })
			.catch(output => {
				if (throwOnError) throw output;
				else return { output, isError: true };
			});
	}

	async init() {
		this.inited = await this.initBinary();
		return this;
	}

	async debugVersion() {
		return await this.run(["--version"], true);
	}
	async debugFilePaths() {
		return await this.run(["output-file-paths"], true).then(x => x.split("\n"));
	}
	async debugResolvedConfig() {
		return await this.run(["output-resolved-config"], true).then(x => JSON.parse(x));
	}

	async formatText(content: string, extension: string) {
		return await this.run(["fmt", "--stdin", extension], true, content);
	}
	async saveAndFormat(path: string, content: string) {
		await writeFile(
			path,
			await this.formatText(content, path),
		);
	}
}

export const dprint = await new DprintFormatter().init();
