import { z } from 'zod';

const CrossplaneProviderSchema = z.object({
  name: z.string().nullish(),
  version: z.string().nullish(),
});

const CrossplaneConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
});

export const CrossplaneSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string().nullish(),
  }),
  spec: z
    .object({
      version: z.string().nullish(),
      providers: z.array(CrossplaneProviderSchema.nullable()).nullish(),
    })
    .nullish(),
  status: z
    .object({
      conditions: z.array(CrossplaneConditionSchema.nullable()).nullish(),
    })
    .nullish(),
});

export type Crossplane = z.infer<typeof CrossplaneSchema>;
export type CrossplaneProvider = z.infer<typeof CrossplaneProviderSchema>;

export type CrossplaneData = {
  isInstalled: boolean;
  version: string | null;
  providers: CrossplaneProvider[];
};
