export function toURL(url: URL) {
	const str = url.toString();

	if (url.pathname === "/" && str.endsWith("/")) return str.slice(0, -1);
	else return str;
}
