import AppDirectoryPage from "./components/pages/AppDirectoryPage";
import patcher from "./stuff/patcher";

let unpatch: () => void;
export default {
	onLoad: () => (unpatch = patcher()),
	onUnload: () => unpatch?.(),
	settings: AppDirectoryPage,
};
