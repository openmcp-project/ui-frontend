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

const AccessEntrySchema = z.object({ name: z.string().optional() });

// `.catchall` captures dynamic `oidc_<providerName>` keys (V2). `.catch(undefined)` on the
// catchall value tolerates non-object siblings (e.g. GraphQL `__typename`) instead of failing
// the whole parse — otherwise every control plane carrying such a key would be dropped.
const AccessSchema = z
  .object({
    key: z.string().optional(),
    name: z.string().optional(),
    namespace: z.string().optional(),
    kubeconfig: z.string().optional(),
    oidc_openmcp: AccessEntrySchema.optional(),
  })
  .catchall(AccessEntrySchema.optional().catch(undefined));

const StatusSchema = z.object({
  status: z.string(),
  phase: z.string().optional(),
  conditions: ConditionsSchema,
  access: AccessSchema.nullish(),
});

const MetadataSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  creationTimestamp: z.string().catch(''),
  annotations: z.record(z.string(), z.string()).catch({}),
});

const ComponentSchema = z.object({ __typename: z.string() }).nullish();

const SpecComponentsSchema = z
  .object({
    crossplane: ComponentSchema,
    flux: ComponentSchema,
    landscaper: ComponentSchema,
    kyverno: ComponentSchema,
    externalSecretsOperator: ComponentSchema,
    btpServiceOperator: ComponentSchema,
  })
  .nullish();

const SpecSchema = z
  .object({
    components: SpecComponentsSchema,
  })
  .nullish();

const ControlPlaneV1Schema = z.object({
  version: z.literal('v1'),
  metadata: MetadataSchema,
  spec: SpecSchema,
  status: StatusSchema.nullish(),
});

// Shared IAM schemas used by both list and detail types
const SubjectSchema = z.object({
  apiGroup: z.string().nullish(),
  kind: z.string().nullish(),
  name: z.string().nullish(),
  namespace: z.string().nullish(),
});

const RoleRefSchema = z.object({
  kind: z.string().nullish(),
  name: z.string().nullish(),
  namespace: z.string().nullish(),
});

const IamRoleBindingSchema = z.object({
  roleRefs: z.array(RoleRefSchema.nullable()).nullish(),
  subjects: z.array(SubjectSchema.nullable()).nullish(),
});

const OidcProviderSchema = z.object({
  roleBindings: z.array(IamRoleBindingSchema.nullable()).nullish(),
});

// List items only query `name` and `roleBindings`; the rest is detail-page only.
const ExtraOidcProviderListSchema = z.object({
  name: z.string().nullish(),
  roleBindings: z.array(IamRoleBindingSchema.nullable()).nullish(),
});

const ExtraOidcProviderSchema = z.object({
  name: z.string().nullish(),
  issuer: z.string().nullish(),
  clientID: z.string().nullish(),
  usernameClaim: z.string().nullish(),
  usernamePrefix: z.string().nullish(),
  groupsClaim: z.string().nullish(),
  groupsPrefix: z.string().nullish(),
  extraScopes: z.array(z.string().nullable()).nullish(),
  roleBindings: z.array(IamRoleBindingSchema.nullable()).nullish(),
});

const ControlPlaneV2Schema = z.object({
  version: z.literal('v2'),
  metadata: MetadataSchema,
  status: StatusSchema.nullish(),
  spec: z
    .object({
      iam: z
        .object({
          oidc: z
            .object({
              defaultProvider: OidcProviderSchema.nullish(),
              extraProviders: z.array(ExtraOidcProviderListSchema.nullable()).nullish(),
            })
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

export const ControlPlaneListItemSchema = z.discriminatedUnion('version', [ControlPlaneV1Schema, ControlPlaneV2Schema]);

export type ControlPlaneListItem = z.infer<typeof ControlPlaneListItemSchema>;
export type ControlPlaneV1ListItem = z.infer<typeof ControlPlaneV1Schema>;
export type ControlPlaneV2ListItem = z.infer<typeof ControlPlaneV2Schema>;
export type ControlPlaneStatus = z.infer<typeof StatusSchema>;
export type ControlPlaneCondition = z.infer<typeof ConditionSchema>;

// ---- ManagedControlPlaneV2 detail type (used by GetMcpServiceV2) ----

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
      oidc_openmcp: AccessEntrySchema.optional(),
    })
    .catchall(AccessEntrySchema.optional().catch(undefined))
    .optional(),
);

const StatusV2Schema = z.object({
  phase: z.string().nullish(),
  conditions: ConditionsSchema,
  access: AccessV2Schema.nullish(),
});

const SpecV2Schema = z.object({
  iam: z
    .object({
      oidc: z
        .object({
          defaultProvider: OidcProviderSchema.nullish(),
          extraProviders: z.array(ExtraOidcProviderSchema.nullable()).nullish(),
        })
        .nullish(),
      tokens: z
        .array(
          z
            .object({
              name: z.string().nullish(),
              permissions: z
                .array(
                  z
                    .object({
                      name: z.string().nullish(),
                      namespace: z.string().nullish(),
                      rules: z
                        .array(
                          z.object({
                            apiGroups: z.array(z.string().nullable()).nullish(),
                            nonResourceURLs: z.array(z.string().nullable()).nullish(),
                            resourceNames: z.array(z.string().nullable()).nullish(),
                            resources: z.array(z.string().nullable()).nullish(),
                            verbs: z.array(z.string().nullable()).nullish(),
                          }),
                        )
                        .nullish(),
                    })
                    .nullable(),
                )
                .nullish(),
              roleRefs: z.array(RoleRefSchema.nullable()).nullish(),
            })
            .nullable(),
        )
        .nullish(),
    })
    .nullish(),
});

const MetadataV2Schema = z.object({
  name: z.string().catch(''),
  namespace: z.string().catch(''),
  creationTimestamp: z.string().catch(''),
  annotations: z.record(z.string(), z.string()).catch({}),
});

export const ManagedControlPlaneV2Schema = z.object({
  metadata: MetadataV2Schema,
  spec: SpecV2Schema.nullish(),
  status: StatusV2Schema.nullish(),
});

export type ManagedControlPlaneV2 = z.infer<typeof ManagedControlPlaneV2Schema>;
export type ManagedControlPlaneV2Status = z.infer<typeof StatusV2Schema>;
export type ManagedControlPlaneV2Condition = z.infer<typeof ConditionSchema>;
export type IamRoleBinding = z.infer<typeof IamRoleBindingSchema>;
export type ExtraOidcProvider = z.infer<typeof ExtraOidcProviderSchema>;
