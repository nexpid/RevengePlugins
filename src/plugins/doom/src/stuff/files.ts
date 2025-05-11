import { RNFileModule } from "$/deps";

export const downloadSource =
	"https://raw.githubusercontent.com/nexpid/VendettaDOOM/main/";
export const storePrefix = "vendetta/DOOM/";

export function existsFile(fileName: string) {
	return RNFileModule.fileExists(
		`${RNFileModule.DocumentsDirPath}/${storePrefix + fileName}`,
	);
}
export async function saveFile(
	fileName: string,
	data: string,
	encoding: "utf8" | "base64" = "utf8",
) {
	await RNFileModule.writeFile(
		"documents",
		`${storePrefix + fileName}`,
		data,
		encoding,
	);
}
export async function readFile(
	fileName: string,
	encoding: "utf8" | "base64" = "utf8",
) {
	return await RNFileModule.readFile(
		`${RNFileModule.DocumentsDirPath}/${storePrefix + fileName}`,
		encoding,
	);
}
export function purgeFiles() {
	return RNFileModule.clearFolder("documents", storePrefix);
}
