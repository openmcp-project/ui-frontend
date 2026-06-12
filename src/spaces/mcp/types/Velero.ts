import { z } from 'zod';

const VeleroConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const VeleroSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string().nullish(),
  }),
  spec: z
    .object({
      version: z.string().nullish(),
    })
    .nullish(),
  status: z
    .object({
      conditions: z.array(VeleroConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Velero = z.infer<typeof VeleroSchema>;

export type VeleroData = {
  isInstalled: boolean;
  version: string | null;
};
