import constants from "$/constants";

export default {
	proxyUrl: "https://bn-plugins.github.io/vd-proxy/",
	customLinks: {
		"vendetta.nexpid.xyz": path =>
			`${constants.github.url}tree/main/plugins/${path.join("/")}`,
		"mugman.catvibers.me": path =>
			`https://github.com/mugman174/${path[0]}/tree/master/plugins/${
				path.slice(1).join("/")
			}`,
		"plugins.obamabot.me": path =>
			`https://github.com/WolfPlugs/${path[0]}/tree/master/${
				path
					.slice(1)
					.join("/")
			}`,
	} satisfies Record<string, (path: string[]) => string>,
};
