import constants from "$/constants";

export interface CollectionEntry {
	title: string;
	url: string;
}

export interface Collection {
	label: string;
	variant: "dark" | "light" | "any";
	content: CollectionEntry[];
}

const prefix = `${constants.github.raw}plugins/monet-theme/assets/backgrounds/`;

export default [
	{
		label: "Pixel 4 XL",
		variant: "any",
		content: [
			{
				title: "Cinnamon",
				url: `${prefix}pixel4l/cinnamon.png`,
			},
			{
				title: "Default",
				url: `${prefix}pixel4l/default.png`,
			},
			{
				title: "Green",
				url: `${prefix}pixel4l/green.png`,
			},
			{
				title: "Ocean",
				url: `${prefix}pixel4l/ocean.png`,
			},
			{
				title: "Orchid",
				url: `${prefix}pixel4l/orchid.png`,
			},
			{
				title: "Purple",
				url: `${prefix}pixel4l/purple.png`,
			},
			{
				title: "Space",
				url: `${prefix}pixel4l/space.png`,
			},
			{
				title: "White",
				url: `${prefix}pixel4l/white.png`,
			},
		],
	},
] as Collection[];
