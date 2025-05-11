export function stringifyTimeDiff(diff: number) {
	const time = Math.abs(Math.floor(diff / 1000));

	const hrs = Math.floor(time / 3600);
	const mins = Math.floor(time / 60) % 60;
	const secs = time % 60;

	return `${hrs ? `${hrs.toString().padStart(2, "0")}:` : ""}${
		mins
			.toString()
			.padStart(2, "0")
	}:${secs.toString().padStart(2, "0")}`;
}

export function parseTimestamp(timestamp: number): number {
	const hrs = Math.floor(timestamp / 60);
	const mins = timestamp % 60;

	return new Date().setHours(hrs, mins, 0, 0);
}
export function unparseTimestamp(timestamp: number): number {
	const date = new Date(timestamp);
	return date.getHours() * 60 + date.getMinutes();
}

export function displayImage(
	image: string,
	appId?: string,
): string | undefined {
	if (image.startsWith("spotify:")) {
		return `https://i.scdn.co/image/${image.slice("spotify:".length)}`;
	}
	if (image.startsWith("mp:")) {
		return `https://media.discordapp.net/${image.slice("mp:".length)}`;
	}
	if (!Number.isNaN(Number(image))) {
		return `https://cdn.discordapp.com/app-assets/${appId ?? "1"}/${image}.png?size=56`;
	}
}

export const statusLinks = {
	online: "mp:attachments/919655852724604978/1125529509723123712/s_online.png",
	idle: "mp:attachments/919655852724604978/1125529509467279451/s_idle.png",
	dnd: "mp:attachments/919655852724604978/1125529509236572301/s_dnd.png",
	offline: "mp:attachments/919655852724604978/1125529508980731954/s_offline.png",
};
