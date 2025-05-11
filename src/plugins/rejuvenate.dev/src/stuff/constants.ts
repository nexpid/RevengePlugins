import { settings } from "@vendetta";

const initialSymbol = Symbol.for("rejuvenate.initial");
export const initial = window[initialSymbol]
	? false
	: (window[initialSymbol] = true);

export const getPluginUrl = () => `${settings.debuggerUrl.slice(0, -4)}8731`;
