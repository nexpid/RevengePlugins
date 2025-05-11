import { timeout, tryToConnect, ws, wsSymbol } from "./stuff/ws";

export const onLoad = () => (
	window[wsSymbol]?.close(1000, "plugin killed"), tryToConnect()
);
export const onUnload = () => {
	ws?.close(1000, "plugin stopped");
	clearTimeout(timeout);
};
