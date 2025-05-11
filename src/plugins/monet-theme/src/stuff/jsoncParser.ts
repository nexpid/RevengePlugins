export function parse(json: string): any {
	return JSON.parse(
		json
			.replace(/\r/g, "")
			.replace(/\/\/.*$/gm, "")
			.replace(/\/\*(?:.|\n)*?(?=\*\/)\*\//g, ""),
	);
}
