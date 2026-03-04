import { GITHUB } from "@vendetta/constants";
import { findByName, findByProps } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { logger } from "@vendetta";
import { lang } from "..";
import constants from "../constants";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { authFetch, getData } from "./api";

const { pushModal, popModal } = findByProps("pushModal", "popModal");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

function identifyClient() {
	if (GITHUB === "https://github.com/kmmiio99o/ShiggyCord") return "shiggycord";
	else if (GITHUB === "https://github.com/C0C0B01/Kettu") return "kettu";
	else if (GITHUB === "https://github.com/revenge-mod") return "revenge";
	else return "vd-fork";
}

export function openOauth2Modal() {
	pushModal({
		key: "oauth2-authorize",
		modal: {
			key: "oauth2-authorize",
			modal: OAuth2AuthorizeModal,
			animation: "slide-up",

			shouldPersistUnderModals: false,
			props: {
				clientId: constants.oauth2.clientId,
				scopes: ["applications.commands", "identify"],
				integrationType: 1, // USER_INSTALL
				permissions: 0n,
				responseType: "code",
				redirectUri: constants.oauth2.redirectURL,
				cancelCompletesFlow: false,
				callback: async ({ location }) => {
					if (!location) return;
					try {
						const url = new URL(location);
						url.searchParams.append("whois", identifyClient());

						const res = await authFetch(url);
						if (!res) throw "Response wasn't ok";

						const access = await res.text();
						if (!access) throw "Access token is missing";

						const refresh = res.headers.get("X-Refresh-Token");
						// STUB uncomment this once API is fully rolled out
						// if (!refresh) throw "Refresh token is missing";

						useAuthorizationStore.getState().setToken(access, refresh || "");
						getData();

						showToast(
							lang.format("toast.oauth.authorized", {}),
							getAssetIDByName("CircleCheckIcon-primary"),
						);
					} catch (error) {
						logger.error("oauth2 error", error);
						if (typeof error === "string") {
							showToast(error, getAssetIDByName("CircleXIcon-primary"));
						}
					}
				},
				dismissOAuthModal: () => popModal("oauth2-authorize"),
			},
			closable: true,
		},
	});
}
