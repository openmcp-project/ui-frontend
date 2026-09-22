import { z } from 'zod';

const MetricsOperatorConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const MetricsOperatorSchema = z.object({
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
      conditions: z.array(MetricsOperatorConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type MetricsOperator = z.infer<typeof MetricsOperatorSchema>;

export type MetricsOperatorData = {
  isInstalled: boolean;
  version: string | null;
};
