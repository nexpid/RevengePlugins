import { vstorage } from "..";
import { type RulesType, useRulesStore } from "../stores/RulesStore";

const useProvider = (
	provider: RulesType["providers"][string],
	urlObj: URL,
): string => {
	const url = urlObj.toString();

	const query = new Array<string>();
	urlObj.searchParams.forEach((_, key) => query.push(key));

	// should we redirect?
	if (vstorage.config.redirect && provider.redirections) {
		const redirect = provider.redirections.find(reg => url.match(new RegExp(reg, "i")));
		const red = redirect && url.match(new RegExp(redirect, "i"))?.[1];
		if (red) return cleanUrl(decodeURIComponent(red));
	}

	// apply raw rules
	if (provider.rawRules && query.length > 0) {
		for (const rule of provider.rawRules) {
			urlObj.search = urlObj.search.replace(new RegExp(rule, "gi"), "");
		}
	}

	// apply rules & referrals
	const toRemove = new Array<any>().concat(
		provider.rules ?? [],
		(vstorage.config.referrals && provider.referralMarketing) ?? [],
	);

	if (toRemove.length > 0 && query.length > 0) {
		for (const rule of toRemove) {
			for (const key of query) {
				if (new RegExp(`^${rule}$`, "i").test(key)) {
					urlObj.searchParams.delete(key);
				}
			}
		}
	}

	return urlObj.toString();
};

export function cleanUrl(url: string) {
	const { rules } = useRulesStore.getState();
	if (!rules?.providers) return url;

	let urlObj: URL;
	try {
		urlObj = new URL(url);
	} catch {
		return url;
	}

	for (const provider of Object.values(rules.providers)) {
		if (!provider.urlPattern) continue;

		// should we apply this rule?
		if (!new RegExp(provider.urlPattern, "i").test(url)) continue;
		if (provider.exceptions?.some(reg => new RegExp(reg, "i").test(url))) {
			continue;
		}

		try {
			urlObj = new URL(useProvider(provider, urlObj));
		} catch {
			return urlObj.toString();
		}
	}

	return urlObj.toString();
}
