import { z } from 'zod';

const KroConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const KroSchema = z.object({
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
      conditions: z.array(KroConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Kro = z.infer<typeof KroSchema>;

export type KroData = {
  isInstalled: boolean;
  version: string | null;
};
