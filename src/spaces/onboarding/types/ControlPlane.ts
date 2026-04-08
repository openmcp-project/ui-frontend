import { z } from 'zod';

export const ReadyStatus = {
  Ready: 'Ready',
  NotReady: 'Not Ready',
  InDeletion: 'Deleting',
  Progressing: 'Progressing',
} as const;

const ConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
  lastTransitionTime: z.string().catch(''),
});

const ConditionsSchema = z
  .array(ConditionSchema.nullish())
  .nullish()
  .default([])
  .transform((items) => (items ?? []).flatMap((item) => (item ? [item] : [])));

const AccessSchema = z.object({
  key: z.string().optional(),
  name: z.string().optional(),
  namespace: z.string().optional(),
  kubeconfig: z.string().optional(),
});

const StatusSchema = z.object({
  status: z.string(),
  phase: z.string().optional(),
  conditions: ConditionsSchema,
  access: AccessSchema.nullish(),
});

const MetadataSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  creationTimestamp: z.string(),
  annotations: z.record(z.string(), z.string()).catch({}),
});

const ControlPlaneV1Schema = z.object({
  version: z.literal('v1'),
  metadata: MetadataSchema,
  status: StatusSchema.nullish(),
});

const ControlPlaneV2Schema = z.object({
  version: z.literal('v2'),
  metadata: MetadataSchema,
  status: StatusSchema.nullish(),
});

export const ControlPlaneListItemSchema = z.discriminatedUnion('version', [ControlPlaneV1Schema, ControlPlaneV2Schema]);

export type ControlPlaneListItem = z.infer<typeof ControlPlaneListItemSchema>;
export type ControlPlaneV1ListItem = z.infer<typeof ControlPlaneV1Schema>;
export type ControlPlaneV2ListItem = z.infer<typeof ControlPlaneV2Schema>;
export type ControlPlaneStatus = z.infer<typeof StatusSchema>;
export type ControlPlaneCondition = z.infer<typeof ConditionSchema>;

// ---- ManagedControlPlaneV2 detail type ----

const SubjectSchema = z.object({
  kind: z.string().optional(),
  name: z.string().optional(),
});

const RoleRefSchema = z.object({
  kind: z.string().optional(),
  name: z.string().optional(),
});

const IamRoleBindingSchema = z.object({
  roleRefs: z.array(RoleRefSchema).optional(),
  subjects: z.array(SubjectSchema).optional(),
});

const OidcProviderSchema = z.object({
  roleBindings: z.array(IamRoleBindingSchema).optional(),
});

const IamTokenSchema = z.object({
  name: z.string().optional(),
  roleRefs: z.array(RoleRefSchema).optional(),
  permissions: z
    .object({
      rules: z
        .array(
          z.object({
            apiGroups: z.array(z.string()).optional(),
            resources: z.array(z.string()).optional(),
            verbs: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const SpecV2Schema = z.object({
  iam: z
    .object({
      oidc: z
        .object({
          defaultProvider: OidcProviderSchema.optional(),
          extraProviders: z.array(OidcProviderSchema).optional(),
        })
        .optional(),
      tokens: z.array(IamTokenSchema).optional(),
    })
    .optional(),
});

const AccessV2Schema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    }
    return val;
  },
  z
    .object({
      key: z.string().optional(),
      name: z.string().optional(),
      namespace: z.string().optional(),
      kubeconfig: z.string().optional(),
      oidc_openmcp: z.object({ name: z.string().optional() }).optional(),
    })
    .optional(),
);

const MetadataV2Schema = z.object({
  name: z.string().catch(''),
  namespace: z.string().catch(''),
  creationTimestamp: z.string().catch(''),
  annotations: z.record(z.string(), z.string()).catch({}),
});

const StatusV2Schema = z.object({
  phase: z.string().optional(),
  conditions: ConditionsSchema,
  access: AccessV2Schema,
});

export const ManagedControlPlaneV2Schema = z.object({
  metadata: MetadataV2Schema,
  spec: SpecV2Schema.optional(),
  status: StatusV2Schema.optional(),
});

export type ManagedControlPlaneV2 = z.infer<typeof ManagedControlPlaneV2Schema>;
export type ManagedControlPlaneV2Status = z.infer<typeof StatusV2Schema>;
export type IamRoleBinding = z.infer<typeof IamRoleBindingSchema>;
