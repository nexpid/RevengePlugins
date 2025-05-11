import { vstorage } from ".";
import { redirectRoute } from "./stuff/api";

export const defaultHost = "https://dc.songspotlight.nexpid.xyz/";
export const defaultClientId = "1157745434140344321";

const api = () =>
	vstorage.custom.host
		? !vstorage.custom.host.endsWith("/")
			? `${vstorage.custom.host}/`
			: vstorage.custom.host
		: defaultHost;

export default {
	get api() {
		return api();
	},
	oauth2: {
		get clientId() {
			return vstorage.custom.clientId || defaultClientId;
		},
		get redirectURL() {
			return `${api()}${redirectRoute}`;
		},
	},
};
