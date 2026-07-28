import { z } from 'zod';
import { oidcIssuerUrlRegex, oidcProviderNameRegex } from '../../../lib/api/validations/regex.ts';

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

export const OIDC_RESERVED_PROVIDER_NAMES = ['system'] as const;

// Metadata-only fields (no roleBindings) — used both as the local UI form-state shape for the
// wizard's "extraProviders" list and embedded into ExtraProviderInputSchema below.
export const ExtraProviderMetadataSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(253)
    .regex(oidcProviderNameRegex)
    .refine((n) => !(OIDC_RESERVED_PROVIDER_NAMES as readonly string[]).includes(n), {
      message: "'system' is a reserved OIDC provider name",
    }),
  issuer: z.string().min(1).regex(oidcIssuerUrlRegex),
  clientID: z.string().min(1),
  usernameClaim: z.string().optional(),
  // '' (explicit) vs undefined (use CRD default '<name>:') must be preserved distinctly.
  usernamePrefix: z.string().optional(),
  groupsClaim: z.string().optional(),
  groupsPrefix: z.string().optional(),
  extraScopes: z.array(z.string()).optional(),
});
export type ExtraProviderMetadata = z.infer<typeof ExtraProviderMetadataSchema>;

export const ExtraProviderInputSchema = ExtraProviderMetadataSchema.extend({
  roleBindings: z.array(RoleBindingSchema),
});
export type ExtraProviderInput = z.infer<typeof ExtraProviderInputSchema>;

export const McpV2InputSchema = z
  .object({
    name: z.string().min(1),
    namespace: z.string().min(1),
    roleBindings: z.array(RoleBindingSchema), // default provider; [] = disabled
    extraProviders: z.array(ExtraProviderInputSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.extraProviders.forEach((p, idx) => {
      if (seen.has(p.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['extraProviders', idx, 'name'],
          message: 'Duplicate OIDC provider name',
        });
      }
      seen.add(p.name);
    });
  });

export type McpV2Input = z.infer<typeof McpV2InputSchema>;
