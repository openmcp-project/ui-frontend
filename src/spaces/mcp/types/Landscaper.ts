import { z } from 'zod';

const LandscaperConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const LandscaperSchema = z.object({
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
      phase: z.string().nullish(),
      conditions: z.array(LandscaperConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Landscaper = z.infer<typeof LandscaperSchema>;

export type LandscaperData = {
  isInstalled: boolean;
  version: string | null;
};
