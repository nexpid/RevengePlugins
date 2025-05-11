import { logger } from "@vendetta";
import { findByStoreName } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { lang } from "..";
import constants from "../constants";
import { useAuthorizationStore } from "../stores/AuthorizationStore";
import { useCacheStore } from "../stores/CacheStore";
import type { UserData } from "../types";

const UserStore = findByStoreName("UserStore");

export async function authFetch(_url: string | URL, options?: RequestInit) {
	const url = new URL(_url);

	const res = await fetch(url, {
		...options,
		headers: {
			...options?.headers,
			authorization: useAuthorizationStore.getState().token,
		} as any,
	});

	if (res.ok) return res;

	// not modified
	if (res.status === 304) return null;

	const text = await res.text();
	showToast(
		!text.includes("<body>") && res.status >= 400 && res.status <= 599
			? lang.format("toast.fetch_error_detailed", { error_msg: text })
			: lang.format("toast.fetch_error", { urlpath: url.pathname }),
		getAssetIDByName("CircleXIcon-primary"),
	);
	logger.error(
		"authFetch error",
		options?.method ?? "GET",
		url.toString(),
		res.status,
		text,
	);
	throw new Error(text);
}

export const redirectRoute = "api/auth/authorize";

export async function getData(): Promise<UserData | undefined> {
	return await authFetch(`${constants.api}api/data`, {
		headers: {
			"if-modified-since": useCacheStore.getState().at,
		} as any,
	}).then(async res => {
		if (!res) return useCacheStore.getState().data;

		const dt = await res.json();
		useCacheStore
			.getState()
			.updateData(
				null,
				dt || [],
				res.headers.get("last-modified") ?? undefined,
			);
		return dt;
	});
}
export async function listData(userId: string): Promise<UserData | undefined> {
	if (userId === UserStore.getCurrentUser()?.id) return await getData();

	return await authFetch(`${constants.api}api/data/${userId}`, {
		headers: {
			"if-modified-since": useCacheStore.getState().dir[userId]?.at,
		} as any,
	}).then(async res => {
		if (!res) return useCacheStore.getState().dir[userId]?.data;

		const dt = await res.json();
		useCacheStore
			.getState()
			.updateData(
				userId,
				dt || undefined,
				res.headers.get("last-modified") ?? undefined,
			);
		return dt;
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
				.getState()
				.updateData(null, data, new Date().toUTCString());
			return json;
		});
}
export async function deleteData(): Promise<true> {
	return await authFetch(`${constants.api}api/data`, {
		method: "DELETE",
	})
		.then(res => res?.json())
		.then(json => {
			useCacheStore.getState().updateData(null);
			return json;
		});
}
