// used both in scripts and in plugins

/** @type {RegExp[]} */
const variableRules = [
	// You have {plugins} {plugins, plural, one {plugin} other {plugins}}!
	// Good {time, select, isDay {day} isNight {night} other {}}!
	/{([^}]+), (select|plural), ?\n?([\s\S]+?)(?=(}})|(} ?\r?\n ?}))/g,
	// Hello world from {plugin.name}!
	/{([^}]+)}/g,
];
const replacerRegExp = /(\w+) {([^}]*)} ?/g;

/**
 * Parses the variable rules from the given text
 * @param {string} text
 */
export function parseVariableRules(text) {
	/** @type {({ variable: string, start: number, length: number } & ({ type: "variable" } | { type: "choose", kind: "select" | "plural", replacers: Record<string, string> }))[]} */
	const rules = [];

	for (const regex of variableRules) {
		const matches = text.matchAll(regex);
		for (const rawMatch of Array.from(matches)) {
			const [match, variable, kind, rawReplacers, _suffix1, _suffix2] = rawMatch;
			const { index } = rawMatch;

			const suffix = _suffix1 ?? _suffix2 ?? "";

			// ignore previously matched things
			if (rules.some(x => index >= x.start && index < x.start + x.length)) {
				continue;
			}

			if (!kind) {
				rules.push({
					type: "variable",
					variable,
					start: index,
					length: match.length + suffix.length,
				});
			} else {
				// map replacers insto a [key, value] array
				const replacers = Object.fromEntries(
					Array.from(`${rawReplacers}}`.matchAll(replacerRegExp)).map(
						x => [x[1], x[2]],
					),
				);
				rules.push({
					type: "choose",
					kind: kind,
					variable,
					start: index,
					length: match.length + suffix.length,
					replacers,
				});
			}
		}
	}

	return rules;
}
