import { findByProps } from "@vendetta/metro";
import { safeFetch } from "@vendetta/utils";

const apiUrl = "https://discord.com/api/v9/";
const { getToken } = findByProps("getToken");

export interface SimpleAPIApplication {
	id: string;
	icon?: string;
	name: string;
	description?: string;
}
export async function getApplications(): Promise<SimpleAPIApplication[]> {
	return await (
		await safeFetch(`${apiUrl}applications?with_team_applications=true`, {
			headers: { authorization: getToken() },
		})
	).json();
}

export interface AppRichAsset {
	id: string;
	type: 1;
	name: string;
}
export async function getApplicationAssets(
	applicationId: string,
): Promise<AppRichAsset[]> {
	return await (
		await safeFetch(
			`${apiUrl}oauth2/applications/${applicationId}/assets`,
			{
				cache: "no-store",
				headers: { authorization: getToken() },
			},
		)
	).json();
}

export const proxyAssetCache: Record<string, string> = {};
export async function getExternalAsset(url: string): Promise<string> {
	if (proxyAssetCache[url]) return proxyAssetCache[url];

	proxyAssetCache[url] = "pending";
	let link: string = (
		await (
			await fetch(`${apiUrl}applications/0/external-assets`, {
				method: "POST",
				headers: {
					authorization: getToken(),
					"content-type": "application/json",
				},
				body: JSON.stringify({ urls: [url] }),
			})
		).json()
	)[0].external_asset_path;
	if (link.startsWith("https://media.discordapp.net")) {
		link = link.split("/").slice(3).join("/");
	}

	proxyAssetCache[url] = link;
	return link;
}
