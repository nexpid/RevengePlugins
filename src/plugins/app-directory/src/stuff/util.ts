import intlProxy, { intlFormat } from "$/lib/intlProxy";

export function inServers(x: number) {
	return intlFormat.APP_DIRECTORY_PROFILE_EMBED_GUILD_COUNT({
		guildCount: x < 1_000
			? x.toString()
			: x < 1_000_000
			? `${Math.round(x / 1_00) / 10}K`
			: `${Math.round(x / 1_00_000) / 10}M`,
	});
}

export const parseDesc = (detailed: string | null, short: string) => {
	const parsed = new Array<{ title: string; content: string[] }>();

	const l = detailed?.split("\n") ?? [];
	let open = false;

	if (l.includes("-----------")) {
		let i = 0;
		while (i < l.length) {
			const rn = l[i],
				next = l[i + 1],
				after = l[i + 2];
			if (after === "-----------") {
				open = true;
				parsed.push({ title: next.slice(2, -2), content: [] });
				i += 3;
			} else if (open) parsed[parsed.length - 1].content?.push(rn);
			i++;
		}
	} else {
		parsed.push({
			title: intlProxy.APP_DIRECTORY_PROFILE_DESCRIPTION_HEADING,
			content: l.length ? l : [short],
		});
	}

	return parsed;
};
