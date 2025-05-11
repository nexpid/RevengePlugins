export interface ManifestV1 {
	required: Record<string, string>;
	games: {
		title: string;
		id: string;
		root: string;
	}[];
}

export const manifestVer = "v1";
