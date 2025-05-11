import type { Module } from "../stuff/Module";
import BetterComponents from "./BetterComponents";
import ColorfulChannels from "./ColorfulChannels";
import Minimod from "./Minimod";
import NoInviteToServers from "./NoInviteToServers";
import SendSpotifyInvite from "./SendSpotifyInvite";
import SpotifyListenAlong from "./SpotifyListenAlong";
import TenorGifFix from "./TenorGifFix";

// hook: keep sorted alphabetically
export default [
	BetterComponents,
	ColorfulChannels,
	Minimod,
	NoInviteToServers,
	SendSpotifyInvite,
	SpotifyListenAlong,
	TenorGifFix,
].sort((a, b) => (a.id < b.id ? -1 : 1)) as Module<any>[];
