import { findByStoreName } from "@vendetta/metro";
import { after, before } from "@vendetta/patcher";
import { semanticColors } from "@vendetta/ui";

import { resolveSemanticColor } from "$/types";

const ThemeStore = findByStoreName("ThemeStore");

export default function() {
	const patches = new Array<() => void>();

	const collected = new Map<
		string,
		{
			get: () => object;
			unpatch: () => void;
		}
	>();
	window.nx = {
		get semantic() {
			const data = {};
			for (const [key, raw] of Object.entries(semanticColors)) {
				data[key] = Object.fromEntries(
					["dark", "darker", "midnight", "light"].map(x => [
						x,
						resolveSemanticColor(raw, x),
					]),
				);
			}
			return data;
		},
		searchSemantic(query: string) {
			query ??= "";
			return Object.fromEntries(
				Object.entries(this.semantic).filter(([x]) =>
					query.startsWith("^") && query.endsWith("$")
						? x.toLowerCase() === query.toLowerCase().slice(1, -1)
						: query.startsWith("^")
						? x
							.toLowerCase()
							.startsWith(query.toLowerCase().slice(1))
						: query.endsWith("$")
						? x
							.toLowerCase()
							.endsWith(query.toLowerCase().slice(0, -1))
						: x.toLowerCase().includes(query.toLowerCase())
				),
			);
		},
		findSemantic(hex: string) {
			hex ??= "";
			const { theme } = ThemeStore;

			return Object.fromEntries(
				Object.entries(this.semantic)
					.map(([x, y]) => [
						x,
						Object.fromEntries(
							Object.entries(y).filter(
								([k, z]) => k === theme && z === hex,
							),
						),
					])
					.filter(([_, z]) => Object.entries(z)[0]),
			);
		},

		p: {
			wipe: () => {
				for (const x of patches) {
					x();
				}
				patches.length = 0;
			},
			snipe: (
				prop: string,
				parent: any,
				callback?: (args: any[], ret: any) => any,
				oneTime?: boolean,
			) => {
				const patch = after(
					prop,
					parent,
					callback
						?? ((a, b) => {
							console.log("[NX]:", a, b);
						}),
					oneTime ?? false,
				);
				patches.push(patch);
			},
			props: {
				collect: (
					key: string,
					prop: string,
					parent: any,
					parser?: (obj: any) => any,
				) => {
					collected.get(key)?.unpatch();

					const ran = new Array<string>();
					const unpatch = before(prop, parent, args => {
						const props = parser?.(args) ?? args[0];
						const runFor = (
							propper: any,
							assign: any,
							tree = ".",
						) => {
							if ("_value" in propper) return;
							for (const p of Object.keys(propper)) {
								if (!assign[p] && ran.includes(tree)) {
									assign[p] ??= {
										kinds: ["undefined"],
										stuff: ["undefined"],
									};
								} else {
									assign[p] ??= {
										kinds: [],
										stuff: [],
									};
									ran.push(tree);
								}

								const stuff = Array.isArray(propper[p])
									? propper[p]
									: [propper[p]];
								for (const x of stuff) {
									const array = Array.isArray(x);
									const kind = array ? "array" : typeof x;

									if (typeof x === "object" && x !== null) {
										let set = assign[p].stuff.find(
											(y: any) =>
												typeof y === "object"
												&& y !== null,
										);
										if (!set) {
											set = assign[p].stuff[
												assign[p].stuff.push({}) - 1
											];
										}

										runFor(x, set, `${tree}${p}.`);
									} else if (
										!assign[p].stuff.find(
											(y: any) =>
												JSON.stringify(y)
													=== JSON.stringify(x),
										)
									) {
										assign[p].stuff.push(x);
									}
									if (!assign[p].kinds.includes(kind)) {
										assign[p].kinds.push(kind);
									}
								}
							}

							for (const r of Object.keys(assign)) {
								if (propper[r] === undefined) {
									if (!assign[r].kinds.includes("undefined")) {
										assign[r].kinds.push("undefined");
									}
									if (!assign[r].stuff.includes("undefined")) {
										assign[r].stuff.push("undefined");
									}
								}
							}
						};

						runFor(props, data);
						console.log(`[NX]: Collected new prop for "${key}"`);
					});
					patches.push(unpatch);

					const data: object = {};
					collected.set(key, {
						unpatch,
						get: () => data,
					});
				},
				redeem: (key: string, save?: boolean) => {
					const coll = collected.get(key);
					if (!coll) return;

					coll.unpatch();
					if (save) {
						// this is a debug thing i added to vdebug lol
						console.log(
							`DEBUG\0SAVEFILE\0${JSON.stringify(`nexxutils_${key}.json`)}\0${
								JSON.stringify(JSON.stringify(coll.get(), undefined, 3))
							}`,
						);
					} else return coll.get();
				},
			},
		},
	};

	return () => {
		window.nx?.p.wipe();
		window.nx = undefined;
	};
}
