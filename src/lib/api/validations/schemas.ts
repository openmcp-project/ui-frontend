import {z} from "zod";
import {MemberRoles} from "../types/shared/members.ts";

export const MemberSchema = z.object({
  kind: z.string().min(1, "Kind is required"),
  name: z.string().min(1, "Name is required"),
  roles: z.array(z.nativeEnum(MemberRoles)).min(1, "At least one role is required"),
});

export const validationSchemaProjectWorkspace = z.object({
  name: z.string().min(1, "Name is required").regex(/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/, 'Invalid'),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  members: z.array(MemberSchema).nonempty()
});