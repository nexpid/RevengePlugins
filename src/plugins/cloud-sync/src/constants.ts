import constants from "$/constants";

import { vstorage } from ".";
import { redirectRoute } from "./stuff/api";

export const defaultHost = "https://dc.cloudsync.nexpid.xyz/";
export const defaultClientId = "1120793656878714913";

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
	raw: `${constants.github.raw}src/plugins/cloud-sync/`,
	oauth2: {
		get clientId() {
			return vstorage.custom.clientId || defaultClientId;
		},
		get redirectURL() {
			return `${api()}${redirectRoute}`;
		},
	},
};
