import { RNDocumentPicker, RNDocuments, RNFileModule } from "$/deps";

function parseLink(link: string) {
    const path = link.split("://");
    return `/${path[1]}`;
}

export async function pickFile(): Promise<string | null> {
    let text: string | null = null;

    if (RNDocumentPicker) {
        try {
            const { fileCopyUri, type } =
                await RNDocumentPicker.pickSingle({
                    type: RNDocumentPicker.types.plainText,
                    mode: 'open',
                    copyTo: 'cachesDirectory',
                });
            if (type === "text/plain" && fileCopyUri) text = await RNFileModule.readFile(parseLink(fileCopyUri), "utf8");
        } catch (err: any) {
            if (!RNDocumentPicker.isCancel(err)) throw new Error(err);
        }
    } else if (RNDocuments) {
        const [{ uri, name, error, type }] = await RNDocuments.pick({
            type: RNDocuments.types.plainText,
            allowVirtualFiles: true,
            mode: "import",
        });
        if (error) throw new Error(error);

        else if (type === "text/plain" && uri) {
            const [copyResult] = await RNDocuments.keepLocalCopy({
                files: [{
                    fileName: name ?? "cloudsync.txt",
                    uri
                }],
                destination: "cachesDirectory"
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
    return !!RNDocuments;
}

export async function saveFile(name: string, content: any) {
    if (!RNDocuments) return false;

    const path = await RNFileModule.writeFile("cache", `cloudsync_${name}`, content, "utf8");
    return await RNDocuments.saveDocuments({
        sourceUris: [`file:///${path}`],
        mimeType: "text/plain",
        fileName: name,
    }).then(x => x[0]);
}
