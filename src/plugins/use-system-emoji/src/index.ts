import { patchRows } from "$/types";
import type { ContentRow, ContentRowIs } from "$/typings";

function iterate(rows: ContentRow[]) {
	const content: ContentRow[] = [];

	let header: ContentRowIs<"heading"> | undefined;
	for (const original of rows) {
		let row = original;
		if (row.type === "emoji") row = { type: "text", content: row.surrogate };
		if ("content" in row && Array.isArray(row.content)) row.content = iterate(row.content);
		if ("items" in row && Array.isArray(row.items)) row.items = iterate(row.items);

		if ("jumboable" in original && original.jumboable && !header) {
			header = { type: "heading", level: 1, content: [] };
		}
		if (
			(original.type === "emoji" || original.type === "customEmoji") && !original.jumboable
			&& header
		) {
			content.push(header);
			header = undefined;
		}

		if (header) header.content.push(row);
		else content.push(row);
	}
	if (header) content.push(header);

	return content;
}

export const onUnload = patchRows(rows => {
	for (const row of rows) {
		if (row.type === 1 && row.message.content) row.message.content = iterate(row.message.content);
	}
});
