import patcher from "./stuff/patcher";

let unpatch: any;
export default {
	onLoad: () => (unpatch = patcher()),
	onUnload: () => unpatch(),
};
