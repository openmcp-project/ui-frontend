import { z } from 'zod';

const FluxConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const FluxSchema = z.object({
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
      conditions: z.array(FluxConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Flux = z.infer<typeof FluxSchema>;

export type FluxData = {
  isInstalled: boolean;
  version: string | null;
};
