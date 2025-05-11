import { findByName, findByProps } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { lang } from "..";
import constants from "../constants";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { authFetch, getData } from "./api";

const { pushModal, popModal } = findByProps("pushModal", "popModal");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

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
				redirectUri: constants.oauth2.redirectURL,

				scopes: ["identify"],
				responseType: "code",
				permissions: 0n,
				cancelCompletesFlow: false,
				callback: async ({ location }) => {
					if (!location) return;
					try {
						const token = await (await authFetch(location))?.text();
						useAuthorizationStore.getState().setToken(token);
						getData();

						showToast(
							lang.format("toast.oauth.authorized", {}),
							getAssetIDByName("CircleCheckIcon-primary"),
						);
					} catch {
						// handled in authFetch
					}
				},
				dismissOAuthModal: () => popModal("oauth2-authorize"),
			},
			closable: true,
		},
	});
}
