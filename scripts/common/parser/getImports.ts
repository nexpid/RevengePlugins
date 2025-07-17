import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { readFileString } from "../../fs";
import { logDebug } from "../statistics/print";

export function slashResolve(path: string) {
	return resolve(path).replace(/\\/g, "/");
}
export function slashJoin(...paths: string[]) {
	return join(...paths).replace(/\\/g, "/");
}

const baseExtensions = [".ts", ".js", ".mjs", ".cjs", ".d.ts"];
const jsxExtensions = [
	...baseExtensions,
	...baseExtensions.map(ext => `${ext}x`),
];
export const allExtensions = [
	...jsxExtensions,
	...jsxExtensions.map(ext => `/index${ext}`),
	"",
];

const foundFiles: Map<string, string | undefined> = new Map();

function findFile(path: string) {
	if (foundFiles.has(path)) return foundFiles.get(path);

	const res = allExtensions
		.map(ext => (existsSync(path + ext) ? path + ext : false))
		.find(x => typeof x === "string");
	foundFiles.set(path, res);

	return res;
}

const stuffDir = slashResolve("src/stuff");

const hashedImports = new Map<string, Set<string>>();
export const hashMap = new Map<string, string>();

export async function listImports(
	path: string,
	supportStuffDir?: boolean,
): Promise<Set<string>> {
	if (!allExtensions.includes(extname(path))) return new Set();
	const dir = dirname(path);

	const content = await readFileString(path);
	const hash = createHash("sha256").update(content).digest("hex");

	if (hashedImports.has(path + hash)) return hashedImports.get(path + hash)!;

	const matches = content.matchAll(
		/(?:\/\/ )?(?:import|export) .+?(?: as .+?)? from (?:"|')(.+?)(?:"|')/gs,
	);
	const imports = new Set<string>();

	for (const [line, module] of matches) {
		if (line.startsWith("//")) continue;

		let dep: string | undefined;
		let willWarn = true;

		if (module.match(/^\.\.?\/?/)) dep = findFile(slashJoin(dir, module));
		else if (supportStuffDir && module.startsWith("$/")) {
			dep = findFile(slashJoin(stuffDir, module.slice(2)));
		} else willWarn = false;

		if (dep) imports.add(dep);
		else if (willWarn) {
			logDebug(
				`Couldn't find dep "${module}" from ${JSON.stringify(path)}`,
			);
		}
	}

	hashedImports.set(path + hash, imports);
	return imports;
}
