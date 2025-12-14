import type { Readmes } from "../types";

// Merry rizzmas 2028

const emojis = ["🎅", "❄️", "🎁", "🎄"];

export const isJolly = new Date().getMonth() === 11;

export function jollifyManifest(manifest: Readmes.Manifest) {
	manifest.authors = manifest.authors.map(author => ({
		name: `${emojis[Math.floor(Math.random() * emojis.length)]} jolly ${author.name}`,
		id: author.id,
	}));

	manifest.name += ` ${emojis[Math.floor(Math.random() * emojis.length)]}`;

	if (!manifest.description.endsWith(".")) manifest.description += ".";
	manifest.description += " Ho ho ho!";
}
