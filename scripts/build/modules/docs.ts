import { readdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, join } from "path";
import modIcons from "plugins/themes-plus/src/stuff/modIcons";

function replaceHook(str: string, hook: string, replacement: string) {
	const [prefix, rest] = str.split(`<!-- ${hook} start -->`);
	const [_, suffix] = rest.split(`<!-- ${hook} end -->`);

	return `${prefix}<!-- ${hook} start -->${replacement}<!-- ${hook} end -->${
		suffix || ""
	}`;
}

export async function makeDocsIconsHook() {
	const files = await readdir("src", { recursive: true });
	const tpconfigs = (
		await Promise.all(
			files
				.map(x => x.replace(/\\/g, "/"))
				.filter(x => x.endsWith("/tpconfig.json"))
				.map(async file => ({
					parent: dirname(file),
					config: JSON.parse(
						await readFile(join("src", file), "utf8"),
					) as {
						root: string;
					},
					depth: file.split("/").length,
				})),
		)
	).sort((a, b) => b.depth - a.depth);

	// Gather all custom icons
	const res = {} as Record<
		string,
		{
			alt: string;
			root: string;
			path: string;
			location: string;
			indentation: number;
		}[]
	>;

	for (const file of files.filter(x => x.endsWith(".png")).sort()) {
		const dirnm = dirname(file).replace(/\\/g, "/");
		const config = tpconfigs.find(cfg => dirnm.startsWith(cfg.parent));
		if (!config) continue;

		const tag = config.config.root;

		res[tag] ??= [];
		res[tag].push({
			alt: `${config.config.root} ${basename(file).split(".").slice(0, -1).join(".")}`,
			root: `${config.config.root}${dirnm.slice(config.parent.length)}/`,
			path: `${config.config.root}${dirnm.slice(config.parent.length)}/${basename(file)}`,
			location: join("..", "src", file).replace(/\\/g, "/"),
			indentation: dirnm.slice(config.parent.length).split("/").length - 1,
		});
	}

	for (const key of Object.keys(res)) {
		res[key] = res[key].sort((a, b) => {
			const depthA = a.path.split("/").length;
			const depthB = b.path.split("/").length;

			return depthA === depthB
				? a.path.localeCompare(b.path)
				: depthA - depthB;
		});
	}

	// Modify ICONS.md yea!!

	const iconsMd = await readFile("docs/ICONS.md", "utf8");
	const iconsMdModIcons = replaceHook(
		iconsMd,
		"mod icons hook",
		`\n\n${
			Object.entries(modIcons)
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(
					([name, icon]) =>
						`- <img src=${JSON.stringify(icon.source)} alt=${
							JSON.stringify(`${name} logo`)
						} width=20 height=20 /> — \`${name}.png\``,
				)
				.join("\n")
		}\n\n`,
	);

	const subfolderMarker = new Set();
	const iconsMdCustomIcons = replaceHook(
		iconsMdModIcons,
		"custom icons hook",
		`\n${
			Object.entries(res)
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(
					([tag, entries]) =>
						`\n### ${tag}\n\n${
							entries
								.map(
									icon =>
										`${
											icon.indentation > 0 && !subfolderMarker.has(icon.root)
												? (subfolderMarker.add(icon.root),
													`${"  ".repeat(icon.indentation - 1)}- 📂 \`${icon.root}\`\n`)
												: ""
										}${"  ".repeat(icon.indentation)}- <img src=${
											JSON.stringify(icon.location)
										} alt=${
											JSON.stringify(icon.alt)
										} width=20 height=20 /> — \`${icon.path}\``,
								)
								.join("\n")
						}`,
				)
				.join("\n")
		}\n\n`,
	);

	await writeFile("docs/ICONS.md", iconsMdCustomIcons);
}
