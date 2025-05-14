import { DocumentPicker, DocumentsNew, RNFileModule } from "$/deps";

function parseLink(link: string) {
	const path = link.split("://");
	return `/${path[1]}`;
}

export async function pickFile(): Promise<string | null> {
	let text: string | null = null;

	if (DocumentPicker) {
		try {
			const { fileCopyUri, type } = await DocumentPicker.pickSingle({
				type: DocumentPicker.types.plainText,
				mode: "open",
				copyTo: "cachesDirectory",
			});
			if (type === "text/plain" && fileCopyUri) {
				text = await RNFileModule.readFile(parseLink(fileCopyUri), "utf8");
			}
		} catch (err: any) {
			if (!DocumentPicker.isCancel(err)) throw new Error(err);
		}
	} else if (DocumentsNew) {
		const [{ uri, name, error, type }] = await DocumentsNew.pick({
			type: DocumentsNew.types.plainText,
			allowVirtualFiles: true,
			mode: "import",
		});
		if (error) throw new Error(error);
		if (type === "text/plain" && uri) {
			const [copyResult] = await DocumentsNew.keepLocalCopy({
				files: [{
					fileName: name ?? "cloudsync.txt",
					uri,
				}],
				destination: "cachesDirectory",
			});
			console.log(uri);
			if (copyResult.status === "success") {
				console.log(copyResult.localUri);
				text = await RNFileModule.readFile(parseLink(copyResult.localUri), "utf8");
			} else {
				throw new Error(copyResult.copyError);
			}
		}
	}

	return text;
}

export function canSaveFileNatively() {
	return !!DocumentsNew;
}

export async function saveFile(name: string, content: any) {
	if (!DocumentsNew) return false;

	const path = await RNFileModule.writeFile(
		"cache",
		`cloudsync_${name}`,
		content,
		"utf8",
	);
	return await DocumentsNew.saveDocuments({
		sourceUris: [`file:///${path}`],
		mimeType: "text/plain",
		fileName: name,
	}).then(x => x[0]);
}
