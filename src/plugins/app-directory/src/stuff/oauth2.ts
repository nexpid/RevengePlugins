import { findByName, findByProps } from "@vendetta/metro";

const { pushModal, popModal } = findByProps("pushModal", "popModal");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

export function openOauth2Modal(applicationId: string, installParams: any) {
	pushModal({
		key: "oauth2-authorize",
		modal: {
			key: "oauth2-authorize",
			modal: OAuth2AuthorizeModal,
			animation: "slide-up",

			shouldPersistUnderModals: false,
			props: {
				clientId: applicationId,

				...installParams,
				permissions: BigInt(installParams.permissions),

				cancelCompletesFlow: false,
				dismissOAuthModal: () => popModal("oauth2-authorize"),
			},
			closable: true,
		},
	});
}
