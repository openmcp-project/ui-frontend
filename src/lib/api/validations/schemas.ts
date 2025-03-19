import {z} from "zod";
import {MemberRoles} from "../types/shared/members.ts";
import i18n from '../../../../i18n.ts'





const { t } = i18n;
export const MemberSchema = z.object({
  kind: z.string().min(1, t("validationErrors.required")),
  name: z.string().min(1, t("validationErrors.required")),
  roles: z.array(z.nativeEnum(MemberRoles)).min(1, t("validationErrors.required")),
});

export const validationSchemaProjectWorkspace = z.object({
  name: z.string().min(1, t("validationErrors.required")).regex(/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/, t("validationErrors.properFormatting")).max(25, t("validationErrors.max25chars")),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  members: z.array(MemberSchema).nonempty()
});