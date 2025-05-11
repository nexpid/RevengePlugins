import { basename, join } from "node:path";
import { PassThrough } from "node:stream";
import { gunzipSync } from "node:zlib";

import { bundle } from "dts-bundle";
import { existsSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import picocolors from "picocolors";
import { extract } from "tar-fs";

const verbose = process.argv.includes("-v") || process.argv.includes("--verbose");

export function cleanPath(path: string) {
	return path.replaceAll("/", "+");
}

export async function getTarball(pkg: string, version: string): Promise<Buffer> {
	const orgLessPackage = pkg.split("/").slice(-1)[0];
	return gunzipSync(
		await fetch(
			`https://registry.npmjs.com/${pkg}/-/${orgLessPackage}-${version}.tgz`,
		).then(tgz => tgz.arrayBuffer()),
	);
}

export async function unzipTarball(path: string, tarball: Buffer) {
	await mkdir(path, { recursive: true });
	const extractor = extract(path, {
		ignore(name: string) {
			const base = basename(name);
			return (
				base !== "package.json"
				&& !base.endsWith(".d.ts")
			);
		},
	});

	return new Promise((res, rej) => {
		const stream = new PassThrough();
		stream.end(new Uint8Array(tarball));
		stream.pipe(extractor).on("close", res).addListener("error", rej);
	}).then(() => join(path, "package"));
}

function findTypes(path: string, packageJson: any) {
	const types: string = packageJson.typings ?? packageJson.types ?? packageJson.main;
	const maps = [`${types}/index.d.ts`, `${types}.d.ts`, types];

	return maps.find(x => existsSync(join(path, x)));
}

export async function rollupDts(path: string, pkg: string, out: string) {
	const packageJson = JSON.parse(
		await readFile(join(path, "package.json"), "utf8"),
	) as any;
	const types = findTypes(path, packageJson);
	if (!types) {
		throw new Error(
			`Couldn't find types! ${
				[packageJson.typings, packageJson.types, packageJson.main].join(", ")
			}`,
		);
	}

	if (verbose) {
		console.log(
			picocolors.magenta(
				`rolling up!!!!\nSOURCE ${join(path, types)}\nDESTINATION ${out}\nGLHF`,
			),
		);
	}

	bundle({
		name: pkg,
		main: join(path, types),
		out,
		verbose,
		indent: "\t",
	});
}
