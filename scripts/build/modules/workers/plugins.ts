import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parentPort, workerData } from "node:worker_threads";

import { transformFile } from "@swc/core";
import { build } from "esbuild";
import { imageSizeFromFile } from "image-size/fromFile";
import Mime from "mime";

import { dprint } from "../../../common/dprint";
import { makeMdNote } from "../../lib/common.ts";
import { isJolly, jollifyManifest } from "../jollyposting.ts";

const mdNote = makeMdNote("scripts/build/modules/workers/plugins.ts", "md");

const { isDev, previewLang } = workerData;

async function buildPlugin(
	plugin: string,
	lang: string | null,
	prcess?: string,
) {
	const manifest: import("../../types").Readmes.Manifest = JSON.parse(
		await readFile(join("src/plugins", plugin, "manifest.json"), "utf8"),
	);

	const title = `${manifest.name} (by ${
		manifest.authors
			.map(x => x.name)
			.join(", ")
	})`;

	await mkdir(join("dist", plugin), { recursive: true });
	await dprint.saveAndFormat(
		join("dist", plugin, "index.md"),
		[
			"---",
			`title: ${title}`,
			`description: ${manifest.description}`,
			"---\n",

			`${mdNote}\n`,

			// header
			"<div align=\"center\">",
			`<h1>${title}</h1>`,
			`<h3>${manifest.description}</h3>`,
			// footer
			"</div>\n",

			"> **Note**",
			`> This is a landing page for the plugin **${manifest.name}**. The proper way to install this plugin is going to Revenge's Plugins page and adding it there.`,
		].join("\n"),
	);

	let langDefault: object | null = null;
	let langValues: object | null = null;

	if (lang) {
		const langDefaultFile = join("lang/values/base", `${lang}.json`);
		if (existsSync(langDefaultFile)) {
			langDefault = JSON.parse(await readFile(langDefaultFile, "utf8"));
		}

		const langValuesFile = join("lang/values", `${lang}.json`);
		if (existsSync(langValuesFile) && isDev) {
			langValues = JSON.parse(await readFile(langValuesFile, "utf8"));
		}
	}

	await build({
		entryPoints: [join("src/plugins", plugin, manifest.main)],
		bundle: true,
		outfile: join("dist", plugin, "index.js"),
		format: "iife",
		supported: {
			"const-and-let": false,
		},
		minifySyntax: !isDev,
		minifyWhitespace: !isDev,
		define: {
			IS_DEV: `${isDev}`,
			PREVIEW_LANG: `${previewLang}`,
			DEFAULT_LANG: previewLang
				? "{}"
				: langDefault
				? JSON.stringify(langDefault)
				: "undefined",
			DEV_LANG: previewLang
				? "{}"
				: langValues
				? JSON.stringify(langValues)
				: "undefined",
		},
		loader: {
			".html": "text",
			".css": "text",
			".svg": "text",
			".json": "json",
		},
		globalName: "$",
		banner: { js: "(()=>{" },
		footer: { js: "return $;})();" },
		plugins: [
			{
				// based on eslint-plugin-globals
				name: "vendetta",
				setup(build) {
					build.onResolve(
						{ filter: /^@vendetta\/?/ },
						({ path }) => ({
							path,
							namespace: "vendetta",
						}),
					);
					build.onLoad(
						{ filter: /.*/, namespace: "vendetta" },
						({ path }) => ({
							contents: `module.exports = ${path.slice(1).replace(/\//g, ".")}`,
							loader: "js",
						}),
					);
				},
			},
			{
				name: "swc",
				setup(build) {
					build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async args => {
						const result = await transformFile(args.path, {
							jsc: {
								externalHelpers: false,
							},
							env: {
								targets: "fully supports es6",
								include: [
									"transform-block-scoping",
									"transform-classes",
									"transform-async-to-generator",
									"transform-async-generator-functions",
									"transform-named-capturing-groups-regex",
								],
								exclude: [
									"transform-parameters",
									"transform-template-literals",
									"transform-exponentiation-operator",
									"transform-nullish-coalescing-operator",
									"transform-object-rest-spread",
									"transform-optional-chaining",
									"transform-logical-assignment-operators",
								],
							},
						});

						return { contents: result.code };
					});
				},
			},
			{
				name: "file parser",
				setup(build) {
					const extensions = [
						"png",
						"jpg",
						"jpeg",
						"bmp",
						"gif",
						"webp",
						"psd",
					];
					build.onLoad(
						{
							filter: new RegExp(
								`\\.(${extensions.join(")|(")})$`,
							),
						},
						async args => {
							const dimensions = (await imageSizeFromFile(args.path))!;

							let root = dirname(args.path),
								tpConfig: { root: string } | null = null;
							for (let depth = 0; depth < 5; depth++) {
								if (existsSync(join(root, "tpconfig.json"))) {
									tpConfig = JSON.parse(
										await readFile(
											join(root, "tpconfig.json"),
											"utf8",
										),
									);
									break;
								}

								root = dirname(root);
							}

							return {
								contents: `export default ${
									JSON.stringify({
										uri: `data:${Mime.getType(args.path)};base64,${
											Buffer.from(await readFile(args.path)).toString("base64")
										}`,
										width: dimensions.width,
										height: dimensions.height,
										file: tpConfig
											? join(
												tpConfig.root,
												args.path.slice(root.length + 1),
											).replace(/\\/g, "/")
											: null,
										allowIconTheming: !!tpConfig,
									})
								};`,
							};
						},
					);
				},
			},
		],
	});

	const hash = createHash("sha256")
		.update(await readFile(join("dist", plugin, "index.js"), "utf8"))
		.digest("hex");

	const outManifest = manifest;
	outManifest.hash = hash;
	outManifest.main = "index.js";

	if (isJolly) jollifyManifest(outManifest);

	const onFinish = async () => {
		if (prcess) finishUp.delete(prcess);

		await writeFile(
			join("dist", plugin, "manifest.json"),
			JSON.stringify(outManifest),
		);
	};

	if (prcess) finishUp.set(prcess, onFinish);
	else await onFinish();

	return manifest.name;
}

const finishUp = new Map<string, () => void>();

if (parentPort) parentPort.postMessage("ready");
else throw new Error("why is parentPort missing???");

parentPort.addListener("message", data =>
	data.finishUp
		? finishUp.get(data.finishUp)?.()
		: buildPlugin(data.name, data.lang, data.prcess)
			.then(plugin =>
				parentPort!.postMessage({
					result: "yay",
					plugin,
				})
			)
			.catch(err =>
				parentPort!.postMessage({
					result: "nay",
					err: err instanceof Error
						? err
						: new Error(
							err?.message
								?? err?.toString?.()
								?? String(err),
						),
				})
			));
