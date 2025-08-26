export namespace Readmes {
	export interface Badge {
		text: string;
		color: LabelColor;
		icon?: string;
		value?: {
			text?: string;
			color?: string;
		};
		link?: string;
	}

	export interface EndpointBadge extends Badge {
		endpoint: string;
	}

	export interface Manifest {
		name: string;
		description: string;
		authors: {
			name: string;
			id: string;
		}[];
		main: string;
		vendetta: {
			icon: string;
		};
		hash?: string;
	}

	export interface Status {
		status: "finished" | "unfinished" | "broken" | "discontinued";
		usable?: boolean;
		reason?: {
			cause: string;
			reason: string;
		};
		external?: {
			backend?: string;
		};
	}

	export interface Plugin {
		id: string;
		name: string;
		description: string;
		status: Status["status"];
		reason?: {
			cause: string;
			reason: string;
		};
		badges: {
			status: Badge;
			links: Badge[];
		};
	}
}

export namespace Lang {
	export type Rule = {
		type: string;
		variable: string;
		start: number;
		length: number;
	};
}

export namespace Worker {
	export type PluginWorkerResponse =
		| {
			result: "yay";
			plugin: string;
		}
		| {
			result: "nay";
			err: Error;
		};

	export interface PluginWorkerRequest {
		name: string;
		lang: string | null;
		plugins: string[];
		prcess?: string;
	}
}
