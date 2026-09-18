import { z } from 'zod';
import { oidcIssuerUrlSchema, oidcProviderNameRegex } from '../../../lib/api/validations/regex.ts';

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
// k8s object name limit
export const OIDC_PROVIDER_NAME_MAX_LENGTH = 253;

// Metadata-only fields (no roleBindings) — used both as the local UI form-state shape for the
// wizard's "extraProviders" list and embedded into ExtraProviderInputSchema below.
export const ExtraProviderMetadataSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(OIDC_PROVIDER_NAME_MAX_LENGTH)
    .regex(oidcProviderNameRegex)
    .refine((n) => !(OIDC_RESERVED_PROVIDER_NAMES as readonly string[]).includes(n), {
      message: "'system' is a reserved OIDC provider name",
    }),
  issuer: oidcIssuerUrlSchema,
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

const ServiceEntrySchema = z.object({
  selected: z.boolean(),
  version: z.string().optional(),
});

const CrossplaneProviderSelectionSchema = z.object({
  name: z.string(),
  version: z.string(),
});

const CrossplaneServiceEntrySchema = ServiceEntrySchema.extend({
  providers: z.array(CrossplaneProviderSelectionSchema).optional(),
});

export const ServiceSelectionSchema = z.object({
  crossplane: CrossplaneServiceEntrySchema.optional(),
  flux: ServiceEntrySchema.optional(),
  landscaper: ServiceEntrySchema.optional(),
  externalSecretsOperator: ServiceEntrySchema.optional(),
  ocm: ServiceEntrySchema.optional(),
  kro: ServiceEntrySchema.optional(),
  metricsOperator: ServiceEntrySchema.optional(),
});

export type ServiceSelection = z.infer<typeof ServiceSelectionSchema>;
export type ServiceEntry = z.infer<typeof ServiceEntrySchema>;
export type CrossplaneServiceEntry = z.infer<typeof CrossplaneServiceEntrySchema>;
export type CrossplaneProviderSelection = z.infer<typeof CrossplaneProviderSelectionSchema>;

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
