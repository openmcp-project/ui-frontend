import { z } from 'zod';

const EsoConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const EsoSchema = z.object({
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
      conditions: z.array(EsoConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Eso = z.infer<typeof EsoSchema>;

export type EsoData = {
  isInstalled: boolean;
  version: string | null;
};
