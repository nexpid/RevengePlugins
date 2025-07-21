import { existsSync } from "node:fs";
import { mkdir, } from "node:fs/promises";
import { basename, join } from "node:path";
import { PassThrough } from "node:stream";
import { gunzipSync } from "node:zlib";
import { bundle } from "dts-bundle";
import picocolors from "picocolors";
import { extract } from "tar-fs";
import { readFileString } from "../../fs";

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
		stream.pipe(extractor as any).on("close", res).addListener("error", rej);
	}).then(() => join(path, "package"));
}

function findTypes(path: string, packageJson: any) {
	const types: string = packageJson.typings ?? packageJson.types ?? packageJson.main;
	const maps = [`${types}/index.d.ts`, `${types}.d.ts`, types];

	return maps.find(x => existsSync(join(path, x)));
}

export async function findRootTypes(path: string) {
	const packageJson = JSON.parse(
		await readFileString(join(path, "package.json")),
	) as any;
	const types = findTypes(path, packageJson);
	if (!types) {
		throw new Error(
			`Couldn't find types! ${
				[packageJson.typings, packageJson.types, packageJson.main].join(", ")
			}`,
		);
	}

	return types;
}

export async function rollupDts(path: string, pkg: string, out: string, types?: string) {
	if (!types) types = join(path, await findRootTypes(path));

	if (verbose) {
		console.log(
			picocolors.magenta(
				`rolling up!!!!\nSOURCE ${types}\nDESTINATION ${out}\nGLHF`,
			),
		);
	}

	bundle({
		name: pkg,
		main: types,
		out,
		verbose,
		indent: "\t",
	});
}
