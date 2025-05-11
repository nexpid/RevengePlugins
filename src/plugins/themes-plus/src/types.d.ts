export interface IconpackConfig {
	biggerStatus?: boolean;
}

export interface Iconpack {
	id: string;
	name: string;
	description: string;
	credits: {
		authors: {
			name: string;
			id?: string;
		}[];
		/** @deprecated */
		source?: string;
		sources: string[];
	};
	config: string | undefined;
	suffix: string;
	load: string;
}

export interface IconpackData {
	$schema: string;
	list: Iconpack[];
}

export interface BunnyAsset {
	httpServerLocation: string;
	width: number;
	height: number;
	name: string;
	type: string;
}
