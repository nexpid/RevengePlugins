import { logger } from "@vendetta";
import { findByStoreName } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import type { UserData } from "@song-spotlight/api/structs";
import { lang } from "..";
import constants from "../constants";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { useCacheStore } from "../stores/CacheStore";

const UserStore = findByStoreName("UserStore");

export const redirectRoute = "api/auth/authorize";
export const songLimit = 6;

let refreshPromise: Promise<boolean> | undefined;
async function refreshAccessToken() {
	const token = useAuthorizationStore.getState().getToken();
	if (!token) return false;

	return refreshPromise ??= fetch(`${constants.api}api/auth/refresh`, {
		method: "POST",
		headers: {
			"X-Refresh-Token": token.refresh,
		},
		body: token.access,
	}).then(async res => {
		if (!res.ok) return false;

		const access = await res.text();
		useAuthorizationStore.getState().setToken(access, token.refresh);
		return true;
	}).finally(() => refreshPromise = undefined);
}

export async function authFetch(url: string | URL, options?: RequestInit, retried = false) {
	url = new URL(url);

	try {
		const token = useAuthorizationStore.getState().getToken();
		const res = await fetch(url, {
			...options,
			headers: {
				...options?.headers,
				authorization: token?.access,
			} as HeadersInit,
		});

		if (res.ok) return res;

		// not modified
		if (res.status === 304) return null;

		const text = await res.text();
		// unauthorized
		if (res.status === 401) {
			const retry = !retried && await refreshAccessToken();
			if (retry) return await authFetch(url, options, true);
			else {
				useAuthorizationStore.getState().deleteTokens();
				showToast(
					lang.format("toast.api.unauthorized", {}),
					getAssetIDByName("CircleXIcon-primary"),
				);
			}
		} else {
			showToast(
				!text.includes("<body>") && res.status >= 400 && res.status <= 599
					? lang.format("toast.fetch_error_detailed", { error_msg: text })
					: lang.format("toast.fetch_error", { urlpath: url.pathname }),
				getAssetIDByName("CircleXIcon-primary"),
			);
		}

		logger.error(
			"authFetch error",
			options?.method ?? "GET",
			url.toString(),
			res.status,
			text,
		);
		throw new Error(text);
	} catch (error) {
		showToast(
			lang.format("toast.fetch_error_detailed", { error_msg: String(error) }),
			getAssetIDByName("CircleXIcon-primary"),
		);

		throw error;
	}
}

export async function getData(): Promise<UserData | undefined> {
	return await authFetch(`${constants.api}api/data`, {
		headers: {
			"if-modified-since": useCacheStore.getState().self?.at,
		} as HeadersInit,
	}).then(async res => {
		if (!res) return useCacheStore.getState().self?.data;

		const data = await res.json();
		useCacheStore.getState().update({
			data,
			at: res.headers.get("last-modified") || undefined,
		});
		return data;
	});
}
export async function listData(userId: string): Promise<UserData | undefined> {
	if (userId === UserStore.getCurrentUser()?.id) return await getData();

	return await authFetch(`${constants.api}api/data/${userId}`, {
		headers: {
			"if-modified-since": useCacheStore.getState().users[userId]?.at,
		} as any,
	}).then(async res => {
		if (!res) return useCacheStore.getState().users[userId]?.data;

		const data = await res.json();
		useCacheStore.getState().update({
			userId,
			data,
			at: res.headers.get("Last-Modified") || undefined,
		});
		return data;
	});
}
export async function saveData(data: UserData): Promise<true> {
	return await authFetch(`${constants.api}api/data`, {
		method: "PUT",
		body: JSON.stringify(data),
		headers: {
			"content-type": "application/json",
		},
	})
		.then(res => res?.json())
		.then(json => {
			useCacheStore
				.getState().update({
					data,
					at: new Date().toUTCString(),
				});
			return json;
		});
}
export async function deleteData(): Promise<true> {
	return await authFetch(`${constants.api}api/data`, {
		method: "DELETE",
	})
		.then(res => res?.json())
		.then(json => {
			useCacheStore.getState().delete();
			return json;
		});
}
