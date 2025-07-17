import AppDirectoryPage from "./components/pages/AppDirectoryPage";
import patcher from "./stuff/patcher";

export const onUnload = patcher();

export const settings = AppDirectoryPage;
