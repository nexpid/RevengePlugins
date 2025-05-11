import { getLocale } from "$/lib/intlProxy";
import { findByProps } from "@vendetta/metro";

const cache = new Map<string, any>();

const { get } = findByProps("get", "post", "put", "patch", "delete");

export interface APICategory {
	id: number;
	name: string;
}
export async function getAppDirectoryCategories(): Promise<APICategory[]> {
	const locale = getLocale();

	const cacheKey = `app_directory_categories|${locale}`;
	const res = cache.get(cacheKey)
		?? (await get(`/application-directory-static/categories?locale=${locale}`));
	cache.set(cacheKey, res);

	return res.body;
}

export interface APIApplication {
	id: string;
	name: string;
	icon: string;
	description: string;
	summary: string;
	type: unknown;
	primary_sku_id: string;
	bot: {
		id: string;
		username: string;
		global_name: string | null;
		avatar: string;
		avatar_decoration_data: any | null;
		discriminator: string;
		public_flags: number;
		bot: boolean;
	};
	hook: boolean;
	slug: string;
	guild_id: string;
	bot_public: boolean;
	bot_require_code_grant: boolean;
	custom_install_url?: string;
	terms_of_service_url: string;
	privacy_policy_url: string;
	install_params: {
		scopes: string[];
		permissions: string;
	};
	verify_key: string;
	flags: any;
	tags: string[];
}

export interface APIApplicationCommand {
	id: string;
	application_id: string;
	version: string;
	default_member_permissions: any | null;
	type: unknown;
	nsfw: boolean;
	name: string;
	description: string;
	dm_permission: boolean;
	contexts: any | null;
	integration_types: unknown[];
	options: {
		type: unknown;
		name: string;
		description: string;
		required: boolean;
	}[];
}

export type APICollectionApplication = APIApplication & {
	categories: APICategory[];
	directory_entry: {
		guild_count: number;
		detailed_description: string | null;
		carousel_items:
			| {
				type: unknown;
				url: string;
				proxy_url: string;
			}[]
			| null;
		supported_locales: string[];
		external_urls: {
			name: string;
			url: string;
		}[];
		popular_application_command_ids: string[];
		short_description: string;
	};
};

export interface APICollectionItem {
	application: APICollectionApplication;
	id: string;
	image_hash: null;
	position: number;
	type: unknown;
}

export enum APICollectionType {
	Small = 1,
	Medium = 2,
	Big = 3,
}

export interface APICollection {
	active: boolean;
	application_directory_collection_items: APICollectionItem[];
	description: string;
	id: string;
	position: number;
	title: string;
	type: APICollectionType;
}

export async function getAppDirectoryCollections(): Promise<APICollection[]> {
	const locale = getLocale();

	const cacheKey = `app_directory_collections|${locale}`;
	const res = cache.get(cacheKey)
		?? (await get(
			`/application-directory-static/collections?include_inactive=false&locale=${locale}`,
		));
	cache.set(cacheKey, res);

	return res.body;
}

export type APIAppDirectoryApplication = APICollectionApplication & {
	directory_entry: {
		popular_application_commands: APIApplicationCommand[];
	};
};

export async function getAppDirectoryApplication(
	appId: string,
): Promise<APIAppDirectoryApplication> {
	const locale = getLocale();

	const cacheKey = `app_directory_application|${appId},${locale}`;
	const res = cache.get(cacheKey)
		?? (await get(
			`/application-directory-static/applications/${appId}?locale=${locale}`,
		));
	cache.set(cacheKey, res);

	return res.body;
}

export interface APIAppDirectorySearchResult {
	data: APICollectionApplication;
	type: unknown;
}

export interface APIAppDirectorySearch {
	counts_by_category: Record<number, number>;
	load_id: string;
	num_pages: number;
	result_count: number;
	results: APIAppDirectorySearchResult[];
	type: unknown;
}

export async function searchAppDirectory(
	query: string,
	page: number,
	category: number,
	guildId?: string,
): Promise<APIAppDirectorySearch> {
	const locale = getLocale();

	const cacheKey =
		`app_directory_search|${query},${page},${category},${guildId},${locale}`;

	const params = new URLSearchParams();
	params.append("query", query);
	params.append("page", page.toString());
	params.append("category_id", category.toString());
	if (guildId) params.append("guild_id", guildId);
	params.append("locale", locale);

	const res = cache.get(cacheKey)
		?? (await get(`/application-directory-static/search?${params.toString()}`));
	cache.set(cacheKey, res);

	return res.body;
}
