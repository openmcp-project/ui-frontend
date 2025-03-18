import {z} from "zod";

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

export const MemberSchema = z.object({
  kind: z.string().min(1, "Kind is required"),
  name: z.string().min(1, "Name is required"),
  roles: z.array(z.nativeEnum(MemberRoles)).min(1, "At least one role is required"),
});