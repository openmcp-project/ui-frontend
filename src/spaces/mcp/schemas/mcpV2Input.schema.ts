import { z } from 'zod';

const RoleRefSchema = z.object({
  kind: z.enum(['ClusterRole', 'Role']),
  name: z.string().min(1),
});

const SubjectSchema = z.object({
  kind: z.enum(['User', 'Group']),
  name: z.string().min(1),
  apiGroup: z.string().optional(),
});

const RoleBindingSchema = z.object({
  roleRefs: z.array(RoleRefSchema).min(1),
  subjects: z.array(SubjectSchema),
});

const ServiceEntrySchema = z.object({
  selected: z.boolean(),
  version: z.string().optional(),
});

export const ServiceSelectionSchema = z.object({
  crossplane: ServiceEntrySchema.optional(),
  flux: ServiceEntrySchema.optional(),
  landscaper: ServiceEntrySchema.optional(),
  externalSecretsOperator: ServiceEntrySchema.optional(),
});

export type ServiceSelection = z.infer<typeof ServiceSelectionSchema>;
export type ServiceEntry = z.infer<typeof ServiceEntrySchema>;

export const McpV2InputSchema = z.object({
  name: z.string().min(1),
  namespace: z.string().min(1),
  roleBindings: z.array(RoleBindingSchema),
  services: ServiceSelectionSchema.optional(),
});

export type McpV2Input = z.infer<typeof McpV2InputSchema>;
