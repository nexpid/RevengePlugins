import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const debugDprint = process.argv.includes("--debug-dprint");

function cleanOutput(txt: string) {
	return txt.replace(/^\n*/, "").replace(/\n*$/, "\n").replace(/\r/g, "");
}

// When dprint is installed
class DprintFormatter {
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
		const cwd = join(import.meta.dirname, "../../../");
		const maxStdinCharLength = stdin
			? stdin.split("\n").length.toString().length
			: 0;

		args.unshift("--config", "dprint.json");
		return new Promise((res, rej) => {
			const sub = execFile(
				"dprint",
				args,
				{
					cwd,
				},
				(error, stdout, stderr) => {
					const out = cleanOutput(stdout), err = cleanOutput(stderr);
					if (error) {
						const cleanError = !err ? String(error) : err;
						if (out && !debugDprint) {
							console.warn(
								`dprint raised an error, but stdout exists. pass the --debug-dprint flag to debug (exit code ${sub.exitCode}, pid ${sub.pid}, args ${
									JSON.stringify(args.join(" "))
								}, stdin ${stdin ? "yes" : "no"})\n${err}`,
							);
							return res(out);
						}

						rej(
							`${out}\n${cleanError}\nDebug dprint: ${
								debugDprint ? "YES" : "NO"
							}\nExit code: ${sub.exitCode}\nTrace: [${sub.pid}] dprint ${
								args.join(" ")
							}\nStdin:\n${
								stdin
									? stdin.split("\n").map((x, i) =>
										` ${i.toString().padStart(maxStdinCharLength, " ")}  ${x}`
									).join(
										"\n",
									)
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
				return { output, isError: true };
			});
	}

	async init() {
		const check = await execFileAsync("dprint", ["--version"]).then((res) => !res.stderr)
			.catch(
				() => false,
			);

		if (!check) return new DprintFormatterFallback();
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

// When dprint isn't installed
class DprintFormatterFallback {
	async debugVersion() {
		return "dprint is not installed";
	}
	async debugFilePaths() {
		return [] as string[];
	}
	async debugResolvedConfig() {
		return {} as object;
	}
	async formatText(content: string, _path: string) {
		return content;
	}
	async saveAndFormat(path: string, content: string) {
		await writeFile(
			path,
			await this.formatText(content, path),
		);
	}
}

export const dprint = await new DprintFormatter().init();
