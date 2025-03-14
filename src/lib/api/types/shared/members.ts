export enum MemberRoles {
	viewer = "view",
	admin ="admin",
}

export const MemberRolesDetailed = {
	[MemberRoles.viewer]: { value: MemberRoles.viewer, displayValue: "Viewer" },
	[MemberRoles.admin]: { value: MemberRoles.admin, displayValue: "Administrator" }
} as const;

export enum MemberKind {
	User = "User",
}

export interface Member {
	kind: string,
	name: string,
	roles: MemberRoles[],
}