export interface DisplayProfileData {
	displayProfile: {
		userId: string;
		guildId?: string;
		banner?: string;
		bio?: string;
		pronouns: string;
		accentColor?: number;
		emoji?: any;
		themeColors?: number[];
		popoutAnimationParticleType?: any;
		_profileThemesExperimentBucket?: number;
		_guildMemberProfile?: GuildMemberProfile;
	};
	user: User;
}

export interface User {
	hasFlag: (flag: any) => boolean;
	isStaff: () => boolean;
	isStaffPersonal: () => boolean;
	hasAnyStaffLevel: () => boolean;
	id: string;
	username: string;
	discriminator: string;
	avatar?: string;
	avatarDecoration?: string;
	email?: string;
	verified: boolean;
	bot: boolean;
	system: boolean;
	mfaEnabled: boolean;
	mobile: boolean;
	desktop: boolean;
	premiumType?: number;
	flags: number;
	publicFlags: number;
	purchasedFlags: number;
	premiumUsageFlags: number;
	phone?: string;
	nsfwAllowed?: boolean;
	guildMemberAvatars: Record<string, string>;
	hasBouncedEmail: boolean; // ???
	personalConnectionId?: any; // ???
	globalName: string;
}

export interface GuildMemberProfile {
	userId: string;
	guildId: string;
	avatar?: string;
	banner?: string;
	accentColor?: number;
	emoji?: any;
	themeColors?: number[];
	popoutAnimationParticleType?: any;
	bio?: string;
	pronouns?: string;
	badges: any[];
}

export interface ReactionEvent {
	channelId: string;
	messageId: string;
	userId: string;
	emoji: { name: string; id?: string; animated?: boolean };
	burst: boolean;
	colors: string[];
	messageAuthorId: string;
}

type VendettaSysColor = [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
];
export type VendettaSysColors = Record<
	"neutral1" | "neutral2" | "accent1" | "accent2" | "accent3",
	VendettaSysColor
>;

type PlusColorResolvable =
	| string
	| [string, string | undefined, string | undefined, string | undefined];
export interface PlusStructureV0 {
	icons?: Record<string, PlusColorResolvable>;
	mentionLineColor?: PlusColorResolvable;
	customOverlays?: boolean;
	iconpack?: string;
	version: 0;
}

export type PlusStructure = PlusStructureV0;

export type ThemeWithPlus = Theme & {
	data: ThemeDataWithPlus;
};
export type ThemeDataWithPlus = ThemeData & {
	plus?: PlusStructure;
};
