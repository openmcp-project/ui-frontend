import { z } from 'zod';

export const ReadyStatus = {
  Ready: 'Ready',
  NotReady: 'Not Ready',
  InDeletion: 'Deleting',
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
