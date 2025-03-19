import {z} from "zod";
import {MemberRoles} from "../types/shared/members.ts";

export const MemberSchema = z.object({
  kind: z.string().min(1, "Kind is required"),
  name: z.string().min(1, "Name is required"),
  roles: z.array(z.nativeEnum(MemberRoles)).min(1, "At least one role is required"),
});

export const validationSchemaProjectWorkspace = z.object({
  name: z.string().min(1, "This field is required").regex(/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/, 'Use A-Z, a-z, 0-9, hyphen (-), and period (.), but note that whitespace (spaces, tabs, etc.) is not allowed for proper compatibility.').max(25, 'Max length is 25 characters'),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  members: z.array(MemberSchema).nonempty()
});