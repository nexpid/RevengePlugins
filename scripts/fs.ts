import { readFile } from "node:fs/promises";

export async function readFileString(path: string) {
	return await readFile(path, "utf8").then(x => x.toString());
}
