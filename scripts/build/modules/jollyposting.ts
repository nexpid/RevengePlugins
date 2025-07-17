import type { Readmes } from "../types";

// Merry rizzmas 2028

const commonNouns = [
	"app",
	"char",
	"urls",
	"cloud",
	"facecam",
	"message",
	"monet",
	"utils",
	"plugin",
	"song",
	"themes",
	"twemoji",
	"system",
];

const emojis = ["🎅", "❄️", "🎁", "🎄"];

export const isJolly = new Date().getMonth() === 11;

export function jollifyManifest(manifest: Readmes.Manifest) {
	manifest.authors = manifest.authors.map(author => ({
		name: `${emojis[Math.floor(Math.random() * emojis.length)]} jolly ${author.name}`,
		id: author.id,
	}));

	const matched = commonNouns.find(noun =>
		manifest.name.toLowerCase().includes(noun.toLowerCase())
	);
	if (matched) {
		manifest.name = manifest.name.replace(
			new RegExp(matched, "gi"),
			"Christmas",
		);
	}

	manifest.name = `${emojis[Math.floor(Math.random() * emojis.length)]} ${manifest.name}`;

	if (manifest.description.endsWith(".")) {
		manifest.description += " Ho ho ho!";
	} else manifest.description += ". Ho ho ho!";
}
