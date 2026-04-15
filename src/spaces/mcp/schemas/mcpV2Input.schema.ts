import { z } from 'zod';

const RoleRefSchema = z.object({
  kind: z.enum(['ClusterRole', 'Role']),
  name: z.string().min(1),
});

const SubjectSchema = z.object({
  kind: z.enum(['User', 'Group', 'ServiceAccount']),
  name: z.string().min(1),
});

const RoleBindingSchema = z.object({
  roleRefs: z.array(RoleRefSchema).min(1),
  subjects: z.array(SubjectSchema).min(1),
});

export const McpV2InputSchema = z.object({
  name: z.string().min(1),
  namespace: z.string().min(1),
  roleBindings: z.array(RoleBindingSchema).min(1),
});

export type McpV2Input = z.infer<typeof McpV2InputSchema>;
