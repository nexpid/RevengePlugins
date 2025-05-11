export interface FullPlugin {
	name: string;
	description: string;
	authors: {
		name: string;
		id: string;
	}[];
	main: string;
	vendetta: {
		icon?: string;
		original: string;
	};
	bunny?: {
		disabled?: boolean;
	};
	hash: string;
}
