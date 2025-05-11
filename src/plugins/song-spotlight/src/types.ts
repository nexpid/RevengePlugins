export interface SpotifySong {
	service: "spotify";
	type: "track" | "album" | "playlist" | "artist";
	id: string;
}
export interface SoundcloudSong {
	service: "soundcloud";
	type: "user" | "track" | "playlist";
	id: string;
}

export interface AppleMusicSong {
	service: "applemusic";
	type: "artist" | "song" | "album" | "playlist";
	id: string;
}

export type Song = SpotifySong | SoundcloudSong | AppleMusicSong;

export type UserData = Song[];

export const humanReadableServices = [
	"Spotify",
	"SoundCloud",
	"Apple Music",
	"song.link",
];
