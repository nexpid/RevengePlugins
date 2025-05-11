import type { SettingsActivity } from "./activity";

// ! for some reason the compiler breaks here and doesn't recognize ActivityType
const PresetProfiles: Record<string, SettingsActivity> = {
	"Vendetta Advertisement": {
		state: "Join Now",
		details: "\"The best Discord client for mobile\"",
		app: { name: "Vendetta" },
		timestamps: {},
		assets: {
			largeImg:
				"mp:external/1Hoxz2ijw0uHYRKT1DDAYvEDsOTkOTT6Le4YIoX7Joo/%3Fsize%3D128/https/cdn.discordapp.com/icons/1015931589865246730/5f8c26072398178c3fb6868124eeef59.png",
		},
		type: 3,
		buttons: [
			{ text: "Join Vendetta", url: "https://discord.gg/vendetta-mod" },
			{
				text: "Install Vendetta",
				url: "https://github.com/vendetta-mod/Vendetta#installing",
			},
		],
	},
	"Scuffed Spotify Activity": {
		timestamps: {
			start: "spotify.track.start",
			end: "spotify.track.end",
		},
		assets: {
			smallImg: "user.avatar",
			largeImg: "spotify.album",
		},
		buttons: [
			{
				text: "Listen Along",
				url: "{spotify.track.url}",
			},
		],
		app: {
			name: "{spotify.track}",
		},
		type: 2,
		details: "by {spotify.artist}",
		state: "on {spotify.album}",
	},
	"My Profile": {
		timestamps: {
			start: 0,
		},
		assets: {
			largeImg: "user.avatar",
			smallImg: "user.presence",
		},
		buttons: [],
		app: {
			name: "{user.displayname}",
		},
		type: 3,
		details: "{user.name}",
		state: "{user.status}",
	},
};

export default PresetProfiles;
