import { z } from 'zod';

const OcmConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const OcmSchema = z.object({
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
      conditions: z.array(OcmConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Ocm = z.infer<typeof OcmSchema>;

export type OcmData = {
  isInstalled: boolean;
  version: string | null;
};
